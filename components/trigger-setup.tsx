"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Trash2, Zap } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { parseEther } from "viem";
import { config } from "@/wagmi-config"; // adjust path if needed
import { FX_SWAP_AGENT_ADDRESS } from "@/constants/contracts";
import { CUSD_ADDRESS, CELO_ADDRESS } from "@/constants/tokens";

interface Trigger {
  id: string;
  type: "buy" | "sell"; // buy = cUSD → CELO, sell = CELO → cUSD
  price: string; // target price in USD (e.g., "0.92")
  amount: string; // amount in cUSD
  status: "pending" | "active" | "executed" | "cancelled";
}

const FXSwapAgentABI = [
  // Only the function we need
  {
    name: "executeFXSwap",
    type: "function",
    inputs: [
      { name: "_user", type: "address" },
      { name: "_tokenIn", type: "address" },
      { name: "_tokenOut", type: "address" },
      { name: "_amountIn", type: "uint256" },
      { name: "_minAmountOut", type: "uint256" },
      { name: "_useMento", type: "bool" },
      { name: "_swapData", type: "bytes" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

export function TriggerSetup() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"buy" | "sell">("buy");
  const [isLoading, setIsLoading] = useState(false);

  const addTrigger = () => {
    if (!newPrice || !newAmount || !isConnected) return;

    const trigger: Trigger = {
      id: Date.now().toString(),
      type: newType,
      price: newPrice,
      amount: newAmount,
      status: "pending",
    };

    setTriggers((prev) => [...prev, trigger]);
    setNewPrice("");
    setNewAmount("");
  };

  const removeTrigger = (id: string) => {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  // This would be called by your backend/AI agent when price condition is met
  const executeTrigger = async (trigger: Trigger) => {
    if (!address || chainId !== 42220 && chainId !== 44787) {
      alert("Please connect to Celo Mainnet or Alfajores");
      return;
    }

    setIsLoading(true);
    try {
      const amountIn = parseEther(trigger.amount);
      const targetPrice = Number(trigger.price);

      // Calculate minAmountOut based on target price ± slippage tolerance
      const slippageTolerance = 0.005; // 0.5%
      const minPrice = trigger.type === "buy"
        ? targetPrice * (1 - slippageTolerance)
        : targetPrice * (1 + slippageTolerance);

      const minAmountOut = trigger.type === "buy"
        ? parseEther((Number(trigger.amount) / minPrice).toFixed(6)) // cUSD → CELO
        : parseEther((Number(trigger.amount) * minPrice).toFixed(6)); // CELO → cUSD

      const tokenIn = trigger.type === "buy" ? CUSD_ADDRESS : CELO_ADDRESS;
      const tokenOut = trigger.type === "buy" ? CELO_ADDRESS : CUSD_ADDRESS;

      const hash = await writeContract(config, {
        address: FX_SWAP_AGENT_ADDRESS,
        abi: FXSwapAgentABI,
        functionName: "executeFXSwap",
        args: [
          address,           // _user
          tokenIn,           // _tokenIn
          tokenOut,          // _tokenOut
          amountIn,          // _amountIn
          minAmountOut,      // _minAmountOut
          true,              // _useMento = true (best rates on Celo)
          "0x",              // _swapData (empty for Mento v2/v3)
        ],
      });

      await waitForTransactionReceipt(config, { hash });

      // Update trigger status locally
      setTriggers((prev) =>
        prev.map((t) =>
          t.id === trigger.id ? { ...t, status: "executed" as const } : t }
        )
      );

      alert(`Swap executed successfully! ${trigger.type.toUpperCase()} ${trigger.amount} cUSD @ ~$${trigger.price}`);
    } catch (error: any) {
      console.error(error);
      alert("Swap failed: " + (error.shortMessage || error.message));
      );
      setTriggers((prev) =>
        prev.map((t) =>
          t.id === trigger.id ? { ...t, status: "pending" } : t }
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          AI-Powered Price Triggers
        </h2>
        <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
      </div>

      <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-foreground">
          Your AI agent monitors cUSD/CELO price 24/7. When your target is hit, it instantly executes via{" "}
          <span className="font-bold text-blue-400">FXSwapAgent</span> using Mento (best rates).
        </div>
      </div>

      {/* Active Triggers List */}
      {triggers.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Active Triggers</h3>
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded text-xs font-bold ${
                    trigger.type === "buy"
                      ? "bg-green-500/20 text-green-600"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  {trigger.type.toUpperCase()}
                </span>
                <div>
                  <p className="font-mono text-foreground">
                    @ ${trigger.price} → {trigger.amount} cUSD
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Status: {trigger.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {trigger.status === "pending" && (
                  <button
                    onClick={() => executeTrigger(trigger)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    Test Execute
                  </button>
                )}
                <button
                  onClick={() => removeTrigger(trigger.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Trigger */}
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold mb-3">Add New Trigger</h3>

        {!isConnected ? (
          <p className="text-sm text-orange-600 text-center py-4">
            Connect wallet to set triggers
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "buy" | "sell")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="buy">Buy CELO (with c
