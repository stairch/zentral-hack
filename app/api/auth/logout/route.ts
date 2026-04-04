import { NextRequest } from "next/server"
import { successResponse } from "@/lib/api"
import { verifyJWT } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return new Response(JSON.stringify({ error: "No token" }), { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
    }

    const result = await query("SELECT id, email, first_name, last_name, role FROM users WHERE id = $1", [
      payload.userId
    ])

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 401 })
    }

    const user = result.rows[0]
    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    })
  } catch (error) {
    console.error("[Logout GET] Error:", error)
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const response = successResponse({ message: "Logged out successfully" })
  response.cookies.delete("token")
  return response
}
