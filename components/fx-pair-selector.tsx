"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, TrendingUp, Plus, X } from "lucide-react"

const AVAILABLE_CURRENCIES = [
  { code: "cUSD", name: "Celo USD", symbol: "$" },
  { code: "cEUR", name: "Celo EUR", symbol: "€" },
  { code: "cGBP", name: "Celo GBP", symbol: "£" },
  { code: "cJPY", name: "Celo JPY", symbol: "¥" },
  { code: "cREAL", name: "Celo REAL", symbol: "R$" },
  { code: "cPESO", name: "Celo PESO", symbol: "$" },
]

const DEFAULT_PAIRS = [
  { id: "usd-eur", from: "cUSD", to: "cEUR", rate: 0.92, change: 0.5 },
  { id: "usd-gbp", from: "cUSD", to: "cGBP", rate: 0.79, change: -0.3 },
  { id: "eur-gbp", from: "cEUR", to: "cGBP", rate: 0.86, change: 0.2 },
  { id: "usd-jpy", from: "cUSD", to: "cJPY", rate: 152.5, change: 1.2 },
]

interface FXPair {
  id: string
  from: string
  to: string
  rate: number
  change: number
}

export function FXPairSelector() {
  const [pairs, setPairs] = useState<FXPair[]>(DEFAULT_PAIRS)
  const [selectedPair, setSelectedPair] = useState(DEFAULT_PAIRS[0])
  const [showAddPair, setShowAddPair] = useState(false)
  const [customFrom, setCustomFrom] = useState("cUSD")
  const [customTo, setCustomTo] = useState("cEUR")

  const addCustomPair = () => {
    if (customFrom !== customTo) {
      const newPair: FXPair = {
        id: `custom-${Date.now()}`,
        from: customFrom,
        to: customTo,
        rate: Math.random() * 150 + 0.5,
        change: (Math.random() - 0.5) * 2,
      }
      setPairs([...pairs, newPair])
      setSelectedPair(newPair)
      setShowAddPair(false)
    }
  }

  const removePair = (id: string) => {
    const filtered = pairs.filter((p) => p.id !== id)
    setPairs(filtered)
    if (selectedPair.id === id && filtered.length > 0) {
      setSelectedPair(filtered[0])
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-500/20 bg-slate-800/50 backdrop-blur-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-cyan-300">Select FX Pair</h2>
          <Button
            onClick={() => setShowAddPair(!showAddPair)}
            className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Pair
          </Button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-3 sm:grid sm:grid-cols-1 md:grid-cols-2 pb-4 sm:pb-0 min-w-min sm:min-w-full">
            {pairs.map((pair) => (
              <button
                key={pair.id}
                onClick={() => setSelectedPair(pair)}
                className={`flex-shrink-0 sm:flex-shrink rounded-lg border-2 p-3 sm:p-4 text-left transition-all w-36 sm:w-full ${
                  selectedPair.id === pair.id
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-blue-500/30 bg-slate-700/30 hover:border-blue-400/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-slate-300 truncate">
                        {pair.from}
                      </span>
                      <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-xs sm:text-sm font-semibold text-slate-300 truncate">
                        {pair.to}
                      </span>
                    </div>
                  </div>
                  {pair.id.startsWith("custom") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removePair(pair.id)
                      }}
                      className="text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-cyan-300 text-xs sm:text-sm">{pair.rate.toFixed(2)}</p>
                  <p className={`text-xs ${pair.change > 0 ? "text-green-400" : "text-red-400"}`}>
                    {pair.change > 0 ? "+" : ""}
                    {pair.change.toFixed(1)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {showAddPair && (
        <Card className="border-blue-500/20 bg-slate-800/50 backdrop-blur-sm p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-semibold text-cyan-300 mb-4">Create Custom Pair</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">From Currency</label>
              <select
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-lg border border-blue-500/30 bg-slate-700/50 px-3 py-2 text-sm text-slate-100"
              >
                {AVAILABLE_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">To Currency</label>
              <select
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-lg border border-blue-500/30 bg-slate-700/50 px-3 py-2 text-sm text-slate-100"
              >
                {AVAILABLE_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addCustomPair} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                Add Pair
              </Button>
              <Button
                onClick={() => setShowAddPair(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {selectedPair && (
        <Card className="border-cyan-500/30 bg-gradient-to-r from-blue-600/10 to-cyan-500/10 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Current Rate</p>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-300">
                {selectedPair.rate.toFixed(2)} <span className="text-sm text-slate-400">{selectedPair.to}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`text-center px-3 py-2 rounded-lg ${selectedPair.change > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}
              >
                <p className={`text-lg font-bold ${selectedPair.change > 0 ? "text-green-400" : "text-red-400"}`}>
                  {selectedPair.change > 0 ? "▲" : "▼"}
                </p>
                <p className={`text-xs font-semibold ${selectedPair.change > 0 ? "text-green-400" : "text-red-400"}`}>
                  {Math.abs(selectedPair.change).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
