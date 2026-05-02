"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Mail, Lock, Trash2, RefreshCw, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  currentCategoryName: string | null
  onUpdated: () => Promise<void> | void
}

export function AccountSettings({ currentCategoryId, currentCategoryName, onUpdated }: AccountSettingsProps) {
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
  const [categoryState, setCategoryState] = useState({
    categoryId: currentCategoryId || "",
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
          currentCategory: "Aktuelle Kategorie",
          categoryMissing: "Keine Kategorie registriert",
          emailTitle: "E-Mail-Adresse ändern",
          emailDescription: "Der Bestätigungscode wird an die neue E-Mail gesendet.",
          newEmail: "Neue E-Mail",
          sendCode: "Code senden",
          confirmCode: "Code bestätigen",
          code: "2FA-Code",
          codePlaceholder: "AB12CD",
          passwordTitle: "Passwort ändern",
          passwordDescription:
            "Altes Passwort eingeben, neues Passwort zweimal setzen und mit 2FA bestätigen.",
          currentPassword: "Aktuelles Passwort",
          newPassword: "Neues Passwort",
          confirmPassword: "Neues Passwort bestätigen",
          categoryTitle: "Kategorie ändern",
          categoryDescription: "Deine Anmeldung wird auf eine andere Kategorie verschoben.",
          selectCategory: "Kategorie auswählen",
          noCategories: "Keine Kategorien verfügbar",
          deleteTitle: "Konto löschen",
          deleteDescription:
            "Dein Konto wird deaktiviert und deine Anmeldung wird zurückgezogen. Verknüpfte Dokumente bleiben erhalten.",
          deleteWarning:
            "Nach der Löschung kannst du dich nicht mehr anmelden. Dein Benutzerkonto wird deaktiviert, Registrierungen werden entfernt und verknüpfte Dokumente bleiben im System erhalten.",
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
          currentCategory: "Current category",
          categoryMissing: "No category registered",
          emailTitle: "Change email address",
          emailDescription: "The confirmation code will be sent to the new email address.",
          newEmail: "New email",
          sendCode: "Send code",
          confirmCode: "Confirm code",
          code: "2FA code",
          codePlaceholder: "AB12CD",
          passwordTitle: "Change password",
          passwordDescription: "Enter your old password, set the new password twice, then confirm with 2FA.",
          currentPassword: "Current password",
          newPassword: "New password",
          confirmPassword: "Confirm new password",
          categoryTitle: "Change category",
          categoryDescription: "Your registration will be moved to another category.",
          selectCategory: "Select category",
          noCategories: "No categories available",
          deleteTitle: "Delete account",
          deleteDescription:
            "Your account will be deactivated and your registration withdrawn. Linked documents will remain.",
          deleteWarning:
            "After deletion you will no longer be able to sign in. Your account will be deactivated, registrations removed, and linked documents will remain in the system.",
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

  useEffect(() => {
    setCategoryState((prev) => ({ ...prev, categoryId: currentCategoryId || prev.categoryId }))
  }, [currentCategoryId])

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

  const categoryLabel = currentCategoryName || text.categoryMissing

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#530A5D]" />
          {text.sectionTitle}
        </CardTitle>
        <CardDescription>{text.sectionSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 rounded-lg border p-4">
          <Label className="text-muted-foreground text-sm">{text.currentCategory}</Label>
          <p className="mt-1 font-medium">{categoryLabel}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-4 w-4 text-[#530A5D]" />
                {text.emailTitle}
              </CardTitle>
              <CardDescription>{text.emailDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>{text.newEmail}</Label>
                <Input
                  type="email"
                  value={emailState.newEmail}
                  onChange={(event) => setEmailState((prev) => ({ ...prev, newEmail: event.target.value }))}
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
                  onChange={(event) =>
                    setEmailState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                  }
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
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-4 w-4 text-[#530A5D]" />
                {text.passwordTitle}
              </CardTitle>
              <CardDescription>{text.passwordDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>{text.currentPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.currentPassword}
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, currentPassword: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{text.newPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.newPassword}
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{text.confirmPassword}</Label>
                <Input
                  type="password"
                  value={passwordState.confirmPassword}
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
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
                  onChange={(event) =>
                    setPasswordState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
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
            </CardContent>
          </Card>

          {showCategoryChange && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <RefreshCw className="h-4 w-4 text-[#530A5D]" />
                  {text.categoryTitle}
                </CardTitle>
                <CardDescription>{text.categoryDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>{text.selectCategory}</Label>
                  <Select
                    value={categoryState.categoryId}
                    onValueChange={(value) => setCategoryState((prev) => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? "..." : text.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
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
                {!currentCategoryId ? (
                  <p className="text-muted-foreground text-sm">{text.noCategoryChange}</p>
                ) : null}
                <div className="space-y-2">
                  <Label>{text.code}</Label>
                  <Input
                    value={categoryState.code}
                    onChange={(event) =>
                      setCategoryState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
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
              </CardContent>
            </Card>
          )}

          <Card className="border-destructive/20 bg-destructive/5 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <Trash2 className="h-4 w-4" />
                {text.deleteTitle}
              </CardTitle>
              <CardDescription>{text.deleteDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-destructive/20 bg-background rounded-lg border p-4 text-sm leading-6">
                {text.deleteWarning}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteWarningAcknowledged}
                  onChange={(event) => setDeleteWarningAcknowledged(event.target.checked)}
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
              <div className="max-w-sm space-y-2">
                <Label>{text.code}</Label>
                <Input
                  value={deleteState.code}
                  onChange={(event) =>
                    setDeleteState((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
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
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
