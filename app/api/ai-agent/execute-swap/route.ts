import { type NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { keyManager } from "@/lib/key-manager"
import { rateLimiter } from "@/lib/rate-limiter"

// Initialize contract interface
const FX_SWAP_ABI = [
  "function executeFXSwap(address user, address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, bool useMento) public returns (uint256)",
  "function userStats(address) public view returns (uint256, uint256, uint256, uint256)",
  "function userLimits(address) public view returns (uint256, uint256, uint256, uint256)",
]

interface SwapRequest {
  userId: string
  agentId: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  useMento: boolean
  signature: string // Pre-signed by AI agent
}

function validateRequestSignature(request: SwapRequest, publicKey: string): boolean {
  try {
    const message = ethers.solidityPacked(
      ["address", "address", "address", "uint256", "uint256", "bool"],
      [request.userId, request.tokenIn, request.tokenOut, request.amountIn, request.minAmountOut, request.useMento],
    )

    const recovered = ethers.verifyMessage(message, request.signature)
    return recovered === publicKey
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const body: SwapRequest = await request.json()

    if (!rateLimiter.isAllowed(body.userId, "swap")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Validate request signature
    let agentPublicKey: string
    try {
      const keyStore = await keyManager.getAgentKey(body.agentId)
      // In production, derive public key from stored key
      agentPublicKey = keyStore
    } catch {
      return NextResponse.json({ error: "Invalid agent" }, { status: 401 })
    }

    if (!validateRequestSignature(body, agentPublicKey)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Validate transaction permissions
    const contractAddress = process.env.FX_SWAP_CONTRACT!
    const functionSelector = "executeFXSwap"

    const isPermitted = await keyManager.validateTransaction(
      body.agentId,
      contractAddress,
      functionSelector,
      BigInt(body.amountIn),
    )

    if (!isPermitted) {
      return NextResponse.json({ error: "Transaction exceeds permitted limits" }, { status: 403 })
    }

    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(process.env.CELO_RPC_URL)
    const privateKey = await keyManager.getAgentKey(body.agentId)
    const signer = new ethers.Wallet(privateKey, provider)

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, FX_SWAP_ABI, signer)

    const tx = await contract.executeFXSwap(
      body.userId,
      body.tokenIn,
      body.tokenOut,
      body.amountIn,
      body.minAmountOut,
      body.useMento,
      {
        gasLimit: 500000,
        gasPrice: await provider.getGasPrice(),
      },
    )

    const receipt = await tx.wait()

    return NextResponse.json({
      success: true,
      transactionHash: receipt?.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed.toString(),
    })
  } catch (error) {
    console.error("[v0] Swap execution error:", error)

    return NextResponse.json(
      {
        error: "Swap execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
