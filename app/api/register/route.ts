import { NextResponse } from "next/server"

/**
 * @deprecated This is a legacy Supabase-based registration endpoint.
 * Use /api/hackathon/register instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use /api/hackathon/register instead." },
    { status: 410 }
  )
}
