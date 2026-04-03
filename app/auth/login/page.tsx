"use client"

import { useState } from "react"
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
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show2FA, setShow2FA] = useState(false)
  const [code2FA, setCode2FA] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen')
      }
      
      // 2FA is required for all users
      if (data.data?.requiresTwoFa) {
        setShow2FA(true)
        toast.success('2FA Code wurde an deine E-Mail gesendet')
        return
      }

      // Should not reach here - 2FA is always required
      throw new Error('Unexpected login state')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login fehlgeschlagen'
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
        throw new Error('Bitte geben Sie den 2FA-Code ein')
      }

      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: code2FA.toUpperCase() }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.data?.error || errorData.error || '2FA Verifizierung fehlgeschlagen')
      }

      const data = await res.json()
      console.log('[Login] 2FA response:', data);
      
      toast.success('2FA erfolgreich verifiziert')
      
      // Wait a moment to ensure cookie is set, then navigate to dashboard
      // The httpOnly cookie is now set by the server and will be sent automatically
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler bei der Verifizierung'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Startseite
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {!show2FA ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  WILLKOMMEN ZURÜCK
                </h1>
                <p className="text-muted-foreground">
                  Melde dich an, um dein Dashboard zu sehen
                </p>
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

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#530A5D] hover:bg-[#530A5D]/90 text-white h-12"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Anmelden
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground text-sm mt-6">
                Noch kein Konto?{" "}
                <Link href="/anmeldung" className="text-[#530A5D] hover:underline font-medium">
                  Jetzt registrieren
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#530A5D]/10 p-4 rounded-full">
                    <Lock className="w-8 h-8 text-[#530A5D]" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
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
                    className="bg-background text-center text-xl font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    6 Zeichen aus E-Mail
                  </p>
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading || code2FA.length !== 6}
                  className="w-full bg-[#530A5D] hover:bg-[#530A5D]/90 text-white h-12"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
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
                  className="w-full"
                >
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
