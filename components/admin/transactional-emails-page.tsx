"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const RESEND_TEMPLATE_BASE = "https://resend.com/templates"

/** Sentinel Select value for the hardcoded fallback alias. */
const DEFAULT_VALUE = "__default__"

interface TemplateSummary {
  id: string
  name: string
  alias: string | null
  updatedAt: string
}

interface TransactionalEmail {
  key: string
  name: { de: string; en: string }
  description: { de: string; en: string }
  defaultAlias: string
  templateId: string | null
}

const copy = {
  de: {
    heading: "SYSTEMNACHRICHTEN",
    subtitle:
      "Eine Systemnachricht wird für ein bestimmtes Ereignis gesendet (z.B. 2FA, Newsletter-Bestätigung). Wähle für jede automatische E-Mail das Resend-Template.",
    empty: "Keine Systemnachrichten konfiguriert.",
    template: "Template",
    templatePlaceholder: "Template auswählen",
    defaultOption: (alias: string) => `Standard (Alias „${alias}")`,
    noTemplates: "Keine veröffentlichten Templates in Resend gefunden.",
    openInResend: "Template in Resend ansehen",
    preview: "Vorschau",
    previewHint: "Live-Vorschau mit Beispielwerten für die Platzhalter.",
    loadError: "Konfiguration konnte nicht geladen werden",
    previewLoadError: "Vorschau konnte nicht geladen werden",
    saveSuccess: "Template gespeichert",
    saveError: "Speichern fehlgeschlagen"
  },
  en: {
    heading: "SYSTEM MESSAGES",
    subtitle:
      "A system message is sent on a certain event (e.g. 2FA, newsletter confirmation). Pick the Resend template for each automated email, with live preview.",
    empty: "No system messages configured.",
    template: "Template",
    templatePlaceholder: "Select a template",
    defaultOption: (alias: string) => `Default (alias "${alias}")`,
    noTemplates: "No published templates found in Resend.",
    openInResend: "View template in Resend",
    preview: "Preview",
    previewHint: "Live preview using sample values for the placeholders.",
    loadError: "Failed to load configuration",
    previewLoadError: "Failed to load preview",
    saveSuccess: "Template saved",
    saveError: "Failed to save"
  }
} as const

type Copy = (typeof copy)[keyof typeof copy]

type ApiResponse<T> = { success: boolean; data?: T; error?: string }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json.data as T
}

function EmailDetail({
  email,
  templates,
  text,
  language,
  onSaved
}: {
  email: TransactionalEmail
  templates: TemplateSummary[]
  text: Copy
  language: "de" | "en"
  onSaved: (templateId: string | null) => void
}) {
  const [templateId, setTemplateId] = useState<string | null>(email.templateId)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)

  const selectValue = templateId ?? DEFAULT_VALUE

  const onPick = async (value: string) => {
    const nextId = value === DEFAULT_VALUE ? null : value
    setTemplateId(nextId)
    setSaving(true)
    try {
      await api(`/api/admin/emails/transactional`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: email.key, templateId: nextId ?? "" })
      })
      onSaved(nextId)
      toast.success(text.saveSuccess)
    } catch (error) {
      setTemplateId(email.templateId)
      toast.error(error instanceof Error ? error.message : text.saveError)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setPreviewLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ html: string }>(`/api/admin/emails/transactional/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: email.key, templateId: templateId ?? "" })
        })
        if (!cancelled) setPreviewHtml(data.html)
      } catch (error) {
        if (!cancelled) {
          setPreviewHtml("")
          toast.error(error instanceof Error ? error.message : text.previewLoadError)
        }
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [email.key, templateId, text.previewLoadError])

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">{email.name[language]}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{email.description[language]}</p>
      </div>

      <div className="space-y-2">
        <Label>{text.template}</Label>
        {templates.length === 0 ? (
          <p className="text-muted-foreground text-sm">{text.noTemplates}</p>
        ) : (
          <div className="flex items-center gap-2">
            <Select value={selectValue} onValueChange={onPick} disabled={saving}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder={text.templatePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_VALUE}>{text.defaultOption(email.defaultAlias)}</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.alias ? <code className="ml-1 text-[10px]">{t.alias}</code> : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saving && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
          </div>
        )}
        {templateId && (
          <a
            href={`${RESEND_TEMPLATE_BASE}/${templateId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 text-xs text-blue-600">
            <ExternalLink className="h-3 w-3" />
            {text.openInResend}
          </a>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <Label>{text.preview}</Label>
          <p className="text-muted-foreground mt-1 text-xs">{text.previewHint}</p>
        </div>
        <div className="bg-background relative overflow-hidden rounded-md border md:max-w-3xl">
          {previewLoading && (
            <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          )}
          <iframe
            title={`${text.preview} — ${email.name[language]}`}
            sandbox=""
            srcDoc={previewHtml}
            className="h-150 w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  )
}

export function TransactionalEmailsPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [loading, setLoading] = useState(true)
  const [emails, setEmails] = useState<TransactionalEmail[]>([])
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ emails: TransactionalEmail[]; templates: TemplateSummary[] }>(
        "/api/admin/emails/transactional"
      )
      setEmails(data.emails)
      setTemplates(data.templates)
      setSelectedKey((prev) => prev ?? data.emails[0]?.key ?? null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.loadError)
    } finally {
      setLoading(false)
    }
  }, [text.loadError])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    load()
  }, [load])

  const selected = emails.find((email) => email.key === selectedKey) ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{text.heading}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">{text.subtitle}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-muted-foreground text-sm">{text.empty}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-8">
          <nav className="flex flex-col gap-1 md:border-r md:pr-4">
            {emails.map((email) => {
              const active = email.key === selectedKey
              return (
                <button
                  key={email.key}
                  type="button"
                  onClick={() => setSelectedKey(email.key)}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-lg border px-4 py-3 text-left transition-colors",
                    active ? "border-primary/30 bg-primary/5" : "hover:bg-muted border-transparent"
                  )}>
                  <span className={cn("text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                    {email.name[language]}
                  </span>
                  <span className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    {email.description[language]}
                  </span>
                </button>
              )
            })}
          </nav>

          {selected && (
            <EmailDetail
              key={selected.key}
              email={selected}
              templates={templates}
              text={text}
              language={language}
              onSaved={(templateId) =>
                setEmails((prev) =>
                  prev.map((email) => (email.key === selected.key ? { ...email, templateId } : email))
                )
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
