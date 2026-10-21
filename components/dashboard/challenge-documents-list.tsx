"use client"

import { useEffect, useState } from "react"
import { Loader2, FileText, Download } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ChallengeDocument {
  id: string
  name: string
  file_size: number | null
  created_at: string
}

const copy = {
  de: { title: "Challenge-Dokumente", empty: "Keine Dokumente für diese Challenge." },
  en: { title: "Challenge Documents", empty: "No documents for this challenge." }
} as const

export function ChallengeDocumentsList({ challengeId }: { challengeId: string }) {
  const { language } = useLanguage()
  const t = copy[language]

  const [documents, setDocuments] = useState<ChallengeDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/challenge-documents?challengeId=${challengeId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled) setDocuments(json?.data?.documents || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [challengeId])

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (documents.length === 0) {
    return <p className="text-muted-foreground text-xs">{t.empty}</p>
  }

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{t.title}</p>
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={`/api/download-file?type=challenge&fileId=${doc.id}`}
          className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-2 text-sm transition-colors">
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="text-primary h-4 w-4 shrink-0" />
            <span className="truncate">{doc.name}</span>
          </span>
          <Download className="text-muted-foreground h-4 w-4 shrink-0" />
        </a>
      ))}
    </div>
  )
}
