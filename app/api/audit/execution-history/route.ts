import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"

const FX_SWAP_ABI = [
  "function getExecutionHistory(uint256 limit, uint256 offset) public view returns (tuple(address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutReceived, uint256 minAmountOutExpected, bool success, uint256 timestamp)[] executions)",
  "function getUserExecutionCount(address user) public view returns (uint256)",
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 100)
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL)
    const contractAddress = process.env.FX_SWAP_CONTRACT!
    const contract = new ethers.Contract(contractAddress, FX_SWAP_ABI, provider)

    // Fetch user execution count
    const executionCount = await contract.getUserExecutionCount(userId)

    // Fetch execution history
    const history = await contract.getExecutionHistory(limit, offset)

    return NextResponse.json({
      userId,
      totalExecutions: executionCount.toString(),
      executionHistory: history.map((exec) => ({
        user: exec.user,
        tokenIn: exec.tokenIn,
        tokenOut: exec.tokenOut,
        amountIn: exec.amountIn.toString(),
        amountOut: exec.amountOutReceived.toString(),
        success: exec.success,
        timestamp: new Date(exec.timestamp * 1000).toISOString(),
      })),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < executionCount,
      },
    })
  } catch (error) {
    console.error("[v0] Audit history error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch execution history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
