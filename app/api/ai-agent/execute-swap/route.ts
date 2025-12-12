// Add to imports
import { Mento } from "@mento-protocol/mento-sdk"

// In POST handler, after signer init and before custom contract call:
if (body.useMento) {
  // Mento SDK Integration
  const mento = await Mento.create(signer)

  // Validate tokens are Mento stables (optional whitelist check)
  const validStables = [
    "0x765DE816845861e75A25fCA122bb6898b8B1282a", // cUSD
    "0xD8763CBa276a3738E6DE85b4b3bF3750aDC6301", // cEUR
    "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", // cREAL
  ]
  if (!validStables.includes(body.tokenIn) || !validStables.includes(body.tokenOut)) {
    return NextResponse.json({ error: "Invalid Mento stable tokens" }, { status: 400 })
  }

  const amountIn = BigInt(body.amountIn)
  const minAmountOut = BigInt(body.minAmountOut)

  // Get quote for slippage check
  const quoteAmountOut = await mento.getAmountOut(body.tokenIn, body.tokenOut, amountIn)
  if (quoteAmountOut < minAmountOut) {
    return NextResponse.json({ error: "Quote below minAmountOut (slippage too high)" }, { status: 400 })
  }

  // Approve Broker to spend tokenIn (idempotent if already approved)
  const approveTx = await mento.increaseAllowance(body.tokenIn, amountIn)
  if (approveTx) {
    const approveReceipt = await signer.sendTransaction(approveTx)
    await approveReceipt.wait()
  }

  // Execute swap
  const swapTxRequest = await mento.swapOut(
    body.tokenIn,
    body.tokenOut,
    minAmountOut, // Use request's min for protection
    amountIn
  )
  const tx = await signer.sendTransaction(swapTxRequest)
  const receipt = await tx.wait()

  // Log userId for tracking (e.g., emit event or store)
  console.log(`Swap executed for user ${body.userId} via agent ${body.agentId}`)

  return NextResponse.json({
    success: true,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    quoteAmountOut: quoteAmountOut.toString(), // Bonus: return quote
  })
} else {
  // Fallback to custom contract (your original logic, with BigInt fixes)
  // ... (contract call as in patched code above)
}
