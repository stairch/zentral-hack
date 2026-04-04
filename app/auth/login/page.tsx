"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, LogIn, Lock } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show2FA, setShow2FA] = useState(false)
  const [code2FA, setCode2FA] = useState("")

  useEffect(() => {
    if (isLoading) return
    if (user) {
      console.log("[Login] User found, redirecting to dashboard")
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Try to sign up first
      try {
        await login(email, password)
      } catch (signupError) {
        throw new Error(signupError instanceof Error ? signupError.message : "Registrierung fehlgeschlagen")
      }

      setShow2FA(true)
      toast.success("2FA Code wurde an deine E-Mail gesendet")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login fehlgeschlagen"
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
      if (!code2FA.trim()) {
        throw new Error("Bitte geben Sie den 2FA-Code ein")
      }

      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: code2FA.toUpperCase() })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.data?.error || errorData.error || "2FA Verifizierung fehlgeschlagen")
      }

      const data = await res.json()
      console.log("[Login] 2FA response:", data)

      toast.success("2FA erfolgreich verifiziert")

      // Wait a moment to ensure cookie is set, then navigate to dashboard
      // The httpOnly cookie is now set by the server and will be sent automatically
      await new Promise((resolve) => setTimeout(resolve, 300))
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler bei der Verifizierung"
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
          Zurück zur Startseite
        </Link>

        <div className="bg-card border-border rounded-2xl border p-8 shadow-lg">
          {!show2FA ? (
            <>
              <div className="mb-8 text-center">
                <h1
                  className="text-foreground mb-2 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}>
                  WILLKOMMEN ZURÜCK
                </h1>
                <p className="text-muted-foreground">Melde dich an, um dein Dashboard zu sehen</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="deine@email.ch"
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
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
                      Anmelden
                    </>
                  )}
                </Button>
              </form>

              <p className="text-muted-foreground mt-6 text-center text-sm">
                Noch kein Konto?{" "}
                <Link href="/anmeldung" className="font-medium text-[#530A5D] hover:underline">
                  Jetzt registrieren
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
                <h1
                  className="text-foreground mb-2 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}>
                  2-FAKTOR AUTH
                </h1>
                <p className="text-muted-foreground text-sm">
                  Code wurde an <strong>{email}</strong> gesendet
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Verifizierungscode</Label>
                  <Input
                    id="code"
                    type="text"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value.toUpperCase())}
                    placeholder="z.B. AB12CD"
                    maxLength={6}
                    required
                    className="bg-background text-center font-mono text-xl"
                    autoFocus
                  />
                  <p className="text-muted-foreground text-center text-xs">6 Zeichen aus E-Mail</p>
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
                      Verifizieren
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
                  Zurück
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  )
}
