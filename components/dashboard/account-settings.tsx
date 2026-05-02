"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Mail, Lock, Trash2, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

interface CategoryOption {
  id: string
  name: string
}

interface AccountSettingsProps {
  currentCategoryId: string | null
  onUpdated: () => Promise<void> | void
}

export function AccountSettings({ currentCategoryId, onUpdated }: AccountSettingsProps) {
  const { refreshAuth, logout, user } = useAuth()
  const showCategoryChange = user?.role !== "sponsor" && user?.role !== "category_partner"
  const { language } = useLanguage()
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const [emailState, setEmailState] = useState({
    newEmail: "",
    challengeToken: "",
    code: ""
  })
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    challengeToken: "",
    code: ""
  })
  const [categoryState, setCategoryState] = useState<{
    categoryId: string
    challengeToken: string
    code: string
  }>({
    categoryId: "",
    challengeToken: "",
    code: ""
  })
  const [deleteState, setDeleteState] = useState({
    challengeToken: "",
    code: ""
  })
  const [deleteWarningAcknowledged, setDeleteWarningAcknowledged] = useState(false)

  const text = useMemo(
    () =>
      ({
        de: {
          sectionTitle: "Profil verwalten",
          sectionSubtitle: "E-Mail, Passwort, Kategorie und Konto",
          emailTitle: "E-Mail-Adresse ändern",
          emailDescription: "Ändere die E-Mail-Adresse deines Kontos.",
          emailInfo: "Der Bestätigungscode wird an deine neue E-Mail gesendet.",
          newEmail: "Neue E-Mail",
          sendCode: "Code senden",
          confirmCode: "Code bestätigen",
          code: "2FA-Code",
          codePlaceholder: "AB12CD",
          passwordTitle: "Passwort ändern",
          passwordDescription: "Ändere das Passwort deines Kontos.",
          currentPassword: "Aktuelles Passwort",
          newPassword: "Neues Passwort",
          confirmPassword: "Neues Passwort bestätigen",
          categoryTitle: "Kategorie ändern",
          categoryDescription: "Ändere die Kategorie deiner Anmeldung.",
          selectCategory: "Kategorie auswählen",
          noCategories: "Keine Kategorien verfügbar",
          deleteTitle: "Konto löschen",
          deleteDescription: "Lösche dein Konto und ziehe deine Event-Anmeldung zurück.",
          deleteWarning:
            "Dein Konto wird gelöscht und du kannst dich danach nicht mehr anmelden. Deine Event-Anmeldung wird zurückgezogen. Verknüpfte Dokumente bleiben im System erhalten.",
          deleteAck: "Ich habe die Folgen verstanden",
          requestDelete: "Löschcode senden",
          confirmDelete: "Löschen bestätigen",
          cancel: "Abbrechen",
          successRequest: "Bestätigungscode wurde gesendet",
          successUpdate: "Änderung gespeichert",
          successDelete: "Konto gelöscht",
          errorGeneric: "Aktion fehlgeschlagen",
          noCategoryChange: "Keine aktive Anmeldung vorhanden"
        },
        en: {
          sectionTitle: "Manage profile",
          sectionSubtitle: "Email, password, category and account",
          emailTitle: "Change email address",
          emailDescription: "Change the email address for your account.",
          emailInfo: "The confirmation code will be sent to your new email address.",
          newEmail: "New email",
          sendCode: "Send code",
          confirmCode: "Confirm code",
          code: "2FA code",
          codePlaceholder: "AB12CD",
          passwordTitle: "Change password",
          passwordDescription: "Change the password for your account.",
          currentPassword: "Current password",
          newPassword: "New password",
          confirmPassword: "Confirm new password",
          categoryTitle: "Change category",
          categoryDescription: "Change the category of your registration.",
          selectCategory: "Select category",
          noCategories: "No categories available",
          deleteTitle: "Delete account",
          deleteDescription: "Delete your account and cancel your event registration.",
          deleteWarning:
            "Your account will be deleted, and you will no longer be able to sign in. Your event registration will be canceled. Any associated documents will remain in the system.",
          deleteAck: "I understand the consequences",
          requestDelete: "Send delete code",
          confirmDelete: "Confirm deletion",
          cancel: "Cancel",
          successRequest: "Confirmation code sent",
          successUpdate: "Change saved",
          successDelete: "Account deleted",
          errorGeneric: "Action failed",
          noCategoryChange: "No active registration found"
        }
      })[language],
    [language]
  )

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const res = await fetch("/api/categories", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        const list = (json.data?.categories || []).map((category: { id: string; name: string }) => ({
          id: category.id,
          name: category.name
        })) as CategoryOption[]
        setCategories(list)
      } catch (error) {
        console.error("Failed to load categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [])

  const requestAction = async (action: string, body: Record<string, string>) => {
    const res = await fetch("/api/account/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, ...body })
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || text.errorGeneric)
    }

    return res.json()
  }

  const confirmAction = async (action: string, body: Record<string, string>) => {
    const res = await fetch("/api/account/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, ...body })
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || text.errorGeneric)
    }

    return res.json()
  }

  const handleRequestEmail = async () => {
    if (!emailState.newEmail) return
    setLoadingAction("email-request")
    try {
      const json = await requestAction("email_change", { newEmail: emailState.newEmail })
      setEmailState((prev) => ({ ...prev, challengeToken: json.data?.challengeToken || "", code: "" }))
      toast.success(text.successRequest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmEmail = async () => {
    if (!emailState.challengeToken || !emailState.code) return
    setLoadingAction("email-confirm")
    try {
      await confirmAction("email_change", {
        challengeToken: emailState.challengeToken,
        code: emailState.code
      })
      await refreshAuth()
      await onUpdated()
      setEmailState({ newEmail: "", challengeToken: "", code: "" })
      toast.success(text.successUpdate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRequestPassword = async () => {
    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) return
    setLoadingAction("password-request")
    try {
      const json = await requestAction("password_change", {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
        confirmPassword: passwordState.confirmPassword
      })
      setPasswordState((prev) => ({ ...prev, challengeToken: json.data?.challengeToken || "", code: "" }))
      toast.success(text.successRequest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmPassword = async () => {
    if (!passwordState.challengeToken || !passwordState.code) return
    setLoadingAction("password-confirm")
    try {
      await confirmAction("password_change", {
        challengeToken: passwordState.challengeToken,
        code: passwordState.code
      })
      await refreshAuth()
      setPasswordState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        challengeToken: "",
        code: ""
      })
      toast.success(text.successUpdate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRequestCategory = async () => {
    if (!categoryState.categoryId) return
    setLoadingAction("category-request")
    try {
      const json = await requestAction("category_change", { categoryId: categoryState.categoryId })
      setCategoryState((prev) => ({ ...prev, challengeToken: json.data?.challengeToken || "", code: "" }))
      toast.success(text.successRequest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmCategory = async () => {
    if (!categoryState.challengeToken || !categoryState.code) return
    setLoadingAction("category-confirm")
    try {
      await confirmAction("category_change", {
        challengeToken: categoryState.challengeToken,
        code: categoryState.code
      })
      await refreshAuth()
      await onUpdated()
      setCategoryState((prev) => ({ ...prev, categoryId: "", code: "" }))

      toast.success(text.successUpdate)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRequestDelete = async () => {
    setLoadingAction("delete-request")
    try {
      const json = await requestAction("delete_account", {})
      setDeleteState({ challengeToken: json.data?.challengeToken || "", code: "" })
      toast.success(text.successRequest)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteState.challengeToken || !deleteState.code) return
    setLoadingAction("delete-confirm")
    try {
      await confirmAction("delete_account", {
        challengeToken: deleteState.challengeToken,
        code: deleteState.code
      })
      await logout()
      toast.success(text.successDelete)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  console.log(
    "categoryState.categoryId",
    categoryState.categoryId,
    categoryState.categoryId || undefined,
    categoryState.categoryId ? categories.filter((c) => c.id === categoryState.categoryId)[0].name : undefined
  )

  return (
    <Card className="py-0!">
      <CardContent className="space-y-0">
        <div className="divide-y">
          {/* E-Mail */}
          <div className="grid gap-4 pt-6 pb-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#530A5D]" />
                <span className="font-medium">{text.emailTitle}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{text.emailDescription}</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-sm leading-6">
                {text.emailInfo}
              </div>
              <div className="space-y-2">
                <Label>{text.newEmail}</Label>
                <Input
                  type="email"
                  value={emailState.newEmail}
                  onChange={(e) => setEmailState((prev) => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="name@example.com"
                />
              </div>
              <Button
                className="w-full bg-[#530A5D] text-white hover:bg-[#3f0847]"
                onClick={() => void handleRequestEmail()}
                disabled={loadingAction === "email-request" || !emailState.newEmail}>
                {loadingAction === "email-request" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.sendCode
                )}
              </Button>
              <div className="space-y-2">
                <Label>{text.code}</Label>
                <Input
                  value={emailState.code}
                  onChange={(e) => setEmailState((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder={text.codePlaceholder}
                  maxLength={6}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleConfirmEmail()}
                disabled={
                  loadingAction === "email-confirm" ||
                  !emailState.challengeToken ||
                  emailState.code.length !== 6
                }>
                {loadingAction === "email-confirm" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.confirmCode
                )}
              </Button>
            </div>
          </div>

          {/* Passwort */}
          <div className="grid gap-4 py-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#530A5D]" />
                <span className="font-medium">{text.passwordTitle}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{text.passwordDescription}</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{text.currentPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{text.newPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{text.confirmPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <Button
                className="w-full bg-[#530A5D] text-white hover:bg-[#3f0847]"
                onClick={() => void handleRequestPassword()}
                disabled={
                  loadingAction === "password-request" ||
                  !passwordState.currentPassword ||
                  !passwordState.newPassword ||
                  !passwordState.confirmPassword
                }>
                {loadingAction === "password-request" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.sendCode
                )}
              </Button>
              <div className="space-y-2">
                <Label>{text.code}</Label>
                <Input
                  value={passwordState.code}
                  onChange={(e) =>
                    setPasswordState((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  placeholder={text.codePlaceholder}
                  maxLength={6}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleConfirmPassword()}
                disabled={
                  loadingAction === "password-confirm" ||
                  !passwordState.challengeToken ||
                  passwordState.code.length !== 6
                }>
                {loadingAction === "password-confirm" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.confirmCode
                )}
              </Button>
            </div>
          </div>

          {/* Kategorie */}
          {showCategoryChange && (
            <div className="grid gap-4 py-10 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[#530A5D]" />
                  <span className="font-medium">{text.categoryTitle}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{text.categoryDescription}</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{text.selectCategory}</Label>
                  <Select
                    value={categoryState.categoryId}
                    onValueChange={(value) => setCategoryState((prev) => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? "..." : text.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.id !== currentCategoryId)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-[#530A5D] text-white hover:bg-[#3f0847]"
                  onClick={() => void handleRequestCategory()}
                  disabled={
                    loadingAction === "category-request" || !categoryState.categoryId || !currentCategoryId
                  }>
                  {loadingAction === "category-request" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    text.sendCode
                  )}
                </Button>
                {!currentCategoryId && (
                  <p className="text-muted-foreground text-sm">{text.noCategoryChange}</p>
                )}
                <div className="space-y-2">
                  <Label>{text.code}</Label>
                  <Input
                    value={categoryState.code}
                    onChange={(e) =>
                      setCategoryState((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder={text.codePlaceholder}
                    maxLength={6}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleConfirmCategory()}
                  disabled={
                    loadingAction === "category-confirm" ||
                    !categoryState.challengeToken ||
                    categoryState.code.length !== 6 ||
                    !currentCategoryId
                  }>
                  {loadingAction === "category-confirm" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    text.confirmCode
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Konto löschen */}
          <div className="grid gap-4 pt-10 pb-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <Trash2 className="text-destructive h-4 w-4" />
                <span className="text-destructive font-medium">{text.deleteTitle}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{text.deleteDescription}</p>
            </div>
            <div className="space-y-3">
              <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-3 text-sm leading-6">
                {text.deleteWarning}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteWarningAcknowledged}
                  onChange={(e) => setDeleteWarningAcknowledged(e.target.checked)}
                />
                <span>{text.deleteAck}</span>
              </label>
              <Button
                variant="destructive"
                onClick={() => void handleRequestDelete()}
                disabled={loadingAction === "delete-request" || !deleteWarningAcknowledged}
                className="gap-2">
                {loadingAction === "delete-request" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {text.requestDelete}
              </Button>
              <div className="space-y-2">
                <Label>{text.code}</Label>
                <Input
                  value={deleteState.code}
                  onChange={(e) =>
                    setDeleteState((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  placeholder={text.codePlaceholder}
                  maxLength={6}
                />
              </div>
              <Button
                variant="destructive"
                onClick={() => void handleConfirmDelete()}
                disabled={
                  loadingAction === "delete-confirm" ||
                  !deleteState.challengeToken ||
                  deleteState.code.length !== 6
                }
                className="gap-2">
                {loadingAction === "delete-confirm" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {text.confirmDelete}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
