"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Shield } from "lucide-react"

interface SecurityMonitorProps {
  compact?: boolean
}

const SECURITY_CHECKS = [
  { id: 1, name: "Rate Limiting", status: "active", detail: "Enforced per transaction" },
  { id: 2, name: "Access Control", status: "active", detail: "User-only authorized" },
  { id: 3, name: "Reentrancy Guard", status: "active", detail: "CEI pattern applied" },
  { id: 4, name: "Slippage Protection", status: "active", detail: "Max 2% tolerance" },
  { id: 5, name: "Key Management", status: "active", detail: "AES-256-GCM encrypted" },
  { id: 6, name: "Audit Trail", status: "active", detail: "All transactions logged" },
]

export function SecurityMonitor({ compact }: SecurityMonitorProps) {
  if (compact) {
    return (
      <Card className="border-border bg-card p-4 sm:p-6">
        <h3 className="mb-4 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          Security Status
        </h3>

        <div className="space-y-2">
          {SECURITY_CHECKS.slice(0, 4).map((check) => (
            <div key={check.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/30">
              <span className="text-xs sm:text-sm text-foreground">{check.name}</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Security Score</p>
          <p className="mt-1 text-2xl font-bold text-foreground">98/100</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-foreground">Security Monitor</h2>

        <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="rounded-lg bg-green-500/10 p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-2 flex items-center gap-1 sm:gap-2 font-semibold text-green-600 dark:text-green-400 text-xs sm:text-sm">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Secure
            </p>
          </div>
          <div className="rounded-lg bg-accent/10 p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-accent">98/100</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Passed</p>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">6/6</p>
          </div>
        </div>

        {/* Security Checks */}
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Active Security Measures</h3>
          {SECURITY_CHECKS.map((check) => (
            <div
              key={check.id}
              className="flex items-start justify-between rounded-lg border border-border bg-muted/20 p-2 sm:p-3 gap-2"
            >
              <div className="flex gap-2 sm:gap-3 min-w-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">{check.name}</p>
                  <p className="text-xs text-muted-foreground">{check.detail}</p>
                </div>
              </div>
              <span className="inline-block rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                Active
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Threat Detection */}
      <Card className="border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Threat Detection</h2>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start gap-2 sm:gap-3 rounded-lg border border-border bg-muted/20 p-2 sm:p-3">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground">No Anomalies</p>
              <p className="text-xs text-muted-foreground">Normal transaction patterns detected</p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 rounded-lg border border-border bg-muted/20 p-2 sm:p-3">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground">Rate Limits OK</p>
              <p className="text-xs text-muted-foreground">5 minute window usage: 40%</p>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 rounded-lg border border-border bg-muted/20 p-2 sm:p-3">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground">Volume Check</p>
              <p className="text-xs text-muted-foreground">Daily volume: 45% of limit</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
