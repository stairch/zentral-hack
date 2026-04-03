"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User as UserIcon,
  LogOut,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          WILLKOMMEN ZURÜCK
        </h1>
        <p className="text-muted-foreground mt-2">
          Schön, dich wiederzusehen, {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Mein Profil
            </CardTitle>
            <CardDescription>Verwalte deine Kontodaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Rolle: <span className="font-medium text-foreground capitalize">{user?.role}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abmelden</CardTitle>
            <CardDescription>Beende deine aktuelle Sitzung</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
