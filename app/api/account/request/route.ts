import { z } from "zod"
import { query } from "@/lib/db"
import { withAuth, type AuthenticatedRequest } from "@/lib/middleware"
import { successResponse, validationError, serverError } from "@/lib/api"
import { comparePassword, hashPassword } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { createAccountActionChallenge, type AccountAction } from "@/lib/account-actions"

const emailSchema = z
  .string()
  .email()
  .transform((value) => value.toLowerCase())

async function handleRequest(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const action = String(body.action || "").trim() as AccountAction

    if (!["email_change", "password_change", "category_change", "delete_account"].includes(action)) {
      return validationError("Invalid action")
    }

    const userResult = await query("SELECT id, email, password_hash, role FROM users WHERE id = $1", [
      req.user!.userId
    ])
    const user = userResult.rows[0]
    if (!user) {
      return validationError("User not found")
    }

    let destinationEmail = req.user!.email
    let emailSubject = "Zentral Hack - Bestätigungscode"
    let emailHtml = ""
    let payload: Record<string, string | null> = {}

    if (action === "email_change") {
      const parsed = emailSchema.safeParse(body.newEmail)
      if (!parsed.success) {
        return validationError("Ungültige neue E-Mail-Adresse")
      }

      const newEmail = parsed.data
      if (newEmail === user.email.toLowerCase()) {
        return validationError("Neue E-Mail muss sich von der aktuellen unterscheiden")
      }

      const existing = await query("SELECT id FROM users WHERE email = $1 AND id <> $2", [newEmail, user.id])
      if (existing.rows.length > 0) {
        return validationError("Diese E-Mail ist bereits registriert")
      }

      destinationEmail = newEmail
      payload = { newEmail }
      emailSubject = "Zentral Hack - E-Mail-Änderung bestätigen"
      emailHtml = `
        <h2>Bitte bestätige deine neue E-Mail-Adresse</h2>
        <p>Du hast eine Änderung auf <strong>${newEmail}</strong> angefordert.</p>
        <p>Verwende den Bestätigungscode, um die neue Adresse zu aktivieren.</p>
        <p style="color: #666; font-size: 12px;">Falls du das nicht warst, kannst du diese E-Mail ignorieren.</p>
      `
    } else if (action === "password_change") {
      const currentPassword = String(body.currentPassword || "")
      const newPassword = String(body.newPassword || "")
      const confirmPassword = String(body.confirmPassword || "")

      if (!currentPassword || !newPassword || !confirmPassword) {
        return validationError("Current password, new password and confirmation are required")
      }

      if (newPassword !== confirmPassword) {
        return validationError("Neue Passwörter stimmen nicht überein")
      }

      const validPassword = await comparePassword(currentPassword, user.password_hash)
      if (!validPassword) {
        return validationError("Aktuelles Passwort ist falsch")
      }

      payload = { newPasswordHash: await hashPassword(newPassword) }
      emailSubject = "Zentral Hack - Passwortänderung bestätigen"
      emailHtml = `
        <h2>Bitte bestätige deine Passwortänderung</h2>
        <p>Du hast eine Änderung deines Passworts angefordert.</p>
        <p>Gib den Bestätigungscode ein, um das neue Passwort zu aktivieren.</p>
        <p style="color: #666; font-size: 12px;">Falls du das nicht warst, ignoriere diese E-Mail bitte und prüfe dein Konto.</p>
      `
    } else if (action === "category_change") {
      const categoryId = String(body.categoryId || "").trim()
      if (!categoryId) {
        return validationError("Category required")
      }

      const categoryResult = await query("SELECT id, name FROM categories WHERE id = $1", [categoryId])
      if (categoryResult.rows.length === 0) {
        return validationError("Kategorie nicht gefunden")
      }

      const registrationResult = await query("SELECT id FROM registrations WHERE user_id = $1", [user.id])
      if (registrationResult.rows.length === 0) {
        return validationError("Keine bestehende Anmeldung gefunden")
      }

      payload = { categoryId }
      emailSubject = "Zentral Hack - Kategorieänderung bestätigen"
      emailHtml = `
        <h2>Bitte bestätige deine neue Kategorie</h2>
        <p>Du möchtest deine Anmeldung auf <strong>${categoryResult.rows[0].name}</strong> ändern.</p>
        <p>Verwende den Bestätigungscode, um die Änderung abzuschließen.</p>
      `
    } else if (action === "delete_account") {
      payload = {}
      emailSubject = "Zentral Hack - Kontolöschung bestätigen"
      emailHtml = `
        <h2>Kontolöschung bestätigen</h2>
        <p>Du hast die Löschung deines Kontos angefordert.</p>
        <p>Erst nach Eingabe des Bestätigungscodes wird dein Konto deaktiviert und deine Anmeldung zurückgezogen.</p>
        <p style="color: #666; font-size: 12px;">Verknüpfte Dokumente bleiben erhalten.</p>
      `
    }

    const challenge = await createAccountActionChallenge({
      userId: user.id,
      action,
      payload,
      expiresInMinutes: 15
    })

    await sendEmail({
      to: destinationEmail,
      subject: emailSubject,
      html: `${emailHtml}<h1 style="letter-spacing: 0.1em; font-size: 32px; margin: 24px 0; color: #530A5D;">${challenge.code}</h1><p>Dieser Code verfällt in 15 Minuten.</p>`,
      text: `Dein Bestätigungscode lautet: ${challenge.code}`
    })

    return successResponse({
      challengeToken: challenge.token,
      destinationEmail,
      action,
      message: "Confirmation code sent"
    })
  } catch (error) {
    console.error("[Account Request] Error:", error)
    return serverError("Failed to create confirmation challenge")
  }
}

export const POST = withAuth(handleRequest)
