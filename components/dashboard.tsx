"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InfiniteLogo } from "./logo"
import { ConnectButtonComponent } from "./connect-button"
import { FXPairSelector } from "./fx-pair-selector"
import { TriggerSetup } from "./trigger-setup"
import { ExecutionHistory } from "./execution-history"
import { SecurityMonitor } from "./security-monitor"
import { TrendingUp, Shield, History, Lock } from "lucide-react"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("trade")
  const [isConnected, setIsConnected] = useState(false)

  const tabs = [
    { id: "trade", label: "Trade Setup", icon: TrendingUp },
    { id: "history", label: "History", icon: History },
    { id: "security", label: "Security", icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <InfiniteLogo />
            <div className="hidden sm:block">
              <ConnectButtonComponent />
            </div>
          </div>
          <div className="sm:hidden mt-3 flex justify-end">
            <ConnectButtonComponent />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* Status Cards - Mobile stacked, desktop grid */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="overflow-hidden border-blue-500/20 bg-slate-800/50 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Active Triggers</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-300">3</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 flex-shrink-0" />
              </div>
              <p className="mt-3 sm:mt-4 text-xs text-slate-400">Monitoring 3 FX pairs</p>
            </div>
          </Card>

          <Card className="overflow-hidden border-blue-500/20 bg-slate-800/50 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Success Rate</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-cyan-300">94.2%</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
              </div>
              <p className="mt-3 sm:mt-4 text-xs text-slate-400">27 successful executions</p>
            </div>
          </Card>

          <Card className="overflow-hidden border-blue-500/20 bg-slate-800/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Security Score</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold text-blue-300">98</p>
                </div>
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 flex-shrink-0" />
              </div>
              <p className="mt-3 sm:mt-4 text-xs text-slate-400">No anomalies detected</p>
            </div>
          </Card>
        </div>

        <div className="hidden sm:block mb-6 sm:mb-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-2 border-b border-blue-500/20 min-w-min sm:min-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-b-2 border-cyan-400 text-cyan-300"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "trade" && isConnected && (
          <div className="space-y-6 sm:space-y-8">
            <FXPairSelector />
            <TriggerSetup />
          </div>
        )}

        {activeTab === "trade" && !isConnected && (
          <Card className="border-blue-500/20 bg-slate-800/50 backdrop-blur-sm p-8 sm:p-12 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
            <h3 className="mb-2 text-base sm:text-lg font-semibold text-blue-300">Connect Wallet</h3>
            <p className="mb-6 text-sm sm:text-base text-slate-400">
              Connect your wallet to start setting up automated FX trades
            </p>
            <Button
              onClick={() => setIsConnected(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white w-full sm:w-auto"
            >
              Connect Wallet
            </Button>
          </Card>
        )}

        {activeTab === "history" && <ExecutionHistory />}

        {activeTab === "security" && <SecurityMonitor />}
      </main>

      {/* Mobile Footer Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-blue-500/20 bg-slate-950/95 backdrop-blur-md z-40">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id ? "text-cyan-400 border-t-2 border-cyan-400" : "text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
