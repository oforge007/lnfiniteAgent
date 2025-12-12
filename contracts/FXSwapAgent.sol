// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// Updated interface for Mento Broker (current v2, adaptable for v3)
interface IMentoBroker {
    function swap(
        address exchangeProvider,
        bytes32 exchangeId,
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256);

    function getAmountOut(
        address exchangeProvider,
        bytes32 exchangeId,
        address assetIn,
        address assetOut,
        uint256 amountIn
    ) external view returns (uint256);
}

// Interface for BiPoolManager to get exchangeId (for v2)
interface IBiPoolManager {
    function getExchangeId(address asset0, address asset1) external view returns (bytes32);
}

// Keep Uniswap V4 interface as provided
interface IUniswapV4Router {
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes calldata swapData
    ) external returns (uint256);
}

contract FXSwapAgent is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IMentoBroker public mentoBroker;
    IBiPoolManager public biPoolManager;
    IUniswapV4Router public uniswapV4Router;

    // For future-proofing: exchange provider address (BiPoolManager for v2, potentially FPMMFactory for v3)
    address public mentoExchangeProvider;

    // Access control: Agent addresses authorized to execute trades
    mapping(address => bool) public authorizedAgents;

    // User trading limits and safety parameters
    mapping(address => UserLimits) public userLimits;
    mapping(address => UserStats) public userStats;

    // Per-user rate limiting
    mapping(address => uint256) public lastExecutionTime;
    uint256 public constant MIN_EXECUTION_INTERVAL = 5 seconds;

    // Slippage and safety parameters
    uint256 public maxSlippagePercentage = 500; // 5% in basis points
    uint256 public maxSingleSwapAmount = 1_000_000e18; // Max 1M stable tokens

    struct UserLimits {
        uint256 maxDailyVolume;
        uint256 maxSingleSwapAmount;
        uint256 dailyVolumeUsed;
        uint256 lastResetTime;
    }

    struct UserStats {
        uint256 totalSwapsExecuted;
        uint256 totalVolumeTraded;
        uint256 successfulSwaps;
        uint256 failedSwaps;
    }

    struct SwapExecution {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutReceived;
        uint256 minAmountOutExpected;
        bool success;
        uint256 timestamp;
    }

    // Audit trail for all executions
    SwapExecution[] public executionHistory;
    mapping(address => uint256[]) public userExecutions;

    // Emergency controls
    bool public emergencyPauseEnabled;
    address public emergencyPauseAdmin;
    mapping(address => bool) public blacklistedUsers;

    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    event SwapFailed(address indexed user, string reason, uint256 timestamp);
    event UserLimitUpdated(address indexed user, uint256 dailyLimit, uint256 singleSwapLimit);
    event UserBlacklisted(address indexed user, bool status);
    event EmergencyPause(bool enabled, uint256 timestamp);

    constructor(
        address _mentoBroker,
        address _biPoolManager,
        address _uniswapV4Router,
        address _emergencyPauseAdmin
    ) Ownable(msg.sender) {
        require(_mentoBroker != address(0), "Invalid Mento Broker address");
        require(_biPoolManager != address(0), "Invalid BiPoolManager address");
        require(_uniswapV4Router != address(0), "Invalid Uniswap address");
        require(_emergencyPauseAdmin != address(0), "Invalid admin address");

        mentoBroker = IMentoBroker(_mentoBroker);
        biPoolManager = IBiPoolManager(_biPoolManager);
        uniswapV4Router = IUniswapV4Router(_uniswapV4Router);
        mentoExchangeProvider = _biPoolManager; // Default to BiPoolManager for v2
        emergencyPauseAdmin = _emergencyPauseAdmin;
    }

    function authorizeAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Invalid agent address");
        authorizedAgents[_agent] = true;
        emit AgentAuthorized(_agent);
    }

    function revokeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = false;
        emit AgentRevoked(_agent);
    }

    function setUserLimits(
        address _user,
        uint256 _maxDailyVolume,
        uint256 _maxSingleSwapAmount
    ) external onlyOwner {
        require(_user != address(0), "Invalid user");
        require(_maxDailyVolume > 0 && _maxSingleSwapAmount > 0, "Invalid limits");

        userLimits[_user] = UserLimits({
            maxDailyVolume: _maxDailyVolume,
            maxSingleSwapAmount: _maxSingleSwapAmount,
            dailyVolumeUsed: 0,
            lastResetTime: block.timestamp
        });

        emit UserLimitUpdated(_user, _maxDailyVolume, _maxSingleSwapAmount);
    }

    // Updated executeFXSwap to use Mento v2 Broker, with provisions for v3 (e.g., update exchangeProvider)
    function executeFXSwap(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bool _useMento,
        bytes calldata _swapData // For Uniswap or potential v3 data
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(authorizedAgents[msg.sender], "Unauthorized agent");
        require(_user != address(0), "Invalid user");
        require(!blacklistedUsers[_user], "User blacklisted");
        require(_tokenIn != address(0) && _tokenOut != address(0), "Invalid tokens");
        require(_amountIn > 0, "Invalid amount");
        require(
            block.timestamp >= lastExecutionTime[_user] + MIN_EXECUTION_INTERVAL,
            "Execution too frequent"
        );
        lastExecutionTime[_user] = block.timestamp;

        _validateUserLimits(_user, _amountIn);

        uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));

        try this._executeSwap(_user, _tokenIn, _tokenOut, _amountIn, _minAmountOut, _useMento, _swapData) returns (uint256 _amountOut) {
            amountOut = _amountOut;
        } catch Error(string memory reason) {
            userStats[_user].failedSwaps++;
            emit SwapFailed(_user, reason, block.timestamp);
            revert(reason);
        }

        uint256 balanceAfter = IERC20(_tokenOut).balanceOf(address(this));
        require(balanceAfter - balanceBefore == amountOut, "Balance mismatch");

        IERC20(_tokenOut).safeTransfer(_user, amountOut);

        userStats[_user].successfulSwaps++;
        userStats[_user].totalSwapsExecuted++;
        userStats[_user].totalVolumeTraded += _amountIn;
        userLimits[_user].dailyVolumeUsed += _amountIn;

        uint256 executionIndex = executionHistory.length;
        executionHistory.push(SwapExecution({
            user: _user,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOutReceived: amountOut,
            minAmountOutExpected: _minAmountOut,
            success: true,
            timestamp: block.timestamp
        }));
        userExecutions[_user].push(executionIndex);

        emit SwapExecuted(_user, _tokenIn, _tokenOut, _amountIn, amountOut, block.timestamp);

        return amountOut;
    }

    // Internal wrapper to catch errors
    function _executeSwap(
        address /* _user */,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bool _useMento,
        bytes calldata _swapData
    ) external returns (uint256) {
        require(msg.sender == address(this), "Internal call only");

        uint256 amountOut;
        if (_useMento) {
            amountOut = _executeMentoSwap(_tokenIn, _tokenOut, _amountIn, _minAmountOut, _swapData);
        } else {
            amountOut = _executeUniswapSwap(_tokenIn, _tokenOut, _amountIn, _minAmountOut, _swapData);
        }
        return amountOut;
    }

    function _executeMentoSwap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bytes calldata /* _swapData */ // Can be used for v3-specific data if needed
    ) internal returns (uint256) {
        // Compute exchangeId using BiPoolManager (for v2)
        bytes32 exchangeId = biPoolManager.getExchangeId(_tokenIn, _tokenOut);

        // Optional: Check expected out for additional slippage check
        uint256 expectedOut = mentoBroker.getAmountOut(mentoExchangeProvider, exchangeId, _tokenIn, _tokenOut, _amountIn);
        // Adjust maxSlippage if needed
        uint256 slippageAdjusted = (expectedOut * (10000 - maxSlippagePercentage)) / 10000;
        if (_minAmountOut < slippageAdjusted) {
            _minAmountOut = slippageAdjusted;
        }

        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).safeApprove(address(mentoBroker), _amountIn);

        uint256 amountOut = mentoBroker.swap(mentoExchangeProvider, exchangeId, _tokenIn, _tokenOut, _amountIn, _minAmountOut);

        return amountOut;
    }

    function _executeUniswapSwap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bytes calldata _swapData
    ) internal returns (uint256) {
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).safeApprove(address(uniswapV4Router), _amountIn);

        // Use provided minAmountOut or calculate
        if (_minAmountOut == 0) {
            _minAmountOut = (_amountIn * (10000 - maxSlippagePercentage)) / 10000;
        }
        uint256 amountOut = uniswapV4Router.swap(_tokenIn, _tokenOut, _amountIn, _minAmountOut, _swapData);

        return amountOut;
    }

    function _validateUserLimits(address _user, uint256 _amount) internal {
        UserLimits storage limits = userLimits[_user];

        // Reset daily volume if new day
        if (block.timestamp >= limits.lastResetTime + 1 days) {
            limits.dailyVolumeUsed = 0;
            limits.lastResetTime = block.timestamp;
        }

        require(_amount <= limits.maxSingleSwapAmount, "Single swap exceeds limit");
        require(
            limits.dailyVolumeUsed + _amount <= limits.maxDailyVolume,
            "Daily volume limit exceeded"
        );
        require(_amount <= maxSingleSwapAmount, "Global single swap limit exceeded");
    }

    function blacklistUser(address _user, bool _status) external onlyOwner {
        blacklistedUsers[_user] = _status;
        emit UserBlacklisted(_user, _status);
    }

    function emergencyPause(bool _paused) external {
        require(msg.sender == emergencyPauseAdmin || msg.sender == owner(), "Unauthorized");
        emergencyPauseEnabled = _paused;
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
        emit EmergencyPause(_paused, block.timestamp);
    }

    function getExecutionHistory(uint256 _limit, uint256 _offset)
        external
        view
        returns (SwapExecution[] memory)
    {
        require(_limit <= 100, "Limit too high");
        uint256 end = _offset + _limit;
        if (end > executionHistory.length) {
            end = executionHistory.length;
        }

        SwapExecution[] memory history = new SwapExecution[](end - _offset);
        for (uint256 i = 0; i < end - _offset; i++) {
            history[i] = executionHistory[_offset + i];
        }
        return history;
    }

    function getUserExecutionCount(address _user)
        external
        view
        returns (uint256)
    {
        return userExecutions[_user].length;
    }

    function setMaxSlippage(uint256 _slippageBps) external onlyOwner {
        require(_slippageBps <= 1000, "Slippage too high"); // Max 10%
        maxSlippagePercentage = _slippageBps;
    }

    // Additional function for future updates (e.g., to FPMM for Mento v3)
    function setMentoExchangeProvider(address _newProvider) external onlyOwner {
        require(_newProvider != address(0), "Invalid provider");
        mentoExchangeProvider = _newProvider;
    }

    // For ZK transition: No specific changes needed as Celo's ZK L2 is EVM-compatible, but monitor for any gas optimizations or ZK-specific features in future.
}
