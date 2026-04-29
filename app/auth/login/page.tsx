"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, LogIn, Lock } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, verify2FA, user, isLoading } = useAuth()
  const { language } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show2FA, setShow2FA] = useState(false)
  const [code2FA, setCode2FA] = useState("")

  const t = {
    de: {
      backHome: "Zurück zur Startseite",
      title: "WILLKOMMEN ZURÜCK",
      subtitle: "Melde dich an, um dein Dashboard zu sehen",
      email: "E-Mail",
      password: "Passwort",
      emailPlaceholder: "deine@email.ch",
      loginButton: "Anmelden",
      noAccount: "Noch kein Konto?",
      registerNow: "Jetzt registrieren",
      twoFaTitle: "2-FAKTOR AUTH",
      forgotPassword: "Passwort vergessen?",
      codeSentTo: "Code wurde an",
      codeSentSuffix: "gesendet",
      verificationCode: "Verifizierungscode",
      codePlaceholder: "z.B. AB12CD",
      codeHint: "6 Zeichen aus deiner E-Mail",
      verifyButton: "Verifizieren",
      back: "Zurück",
      twoFaSent: "2FA Code wurde an deine E-Mail gesendet",
      loginFailed: "Login fehlgeschlagen",
      enterCode: "Bitte geben Sie den 2FA-Code ein",
      twoFaSuccess: "2FA erfolgreich verifiziert",
      twoFaError: "Fehler bei der 2FA Verifizierung"
    },
    en: {
      backHome: "Back to home",
      title: "WELCOME BACK",
      subtitle: "Sign in to access your dashboard",
      email: "Email",
      password: "Password",
      emailPlaceholder: "your@email.com",
      loginButton: "Sign in",
      noAccount: "Don't have an account?",
      registerNow: "Register now",
      twoFaTitle: "2-FACTOR AUTH",
      forgotPassword: "Forgot password?",
      codeSentTo: "Code was sent to",
      codeSentSuffix: "",
      verificationCode: "Verification code",
      codePlaceholder: "e.g. AB12CD",
      codeHint: "6 characters from your email",
      verifyButton: "Verify",
      back: "Back",
      twoFaSent: "2FA code was sent to your email",
      loginFailed: "Login failed",
      enterCode: "Please enter the 2FA code",
      twoFaSuccess: "2FA verified successfully",
      twoFaError: "2FA verification failed"
    }
  }[language]

  useEffect(() => {
    if (isLoading) return
    if (user) router.push("/dashboard")
  }, [user, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      setShow2FA(true)
      toast.success(t.twoFaSent)
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loginFailed
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!code2FA.trim()) throw new Error(t.enterCode)
      await verify2FA(email, code2FA)
      toast.success(t.twoFaSuccess)
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : t.twoFaError
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.backHome}
        </Link>

        <div className="bg-card border-border rounded-2xl border p-8 shadow-lg">
          {!show2FA ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-foreground font-display mb-2 text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-background"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      {t.loginButton}
                    </>
                  )}
                </Button>
              </form>

              <p className="text-muted-foreground mt-6 text-center text-sm">
                {t.noAccount}{" "}
                <Link href="/anmeldung" className="font-medium text-[#530A5D] hover:underline">
                  {t.registerNow}
                </Link>
                <br />
                <Link href="/auth/reset-password" className="font-medium text-[#530A5D] hover:underline">
                  {t.forgotPassword}
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-[#530A5D]/10 p-4">
                    <Lock className="h-8 w-8 text-[#530A5D]" />
                  </div>
                </div>
                <h1 className="text-foreground mb-2 text-2xl font-bold">{t.twoFaTitle}</h1>
                <p className="text-muted-foreground text-sm">
                  {t.codeSentTo} <strong>{email}</strong>
                  {t.codeSentSuffix ? ` ${t.codeSentSuffix}` : ""}
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code">{t.verificationCode}</Label>
                  <Input
                    id="code"
                    type="text"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.toUpperCase())}
                    placeholder={t.codePlaceholder}
                    maxLength={6}
                    required
                    className="bg-background text-center font-mono text-xl"
                    autoFocus
                  />
                  <p className="text-muted-foreground text-center text-xs">{t.codeHint}</p>
                </div>

                {error && <p className="text-center text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading || code2FA.length !== 6}
                  className="h-12 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      {t.verifyButton}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShow2FA(false)
                    setCode2FA("")
                    setError(null)
                  }}
                  className="w-full">
                  {t.back}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  )
}
