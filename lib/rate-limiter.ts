interface RateLimitBucket {
  requests: number
  resetTime: number
}

interface UserRateLimit {
  swapsPerMinute: number
  swapsPerHour: number
  totalDailySwaps: number
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map()
  private userLimits: Map<string, UserRateLimit> = new Map()

  setUserLimits(userId: string, limits: UserRateLimit): void {
    this.userLimits.set(userId, limits)
  }

  isAllowed(userId: string, action: string): boolean {
    const limits = this.userLimits.get(userId) || {
      swapsPerMinute: 10,
      swapsPerHour: 100,
      totalDailySwaps: 500,
    }

    const now = Date.now()
    const bucketKey = `${userId}:${action}`

    let bucket = this.buckets.get(bucketKey)
    if (!bucket || bucket.resetTime < now) {
      bucket = {
        requests: 0,
        resetTime: now + 60000, // 1 minute window
      }
      this.buckets.set(bucketKey, bucket)
    }

    // Check minute limit
    if (action === "swap" && bucket.requests >= limits.swapsPerMinute) {
      return false
    }

    bucket.requests++
    return true
  }

  getRemainingQuota(userId: string): {
    perMinute: number
    perHour: number
    perDay: number
  } {
    const limits = this.userLimits.get(userId) || {
      swapsPerMinute: 10,
      swapsPerHour: 100,
      totalDailySwaps: 500,
    }

    return {
      perMinute: Math.max(0, limits.swapsPerMinute),
      perHour: Math.max(0, limits.swapsPerHour),
      perDay: Math.max(0, limits.totalDailySwaps),
    }
  }

  resetUserLimits(userId: string): void {
    this.userLimits.delete(userId)
  }
}

export const rateLimiter = new RateLimiter()
