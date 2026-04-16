import { NextRequest, NextResponse } from "next/server"
import { verifyJWT, JWTPayload } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  const cookie = request.cookies.get("token")?.value
  return cookie || null
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const token = getTokenFromRequest(req)

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing authentication token" }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    ;(req as AuthenticatedRequest).user = payload
    return handler(req as AuthenticatedRequest)
  }
}

export function withAdminAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    if (!req.user.twoFaVerified) {
      return NextResponse.json({ success: false, error: "2FA verification required" }, { status: 403 })
    }

    return handler(req)
  })
}

export function withCategoryPartnerAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== "category_partner" && req.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Category partner access required" }, { status: 403 })
    }

    return handler(req)
  })
}

export function withSponsorAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const role = req.user?.role as string | undefined
    if (role !== "sponsor" && role !== "admin") {
      return NextResponse.json({ success: false, error: "Sponsor access required" }, { status: 403 })
    }

    return handler(req)
  })
}
