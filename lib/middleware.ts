import { NextRequest, NextResponse } from "next/server"
import { verifyJWT, JWTPayload } from "./auth"
import { query } from "./db"

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

    const userResult = await query(
      `SELECT u.id, u.email, u.role, u.category_id, u.admin_role_id, u.is_active
       FROM users u
       WHERE u.id = $1`,
      [payload.userId]
    )

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return NextResponse.json({ success: false, error: "Inactive or missing account" }, { status: 401 })
    }

    const user = userResult.rows[0]
    ;(req as AuthenticatedRequest).user = {
      ...payload,
      email: user.email,
      role: user.role,
      categoryId: user.category_id || undefined,
      adminRoleId: user.admin_role_id || undefined
    }
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
    if (role !== "sponsor" && role !== "admin" && role !== "category_partner") {
      return NextResponse.json({ success: false, error: "Sponsor access required" }, { status: 403 })
    }

    return handler(req)
  })
}
