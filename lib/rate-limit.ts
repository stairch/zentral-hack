import { NextRequest, NextResponse } from "next/server"

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

const WINDOWS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  twofa: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes
  signup: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 requests per hour
  newsletter: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 requests per hour
  sponsor: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 requests per hour
  default: { windowMs: 60 * 1000, maxRequests: 100 } // 100 requests per minute
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(", ")[0] : (request.headers.get("x-real-ip") ?? "unknown")
  return ip
}

export function createRateLimiter(windowType: keyof typeof WINDOWS = "default") {
  const config = WINDOWS[windowType]

  return async (request: NextRequest) => {
    const clientIp = getClientIp(request)
    const key = `${clientIp}-${request.nextUrl.pathname}`
    const now = Date.now()

    // Initialize or check store
    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + config.windowMs }
      return null // Allow request
    }

    // Check if window has reset
    if (now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + config.windowMs }
      return null // Allow request
    }

    // Increment counter
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > config.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString()
          }
        }
      )
    }

    return null // Allow request
  }
}

// Cleanup old entries every hour
setInterval(
  () => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (now > store[key].resetTime + 60 * 60 * 1000) {
        delete store[key]
      }
    })
  },
  60 * 60 * 1000
)
