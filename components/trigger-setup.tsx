"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus, Trash2 } from "lucide-react"

interface Trigger {
  id: string
  type: "buy" | "sell"
  price: string
  amount: string
}

export function TriggerSetup() {
  const [triggers, setTriggers] = useState<Trigger[]>([
    { id: "1", type: "buy", price: "0.90", amount: "100" },
    { id: "2", type: "sell", price: "0.95", amount: "150" },
  ])
  const [newPrice, setNewPrice] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [newType, setNewType] = useState<"buy" | "sell">("buy")

  const addTrigger = () => {
    if (newPrice && newAmount) {
      setTriggers([...triggers, { id: Date.now().toString(), type: newType, price: newPrice, amount: newAmount }])
      setNewPrice("")
      setNewAmount("")
    }
  }

  const removeTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id))
  }

  return (
    <Card className="border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Set Trigger Prices</h2>

      <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-3 sm:p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-foreground">
          Set buy and sell trigger prices. When the market reaches your target price, the AI agent will automatically
          execute the trade.
        </div>
      </div>

      {/* Active Triggers */}
      {triggers.length > 0 && (
        <div className="mb-6 space-y-2">
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2 sm:p-3 gap-2 sm:gap-4"
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-semibold flex-shrink-0 ${
                    trigger.type === "buy"
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-red-500/20 text-red-600 dark:text-red-400"
                  }`}
                >
                  {trigger.type.toUpperCase()}
                </span>
                <div className="text-xs sm:text-sm min-w-0">
                  <p className="font-mono font-semibold text-foreground">Price: {trigger.price}</p>
                  <p className="text-xs text-muted-foreground">Amount: {trigger.amount} cUSD</p>
                </div>
              </div>
              <button
                onClick={() => removeTrigger(trigger.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Trigger */}
      <div className="space-y-3 sm:space-y-4 rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">Add New Trigger</h3>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "buy" | "sell")}
              className="w-full rounded-lg border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground"
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Price</label>
            <input
              type="number"
              placeholder="0.90"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Amount (cUSD)</label>
          <input
            type="number"
            placeholder="100"
            step="1"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          onClick={addTrigger}
          className="w-full gap-2 bg-accent hover:bg-accent/90 text-xs sm:text-sm py-2 sm:py-3"
        >
          <Plus className="h-4 w-4" />
          Add Trigger
        </Button>
      </div>

      {triggers.length > 0 && (
        <div className="mt-4 sm:mt-6 flex items-center justify-between rounded-lg bg-primary/5 p-3 sm:p-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-foreground">{triggers.length} Trigger(s) Active</p>
            <p className="text-xs text-muted-foreground">AI agent monitoring in real-time</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      )}
    </Card>
  )
}
