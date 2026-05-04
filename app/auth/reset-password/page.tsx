"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [step, setStep] = useState<"request" | "confirm">("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const t = {
    de: {
      backHome: "Zurück zur Startseite",
      title: "PASSWORT ZURÜCKSETZEN",
      subtitle: "Fordere einen Code an und setze dein Passwort neu",
      requestButton: "Code senden",
      confirmButton: "Passwort ändern",
      email: "E-Mail",
      emailPlaceholder: "deine@email.ch",
      code: "2FA-Code",
      codePlaceholder: "AB12CD",
      newPassword: "Neues Passwort",
      confirmPassword: "Neues Passwort bestätigen",
      sent: "Falls die E-Mail existiert, wurde ein Code gesendet.",
      success: "Passwort wurde aktualisiert",
      error: "Passwort zurücksetzen fehlgeschlagen",
      backToLogin: "Zurück zum Login",
      passwordsNoMatch: "Passwörter stimmen nicht überein",
      passwordMin: "Passwort muss mindestens 12 Zeichen lang sein",
      passwordUpper: "Passwort muss mindestens einen Großbuchstaben enthalten",
      passwordNumber: "Passwort muss mindestens eine Zahl enthalten",
      passwordSpecial: "Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)"
    },
    en: {
      backHome: "Back to home",
      title: "RESET PASSWORD",
      subtitle: "Request a code and set a new password",
      requestButton: "Send code",
      confirmButton: "Change password",
      email: "Email",
      emailPlaceholder: "your@email.com",
      code: "2FA code",
      codePlaceholder: "AB12CD",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      sent: "If the email exists, a reset code was sent.",
      success: "Password updated successfully",
      error: "Password reset failed",
      backToLogin: "Back to login",
      passwordsNoMatch: "Passwords do not match",
      passwordMin: "Password must be at least 12 characters",
      passwordUpper: "Password must include at least one uppercase letter",
      passwordNumber: "Password must include at least one number",
      passwordSpecial: "Password must include at least one special character (!@#$%^&*...)"
    }
  }[language]

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      setStep("confirm")
      toast.success(t.sent)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  function validatePassword() {
    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsNoMatch)
      return false
    }
    if (newPassword.length < 12) {
      toast.error(t.passwordMin)
      return false
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error(t.passwordUpper)
      return false
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error(t.passwordNumber)
      return false
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      toast.error(t.passwordSpecial)
      return false
    }

    return true
  }

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!code || !newPassword || !confirmPassword) return
    if (!validatePassword()) return

    setLoading(true)
    try {
      console.log("request: /api/auth/password-reset/confirm")
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          newPassword,
          confirmPassword
        })
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || t.error)
      }

      toast.success(t.success)
      router.push("/auth/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // no-op placeholder for future redirect logic
  }, [])

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.backHome}
        </Link>

        <div className="bg-card border-border rounded-2xl border p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-foreground font-display mb-2 text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          {step === "request" ? (
            <form onSubmit={requestReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                {loading ? t.requestButton : t.requestButton}
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                <Link href="/auth/login" className="text-[#530A5D] hover:underline">
                  {t.backToLogin}
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">{t.code}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t.codePlaceholder}
                  maxLength={6}
                  className="text-center font-mono text-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !code || !newPassword || !confirmPassword}
                className="h-12 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                {loading ? t.confirmButton : t.confirmButton}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  )
}
