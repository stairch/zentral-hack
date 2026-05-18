import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"

const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL!,
  token: process.env.UPSTASH_KV_REST_API_TOKEN!
})

const WINDOWS = {
  auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"), prefix: "rl:auth" }),
  twofa: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "15 m"), prefix: "rl:twofa" }),
  signup: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: "rl:signup" }),
  newsletter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "rl:newsletter" }),
  sponsor: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 h"), prefix: "rl:sponsor" }),
  default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), prefix: "rl:default" })
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded ? forwarded.split(", ")[0] : (request.headers.get("x-real-ip") ?? "unknown")
}

export function createRateLimiter(windowType: keyof typeof WINDOWS = "default") {
  return async (request: NextRequest) => {
    const clientIp = getClientIp(request)
    const key = `${clientIp}:${request.nextUrl.pathname}`
    const { success, reset } = await WINDOWS[windowType].limit(key)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } }
      )
    }

    return null
  }
}
