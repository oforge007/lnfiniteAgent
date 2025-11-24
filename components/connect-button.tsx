"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function ConnectButtonComponent() {
  return (
    <Button
      onClick={() => console.log("[v0] Connect wallet clicked")}
      className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white whitespace-nowrap text-xs sm:text-sm"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </Button>
  )
}
