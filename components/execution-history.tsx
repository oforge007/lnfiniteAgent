"use client"

import { Card } from "@/components/ui/card"
import { ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle } from "lucide-react"

const EXECUTIONS = [
  {
    id: 1,
    pair: "cUSD ↔ cEUR",
    type: "sell",
    amount: "150",
    rate: "0.93",
    status: "success",
    timestamp: "2 min ago",
    hash: "0xabc123...",
  },
  {
    id: 2,
    pair: "cUSD ↔ cGBP",
    type: "buy",
    amount: "200",
    rate: "0.78",
    status: "success",
    timestamp: "15 min ago",
    hash: "0xdef456...",
  },
  {
    id: 3,
    pair: "cEUR ↔ cGBP",
    type: "sell",
    amount: "100",
    rate: "0.85",
    status: "failed",
    timestamp: "1 hour ago",
    hash: "0xghi789...",
  },
  {
    id: 4,
    pair: "cUSD ↔ cJPY",
    type: "buy",
    amount: "500",
    rate: "151.2",
    status: "success",
    timestamp: "3 hours ago",
    hash: "0xjkl012...",
  },
]

export function ExecutionHistory() {
  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Execution History</h2>
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Pair</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Amount</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Rate</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Time</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Hash</th>
            </tr>
          </thead>
          <tbody>
            {EXECUTIONS.map((exec) => (
              <tr key={exec.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 sm:px-6 py-4 text-sm font-medium text-foreground">{exec.pair}</td>
                <td className="px-4 sm:px-6 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold bg-muted/50">
                    {exec.type === "buy" ? (
                      <>
                        <ArrowDownLeft className="h-3 w-3 text-green-500" />
                        <span>Buy</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="h-3 w-3 text-red-500" />
                        <span>Sell</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-foreground font-mono">{exec.amount}</td>
                <td className="px-4 sm:px-6 py-4 text-sm text-foreground font-mono">{exec.rate}</td>
                <td className="px-4 sm:px-6 py-4">
                  <span className="inline-flex items-center gap-1">
                    {exec.status === "success" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Failed</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-muted-foreground">{exec.timestamp}</td>
                <td className="px-4 sm:px-6 py-4 text-sm font-mono text-accent hover:text-accent/80 cursor-pointer">
                  {exec.hash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3 p-4">
        {EXECUTIONS.map((exec) => (
          <div key={exec.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{exec.pair}</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  exec.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {exec.status === "success" ? "Success" : "Failed"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-mono text-foreground">{exec.type.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-mono text-foreground">{exec.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rate</p>
                <p className="font-mono text-foreground">{exec.rate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-xs text-foreground">{exec.timestamp}</p>
              </div>
            </div>
            <p className="text-xs font-mono text-accent truncate">Hash: {exec.hash}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
