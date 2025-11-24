// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IMentoExchange {
    function exchangeOut(
        address stableToken,
        address collateralToken,
        uint256 stableAmount
    ) external returns (uint256);
    
    function exchangeIn(
        address stableToken,
        address collateralToken,
        uint256 collateralAmount
    ) external returns (uint256);
}

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

    IMentoExchange public mentoExchange;
    IUniswapV4Router public uniswapV4Router;
    
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
        address _mentoExchange,
        address _uniswapV4Router,
        address _emergencyPauseAdmin
    ) Ownable(msg.sender) {
        require(_mentoExchange != address(0), "Invalid Mento address");
        require(_uniswapV4Router != address(0), "Invalid Uniswap address");
        require(_emergencyPauseAdmin != address(0), "Invalid admin address");
        
        mentoExchange = IMentoExchange(_mentoExchange);
        uniswapV4Router = IUniswapV4Router(_uniswapV4Router);
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

    function executeFXSwap(
        address _user,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bool _useMento
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

        try {
            if (_useMento) {
                amountOut = _executeMentoSwap(_tokenIn, _tokenOut, _amountIn);
            } else {
                amountOut = _executeUniswapSwap(_tokenIn, _tokenOut, _amountIn);
            }
        } catch Error(string memory reason) {
            userStats[_user].failedSwaps++;
            emit SwapFailed(_user, reason, block.timestamp);
            revert(reason);
        }

        require(amountOut >= _minAmountOut, "Slippage exceeded");
        
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

    function _executeMentoSwap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) internal returns (uint256) {
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).safeApprove(address(mentoExchange), _amountIn);
        
        uint256 amountOut = mentoExchange.exchangeOut(_tokenOut, _tokenIn, _amountIn);
        return amountOut;
    }

    function _executeUniswapSwap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) internal returns (uint256) {
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).safeApprove(address(uniswapV4Router), _amountIn);
        
        uint256 minAmountOut = (_amountIn * (10000 - maxSlippagePercentage)) / 10000;
        uint256 amountOut = uniswapV4Router.swap(_tokenIn, _tokenOut, _amountIn, minAmountOut, "");
        
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
}
