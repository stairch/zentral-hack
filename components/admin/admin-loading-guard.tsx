"use client"

import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export function AdminLoadingGuard({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#530A5D]" />
      </div>
    )
  }

  return <>{children}</>
}
