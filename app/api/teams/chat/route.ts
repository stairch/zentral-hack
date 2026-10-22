import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import { validateFileUpload, generateSecureFilename } from "@/lib/file-upload"
import { hasTeamAccess } from "@/lib/team-access"

async function authenticate(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  if (!token) return null
  const payload = verifyJWT(token)
  if (!payload) return null
  const activeUser = await query("SELECT is_active FROM users WHERE id = $1", [payload.userId])
  if (activeUser.rows.length === 0 || !activeUser.rows[0].is_active) return null
  return payload
}

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
}

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return unauthorized()

    const teamId = request.nextUrl.searchParams.get("teamId")
    if (!teamId) {
      return new NextResponse(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })
    }

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
    }

    const result = await query(
      `SELECT m.id, m.sender_id, m.content, m.attachment_url, m.attachment_name, m.attachment_mime,
              m.attachment_size, m.edited_at, m.deleted_at, m.created_at,
              u.first_name, u.last_name, u.email, u.role AS sender_role
       FROM team_chat_messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.team_id = $1
       ORDER BY m.created_at ASC`,
      [teamId]
    )

    return NextResponse.json({ success: true, data: { messages: result.rows } })
  } catch (error) {
    console.error("[Team Chat] GET error:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to load messages" }), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return unauthorized()

    const formData = await request.formData()
    const teamId = formData.get("teamId") as string
    const content = (formData.get("content") as string | null)?.trim() || null
    const file = formData.get("file") as File | null

    if (!teamId) {
      return new NextResponse(JSON.stringify({ error: "teamId parameter required" }), { status: 400 })
    }
    if (!content && !file) {
      return new NextResponse(JSON.stringify({ error: "Message or attachment required" }), { status: 400 })
    }

    if (!(await hasTeamAccess(teamId, payload.userId, payload.role, payload.categoryId))) {
      return new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
    }

    let attachmentUrl: string | null = null
    let attachmentName: string | null = null
    let attachmentMime: string | null = null
    let attachmentSize: number | null = null

    if (file) {
      const meta = { name: file.name, size: file.size, type: file.type }
      const imageValidation = validateFileUpload(meta, "image")
      const finalValidation = imageValidation.valid ? imageValidation : validateFileUpload(meta, "document")
      if (!finalValidation.valid) {
        return new NextResponse(
          JSON.stringify({ error: "Nur Bilder (JPG/PNG/WebP) oder Dokumente (PDF/Office) erlaubt" }),
          { status: 400 }
        )
      }
      const secureFilename = generateSecureFilename(file.name)
      const blob = await put(`chat/${teamId}/${secureFilename}`, file, { access: "private" })
      attachmentUrl = blob.url
      attachmentName = file.name
      attachmentMime = file.type
      attachmentSize = file.size

      // Files shared in the chat also show up in the team's regular file list.
      await query(
        `INSERT INTO team_files (team_id, original_name, file_path, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [teamId, file.name, blob.url, file.size, file.type, payload.userId]
      )
    }

    const result = await query(
      `INSERT INTO team_chat_messages
         (team_id, sender_id, content, attachment_url, attachment_name, attachment_mime, attachment_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, sender_id, content, attachment_url, attachment_name, attachment_mime, attachment_size,
                 edited_at, deleted_at, created_at`,
      [teamId, payload.userId, content, attachmentUrl, attachmentName, attachmentMime, attachmentSize]
    )

    const senderResult = await query("SELECT first_name, last_name, email, role FROM users WHERE id = $1", [
      payload.userId
    ])
    const sender = senderResult.rows[0] || {}

    return NextResponse.json(
      {
        success: true,
        data: {
          message: {
            ...result.rows[0],
            first_name: sender.first_name,
            last_name: sender.last_name,
            email: sender.email,
            sender_role: sender.role
          }
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Team Chat] POST error:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to send message" }), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return unauthorized()

    const { messageId, content } = await request.json()
    if (!messageId || typeof content !== "string" || !content.trim()) {
      return new NextResponse(JSON.stringify({ error: "messageId and content required" }), { status: 400 })
    }

    const result = await query(
      `UPDATE team_chat_messages
       SET content = $1, edited_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
       RETURNING id, content, edited_at`,
      [content.trim(), messageId, payload.userId]
    )

    if (!result.rows[0]) {
      return new NextResponse(JSON.stringify({ error: "Message not found or no permission" }), {
        status: 404
      })
    }

    return NextResponse.json({ success: true, data: { message: result.rows[0] } })
  } catch (error) {
    console.error("[Team Chat] PUT error:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to edit message" }), { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await authenticate(request)
    if (!payload) return unauthorized()

    const messageId = request.nextUrl.searchParams.get("messageId")
    if (!messageId) {
      return new NextResponse(JSON.stringify({ error: "messageId parameter required" }), { status: 400 })
    }

    const result = await query(
      `UPDATE team_chat_messages
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [messageId, payload.userId]
    )

    if (!result.rows[0]) {
      return new NextResponse(JSON.stringify({ error: "No permission to delete this message" }), {
        status: 403
      })
    }

    return NextResponse.json({ success: true, data: { message: "Message deleted" } })
  } catch (error) {
    console.error("[Team Chat] DELETE error:", error)
    return new NextResponse(JSON.stringify({ error: "Failed to delete message" }), { status: 500 })
  }
}
