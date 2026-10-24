import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { EVENT_PHASE_HEADER, POST_EVENT_LOCKED_ERROR } from "@/lib/event-phase"
import { getEventPhaseConfig } from "@/lib/event-phase-server"

// Still reachable for non-admins after the event, so admins can sign in and everyone can sign out
const POST_EVENT_ALLOWED_API = ["/api/auth/login", "/api/auth/2fa/verify", "/api/auth/logout"]
// GET endpoints that still write (e.g. confirmation links), locked like any other write
const POST_EVENT_CLOSED_GET_API = ["/api/newsletter/confirm"]
// Pages that only make sense while the event is running
const POST_EVENT_CLOSED_PAGES = ["/dashboard", "/profile", "/auth/reset-password", "/newsletter"]
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"]

function isLockedApiRequest(request: NextRequest, pathname: string) {
  if (!pathname.startsWith("/api/")) return false
  if (POST_EVENT_CLOSED_GET_API.includes(pathname)) return true
  return !SAFE_METHODS.includes(request.method) && !POST_EVENT_ALLOWED_API.includes(pathname)
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return response
}

export async function proxy(request: NextRequest) {
  let token = request.cookies.get("token")?.value
  const bearer = request.headers.get("authorization")?.startsWith("Bearer ")
    ? request.headers.get("authorization")!.slice(7)
    : null
  const pathname = request.nextUrl.pathname
  const { phase } = await getEventPhaseConfig()
  const isPostEvent = phase === "post"

  let dropSession = false
  let dropBearer = false
  if (isPostEvent) {
    // lib/middleware.ts prefers the Bearer header over the cookie, so check whichever it would use
    const sessionToken = bearer ?? token
    const isAdmin = !!sessionToken && verifyJWT(sessionToken)?.role === "admin"

    if (!isAdmin) {
      // After the event only admins keep a session; everyone else is treated as signed out
      if (token) {
        request.cookies.delete("token")
        token = undefined
        dropSession = true
      }
      dropBearer = !!bearer

      if (isLockedApiRequest(request, pathname)) {
        const locked = NextResponse.json({ success: false, error: POST_EVENT_LOCKED_ERROR }, { status: 403 })
        if (dropSession) locked.cookies.delete("token")
        return withSecurityHeaders(locked)
      }

      if (POST_EVENT_CLOSED_PAGES.some((route) => pathname.startsWith(route))) {
        const redirect = NextResponse.redirect(new URL("/", request.url))
        if (dropSession) redirect.cookies.delete("token")
        return withSecurityHeaders(redirect)
      }
    }
  }

  const protectedRoutes = ["/dashboard", "/admin", "/profile"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url)
    // Only allow relative paths to prevent open redirect
    if (pathname.startsWith("/") && !pathname.startsWith("//")) {
      loginUrl.searchParams.set("from", pathname)
    }
    const redirect = NextResponse.redirect(loginUrl)
    if (dropSession) redirect.cookies.delete("token")
    return withSecurityHeaders(redirect)
  }

  // Always overwrite the phase header so clients cannot spoof it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(EVENT_PHASE_HEADER, phase)
  if (dropSession) requestHeaders.set("cookie", request.cookies.toString())
  if (dropBearer) requestHeaders.delete("authorization")

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  if (dropSession) response.cookies.delete("token")
  return withSecurityHeaders(response)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
}
