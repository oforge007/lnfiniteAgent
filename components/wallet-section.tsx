"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Wallet } from "lucide-react"

interface WalletSectionProps {
  onConnect: (connected: boolean) => void
}

export function WalletSection({ onConnect }: WalletSectionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleConnect = () => {
    setIsConnected(true)
    onConnect(true)
    setShowDropdown(false)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    onConnect(false)
    setShowDropdown(false)
  }

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-medium text-foreground">0x1234...5678</span>
        </button>

        {showDropdown && (
          <Card className="absolute right-0 top-full mt-2 w-48 border-border bg-card p-4 z-50">
            <div className="mb-4 space-y-2 text-sm">
              <p className="text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-foreground">0x1234567890abcdef1234567890abcdef12345678</p>
              <p className="text-xs text-muted-foreground">Balance: 50 cUSD</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="w-full bg-transparent">
              Disconnect
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Button onClick={handleConnect} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
