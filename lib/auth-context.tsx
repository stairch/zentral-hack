"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface User {
  id: string
  email: string
  role: "user" | "category_partner" | "sponsor" | "admin"
  firstName?: string
  lastName?: string
  categoryId?: string | null
  adminRoleId?: string | null
  adminRoleName?: string | null
  permissions?: string[] | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  verify2FA: (email: string, code: string) => Promise<void>
  refreshAuth: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, verify if user is authenticated via httpOnly cookie with retry logic
  useEffect(() => {
    const verifyAuth = async () => {
      const maxRetries = 3
      const initialDelayMs = 100
      // Use /api/auth/verify for authentication status checking
      const endpoint = "/api/auth/verify"

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`[AuthContext] Verify attempt ${attempt + 1}/${maxRetries}`)

          const res = await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache"
            }
          })

          if (res.ok) {
            const data = await res.json()
            console.log("[AuthContext] Verify successful:", { userId: data.data?.user?.id })
            if (data.data?.user) {
              setUser(data.data.user)
              setToken(data.data.token || "authenticated")
              setIsLoading(false)
              return
            }
          } else if (res.status === 401) {
            console.log("[AuthContext] Not authenticated (401)")
            setUser(null)
            setToken(null)
            setIsLoading(false)
            return
          }

          // If not ok and not 401, retry with exponential backoff
          if (attempt < maxRetries - 1) {
            const delayMs = initialDelayMs * Math.pow(2, attempt)
            console.log(`[AuthContext] Retrying after ${delayMs}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        } catch (verifyError) {
          console.warn(`[AuthContext] Verify attempt ${attempt + 1} failed:`, verifyError)

          if (attempt < maxRetries - 1) {
            const delayMs = initialDelayMs * Math.pow(2, attempt)
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }
      }

      // All retries exhausted - not authenticated
      console.log("[AuthContext] All verify attempts failed")
      setUser(null)
      setToken(null)
      setIsLoading(false)
    }

    verifyAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await res.json()
    if (data.data.requiresTwoFa) {
      // Pending 2FA, let's not set user in context already
      return
    }

    // No 2FA, login directly
    setToken(data.data.token)
    setUser(data.data.user)
  }

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Include cookies
      body: JSON.stringify({ email, password, confirmPassword: password, firstName, lastName })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || "Signup failed")
    }

    const data = await res.json()
    if (data.data.requiresTwoFa) {
      // Pending 2FA, let's not set user in context already
      return
    }

    // No 2FA, login directly
    setToken(data.data.token)
    setUser(data.data.user)
  }

  const verify2FA = async (email: string, code: string) => {
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code: code.toUpperCase() })
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.data?.error || errorData.error || "2FA Verifizierung fehlgeschlagen")
    }

    const data = await res.json()
    setUser(data.data.user)
    setToken(data.data.token)
  }

  const refreshAuth = async () => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-cache" }
      })

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null)
          setToken(null)
        }
        return
      }

      const data = await res.json()
      if (data.data?.user) {
        setUser(data.data.user)
        setToken(data.data.token || token || "authenticated")
      }
    } catch (error) {
      console.error("Failed to refresh auth state:", error)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null)
      setToken(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, verify2FA, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
