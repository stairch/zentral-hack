import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getNewsletterColumnSupport } from "@/lib/newsletter-db"

function renderResultPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; font-family: Inter, Segoe UI, Arial, sans-serif; background:#f3f1f8; color:#241f2e; }
    .wrap { max-width:640px; margin:56px auto; padding:0 16px; }
    .card { background:#fff; border:1px solid #ece7f5; border-radius:16px; overflow:hidden; }
    .head { background:#530A5D; color:#fff; padding:24px; font-weight:800; letter-spacing:0.05em; }
    .head span { color:#E6FF17; }
    .body { padding:24px; line-height:1.65; }
    .title { margin:0 0 8px; color:#530A5D; font-size:24px; }
    .msg { margin:0; color:#4b4457; }
    .link { display:inline-block; margin-top:18px; color:#530A5D; font-weight:600; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">ZENTRAL <span>HACK</span></div>
      <div class="body">
        <h1 class="title">${title}</h1>
        <p class="msg">${message}</p>
        <a class="link" href="${process.env.NEXT_PUBLIC_APP_URL || "https://zentralhack.ch"}">Zur Website</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

async function unsubscribeWeekly(email: string) {
  const columnSupport = await getNewsletterColumnSupport()

  if (columnSupport.weeklyUpdatesSubscribed) {
    const sql = `UPDATE newsletter_subscribers
                 SET weekly_updates_subscribed = false${columnSupport.updatedAt ? ", updated_at = NOW()" : ""}
                 WHERE email = $1`
    return query(sql, [email])
  }

  // Backward-compatible fallback for old schema.
  return query(
    `UPDATE newsletter_subscribers
     SET subscribed = false
     WHERE email = $1`,
    [email]
  )
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email)
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get("email")?.trim().toLowerCase()
    const category = url.searchParams.get("category")

    if (!email || !email.includes("@")) {
      return new NextResponse(
        renderResultPage("Ungültiger Link", "Die E-Mail-Adresse im Abmeldelink ist ungültig."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    }

    if (category !== "weekly_updates") {
      return new NextResponse(
        renderResultPage("Kategorie nicht unterstützt", "Dieser Link ist nur für Weekly Updates vorgesehen."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    }

    await unsubscribeWeekly(email)

    return new NextResponse(
      renderResultPage(
        "Abmeldung erfolgreich",
        "Du wurdest von Weekly Updates abgemeldet. Andere E-Mail-Kategorien bleiben weiterhin aktiv."
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  } catch (error) {
    console.error("Newsletter public unsubscribe error:", error)
    return new NextResponse(
      renderResultPage(
        "Fehler",
        "Die Abmeldung konnte nicht verarbeitet werden. Bitte versuche es später erneut."
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || "")
      .trim()
      .toLowerCase()
    const category = body?.category

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 })
    }

    if (category !== "weekly_updates") {
      return NextResponse.json({ error: "Nur weekly_updates wird unterstützt" }, { status: 400 })
    }

    await unsubscribeWeekly(email)
    return NextResponse.json({
      success: true,
      message: "Von Weekly Updates abgemeldet. Andere Kategorien bleiben aktiv."
    })
  } catch (error) {
    console.error("Newsletter unsubscribe POST error:", error)
    return NextResponse.json({ error: "Abmeldung fehlgeschlagen" }, { status: 500 })
  }
}
