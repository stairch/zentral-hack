"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      console.log("[Dashboard] No user found, redirecting to login")
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  return <DashboardContent />
}
