import { type NextRequest, NextResponse } from "next/server"

interface AnomalyIndicators {
  unusualVolumeIncrease: boolean
  frequentFailures: boolean
  rapidExecutions: boolean
  suspiciousAddresses: boolean
  severityLevel: "low" | "medium" | "high" | "critical"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, recentSwaps, historicalAverage, failureRate, executionFrequency } = body

    const indicators: AnomalyIndicators = {
      unusualVolumeIncrease: false,
      frequentFailures: false,
      rapidExecutions: false,
      suspiciousAddresses: false,
      severityLevel: "low",
    }

    if (recentSwaps > historicalAverage * 2) {
      indicators.unusualVolumeIncrease = true
      indicators.severityLevel = "medium"
    }

    if (failureRate > 0.3) {
      indicators.frequentFailures = true
      indicators.severityLevel = "high"
    }

    if (executionFrequency > 10) {
      // More than 10 swaps per minute
      indicators.rapidExecutions = true
      indicators.severityLevel = "high"
    }

    if (indicators.severityLevel === "critical" || indicators.severityLevel === "high") {
      console.warn(`[v0] Security Alert - User ${userId} shows anomalous behavior:`, indicators)
      // In production: Send to security monitoring system (e.g., Datadog, Sentry)
    }

    return NextResponse.json({
      userId,
      analysis: indicators,
      recommendation:
        indicators.severityLevel === "critical"
          ? "PAUSE_AGENT"
          : indicators.severityLevel === "high"
            ? "ALERT_ADMIN"
            : "MONITOR",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Threat detection error:", error)

    return NextResponse.json({ error: "Threat detection failed" }, { status: 500 })
  }
}
