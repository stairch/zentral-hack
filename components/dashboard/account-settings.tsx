"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { emailSchema } from "@/lib/validation"

interface AccountSettingsProps {
  onUpdated: () => Promise<void> | void
}

const CODE_LENGTH = 6

export function AccountSettings({ onUpdated }: AccountSettingsProps) {
  const { user, refreshAuth, logout } = useAuth()
  const { language } = useLanguage()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const [emailState, setEmailState] = useState({ newEmail: "", code: "", codeSent: false })
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  const deletePhrase = `DELETE ${user?.email ?? ""}`

  const text = useMemo(
    () =>
      ({
        de: {
          heading: "Konto & Sicherheit",
          subheading: "E-Mail, Passwort und Kontolöschung verwalten",
          emailTitle: "E-Mail-Adresse ändern",
          newEmail: "Neue E-Mail",
          sendCode: "Code senden",
          code: "Bestätigungscode",
          codePlaceholder: "AB12CD",
          confirm: "Bestätigen",
          codeSentInfo: "Wir haben dir einen Bestätigungscode per E-Mail geschickt.",
          passwordTitle: "Passwort ändern",
          currentPassword: "Aktuelles Passwort",
          newPassword: "Neues Passwort",
          confirmPassword: "Neues Passwort bestätigen",
          changePassword: "Passwort ändern",
          passwordsNoMatch: "Neue Passwörter stimmen nicht überein",
          passwordMin: "Neues Passwort muss mindestens 12 Zeichen lang sein",
          passwordUpper: "Neues Passwort muss mindestens einen Großbuchstaben enthalten",
          passwordNumber: "Neues Passwort muss mindestens eine Zahl enthalten",
          passwordSpecial: "Neues Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)",
          deleteTitle: "Konto löschen",
          deleteWarning:
            "Dein Konto und alle zugehörigen Daten werden unwiderruflich gelöscht. Bereits hochgeladene Dokumente bleiben erhalten.",
          deleteOpen: "Konto löschen",
          deleteConfirmLabel: (phrase: string) => `Gib zur Bestätigung „${phrase}“ ein`,
          deleteConfirmButton: "Konto endgültig löschen",
          cancel: "Abbrechen",
          successUpdate: "Änderung gespeichert",
          successDelete: "Konto gelöscht",
          errorGeneric: "Aktion fehlgeschlagen",
          emailInvalid: "Ungültige E-Mail-Adresse.",
          successRequest: "Bestätigungscode wurde gesendet"
        },
        en: {
          heading: "Account & Security",
          subheading: "Manage email, password and account deletion",
          emailTitle: "Change email address",
          newEmail: "New email",
          sendCode: "Send code",
          code: "Confirmation code",
          codePlaceholder: "AB12CD",
          confirm: "Confirm",
          codeSentInfo: "We've emailed you a confirmation code.",
          passwordTitle: "Change password",
          currentPassword: "Current password",
          newPassword: "New password",
          confirmPassword: "Confirm new password",
          changePassword: "Change password",
          passwordsNoMatch: "New passwords do not match",
          passwordMin: "New password must be at least 12 characters",
          passwordUpper: "New password must include at least one uppercase letter",
          passwordNumber: "New password must include at least one number",
          passwordSpecial: "New password must include at least one special character (!@#$%^&*...)",
          deleteTitle: "Delete account",
          deleteWarning:
            "Your account and all associated data will be permanently deleted. Documents you already uploaded are kept.",
          deleteOpen: "Delete account",
          deleteConfirmLabel: (phrase: string) => `Type "${phrase}" to confirm`,
          deleteConfirmButton: "Delete account permanently",
          cancel: "Cancel",
          successUpdate: "Change saved",
          successDelete: "Account deleted",
          errorGeneric: "Action failed",
          emailInvalid: "Invalid email address.",
          successRequest: "Confirmation code sent"
        }
      })[language],
    [language]
  )

  const postJson = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || text.errorGeneric)
    }
    return res.json()
  }

  const withLoading = async (key: string, fn: () => Promise<void>) => {
    setLoadingAction(key)
    try {
      await fn()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.errorGeneric)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRequestEmail = () =>
    withLoading("email-request", async () => {
      if (!emailSchema.safeParse(emailState.newEmail).success) {
        toast.error(text.emailInvalid)
        return
      }
      await postJson("/api/account/email/request", { newEmail: emailState.newEmail })
      setEmailState((prev) => ({ ...prev, code: "", codeSent: true }))
      toast.success(text.successRequest)
    })

  const handleConfirmEmail = () =>
    withLoading("email-confirm", async () => {
      await postJson("/api/account/email/confirm", { code: emailState.code })
      await refreshAuth()
      await onUpdated()
      setEmailState({ newEmail: "", code: "", codeSent: false })
      toast.success(text.successUpdate)
    })

  const validatePassword = () => {
    const { newPassword, confirmPassword } = passwordState
    if (newPassword !== confirmPassword) return (toast.error(text.passwordsNoMatch), false)
    if (newPassword.length < 12) return (toast.error(text.passwordMin), false)
    if (!/[A-Z]/.test(newPassword)) return (toast.error(text.passwordUpper), false)
    if (!/[0-9]/.test(newPassword)) return (toast.error(text.passwordNumber), false)
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword))
      return (toast.error(text.passwordSpecial), false)
    return true
  }

  const handleChangePassword = () =>
    withLoading("password", async () => {
      if (!validatePassword()) return
      await postJson("/api/account/password", {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
        confirmPassword: passwordState.confirmPassword
      })
      await refreshAuth()
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success(text.successUpdate)
    })

  const handleConfirmDelete = () =>
    withLoading("delete", async () => {
      await postJson("/api/account/delete", { confirmation: deleteConfirmation })
      setDeleteDialogOpen(false)
      toast.success(text.successDelete)
      await logout()
    })

  return (
    <section>
      <h2 className="text-base font-bold">{text.heading}</h2>
      <p className="text-muted-foreground mt-0.5 mb-3 text-[13px]">{text.subheading}</p>

      <Accordion type="single" collapsible className="flex flex-col gap-2.5">
        {/* E-Mail */}
        <AccordionItem value="email" className="rounded-[10px] border px-4">
          <AccordionTrigger className="py-3.5 text-sm font-bold hover:no-underline">
            {text.emailTitle}
          </AccordionTrigger>
          <AccordionContent className="border-border border-t pt-4 pb-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{text.newEmail}</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className="text-sm"
                  value={emailState.newEmail}
                  onChange={(e) => setEmailState((prev) => ({ ...prev, newEmail: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => void handleRequestEmail()}
                disabled={loadingAction === "email-request" || !emailState.newEmail}>
                {loadingAction === "email-request" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.sendCode
                )}
              </Button>
              {emailState.codeSent && (
                <>
                  <p className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm leading-6">
                    {text.codeSentInfo}
                  </p>
                  <div className="space-y-1.5">
                    <Label>{text.code}</Label>
                    <Input
                      value={emailState.code}
                      maxLength={CODE_LENGTH}
                      placeholder={text.codePlaceholder}
                      onChange={(e) =>
                        setEmailState((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void handleConfirmEmail()}
                    disabled={loadingAction === "email-confirm" || emailState.code.length !== CODE_LENGTH}>
                    {loadingAction === "email-confirm" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      text.confirm
                    )}
                  </Button>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Passwort */}
        <AccordionItem value="pw" className="rounded-[10px] border px-4">
          <AccordionTrigger className="py-3.5 text-sm font-bold hover:no-underline">
            {text.passwordTitle}
          </AccordionTrigger>
          <AccordionContent className="border-border border-t pt-4 pb-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{text.currentPassword}</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{text.newPassword}</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{text.confirmPassword}</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => void handleChangePassword()}
                disabled={
                  loadingAction === "password" ||
                  !passwordState.currentPassword ||
                  !passwordState.newPassword ||
                  !passwordState.confirmPassword
                }>
                {loadingAction === "password" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  text.changePassword
                )}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Konto löschen */}
        <AccordionItem value="delete" className="border-destructive/40 rounded-[10px] border! px-4">
          <AccordionTrigger className="text-destructive py-3.5 text-sm font-bold hover:no-underline">
            {text.deleteTitle}
          </AccordionTrigger>
          <AccordionContent className="border-border border-t pt-4 pb-4">
            <div className="space-y-3">
              <p className="text-muted-foreground text-[13px] leading-6">{text.deleteWarning}</p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setDeleteConfirmation("")
                  setDeleteDialogOpen(true)
                }}>
                {text.deleteOpen}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{text.deleteTitle}</DialogTitle>
            <DialogDescription>{text.deleteWarning}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>{text.deleteConfirmLabel(deletePhrase)}</Label>
            <Input
              value={deleteConfirmation}
              autoComplete="off"
              placeholder={deletePhrase}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{text.cancel}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
              disabled={loadingAction === "delete" || deleteConfirmation !== deletePhrase}>
              {loadingAction === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                text.deleteConfirmButton
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
