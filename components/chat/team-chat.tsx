"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, Paperclip, Send, PenLine, Trash2, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

interface ChatMessage {
  id: string
  sender_id: string | null
  content: string | null
  attachment_url: string | null
  attachment_name: string | null
  attachment_mime: string | null
  attachment_size: number | null
  edited_at: string | null
  deleted_at: string | null
  created_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  sender_role: string | null
}

interface TeamChatProps {
  teamId: string
}

const copy = {
  de: {
    placeholder: "Nachricht schreiben...",
    send: "Senden",
    edited: "bearbeitet",
    deleted: "Nachricht gelöscht",
    deletedUser: "Gelöschter Nutzer",
    roleAdmin: "Admin",
    roleCategoryPartner: "Kategorien-Admin",
    editSave: "Speichern",
    editCancel: "Abbrechen",
    deleteTitle: "Nachricht löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    loadError: "Fehler beim Laden des Chats",
    sendError: "Nachricht konnte nicht gesendet werden",
    editError: "Nachricht konnte nicht bearbeitet werden",
    deleteError: "Nachricht konnte nicht gelöscht werden",
    attachmentTooLarge: "Datei konnte nicht angehängt werden",
    empty: "Noch keine Nachrichten. Schreib die erste!"
  },
  en: {
    placeholder: "Write a message...",
    send: "Send",
    edited: "edited",
    deleted: "Message deleted",
    deletedUser: "Deleted user",
    roleAdmin: "Admin",
    roleCategoryPartner: "Category Admin",
    editSave: "Save",
    editCancel: "Cancel",
    deleteTitle: "Delete message?",
    deleteDescription: "This action cannot be undone.",
    deleteConfirm: "Delete",
    cancel: "Cancel",
    loadError: "Failed to load chat",
    sendError: "Could not send message",
    editError: "Could not edit message",
    deleteError: "Could not delete message",
    attachmentTooLarge: "Could not attach file",
    empty: "No messages yet. Write the first one!"
  }
} as const

export function TeamChat({ teamId }: TeamChatProps) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = copy[language]
  const dateLocale = language === "en" ? "en-GB" : "de-CH"

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [savingEditId, setSavingEditId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/teams/chat?teamId=${encodeURIComponent(teamId)}`, {
        credentials: "include"
      })
      if (!res.ok) return
      const json = await res.json()
      setMessages(json.data?.messages || [])
    } catch {
      if (isFirstLoad.current) toast.error(t.loadError)
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }

  useEffect(() => {
    void fetchMessages()
    const interval = setInterval(() => void fetchMessages(), 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  useEffect(() => {
    if (!loading) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, loading])

  const handleSend = async () => {
    if (!content.trim() && !file) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append("teamId", teamId)
      if (content.trim()) formData.append("content", content.trim())
      if (file) formData.append("file", file)

      const res = await fetch("/api/teams/chat", { method: "POST", credentials: "include", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t.sendError)

      setMessages((prev) => [...prev, json.data.message])
      setContent("")
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.sendError)
    } finally {
      setSending(false)
    }
  }

  const startEdit = (message: ChatMessage) => {
    setEditingId(message.id)
    setEditingContent(message.content || "")
  }

  const saveEdit = async () => {
    if (!editingId || !editingContent.trim()) return
    setSavingEditId(editingId)
    try {
      const res = await fetch("/api/teams/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageId: editingId, content: editingContent.trim() })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || t.editError)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingId
            ? { ...m, content: json.data.message.content, edited_at: json.data.message.edited_at }
            : m
        )
      )
      setEditingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.editError)
    } finally {
      setSavingEditId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/teams/chat?messageId=${encodeURIComponent(deleteTargetId)}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || t.deleteError)
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === deleteTargetId ? { ...m, deleted_at: new Date().toISOString() } : m))
      )
      setDeleteTargetId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    setFile(picked || null)
  }

  const senderName = (m: ChatMessage) =>
    [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email || t.deletedUser

  const roleLabel = (role: string | null) => {
    if (role === "admin") return t.roleAdmin
    if (role === "category_partner") return t.roleCategoryPartner
    return null
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="text-violet h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-muted-foreground py-8 text-center text-sm">{t.empty}</p>}
        {messages.map((m) => {
          const isOwn = user?.id === m.sender_id
          // Highlight the "other" administrative role from this viewer's perspective in yellow.
          // A plain user never gets highlighted; a category admin only stands out to admins
          // (not to other participants, where they blend in with the muted color).
          const isHighlighted =
            !isOwn &&
            m.sender_role !== "user" &&
            !(m.sender_role === "category_partner" && user?.role === "user")
          const label = roleLabel(m.sender_role)
          const isDeleted = !!m.deleted_at
          const isEditing = editingId === m.id

          return (
            <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <div className="mb-0.5 flex items-baseline gap-2 px-1">
                    <span className="text-xs font-semibold">{senderName(m)}</span>
                    {label && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {label}
                      </Badge>
                    )}
                  </div>
                )}

                {isDeleted ? (
                  <div className="bg-muted text-muted-foreground rounded-2xl px-3 py-2 text-sm italic">
                    {t.deleted}
                  </div>
                ) : isEditing ? (
                  <div className="flex w-full items-start gap-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={2}
                      className="max-w-md"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => void saveEdit()} disabled={savingEditId === m.id}>
                        {savingEditId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : t.editSave}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        {t.editCancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div
                      className={`space-y-2 rounded-2xl px-3 py-2 text-sm ${
                        isOwn
                          ? "bg-violet rounded-br-sm text-white"
                          : isHighlighted
                            ? "bg-yellow text-violet rounded-bl-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                      {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                      {m.attachment_url &&
                        (m.attachment_mime?.startsWith("image/") ? (
                          <a
                            href={`/api/download-file?type=chat&fileId=${m.id}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            <img
                              src={`/api/download-file?type=chat&fileId=${m.id}`}
                              alt={m.attachment_name || "image"}
                              className="max-h-48 rounded-lg"
                            />
                          </a>
                        ) : (
                          <a
                            href={`/api/download-file?type=chat&fileId=${m.id}`}
                            className={`flex max-w-xs items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                              isOwn
                                ? "border-white/30 hover:bg-white/10"
                                : isHighlighted
                                  ? "border-violet/30 hover:bg-violet/10"
                                  : "border-border hover:bg-muted/50"
                            }`}>
                            <FileText
                              className={`h-4 w-4 shrink-0 ${
                                isOwn ? "text-white" : isHighlighted ? "text-violet" : "text-primary"
                              }`}
                            />
                            <span className="truncate">{m.attachment_name}</span>
                          </a>
                        ))}
                    </div>

                    <div
                      className={`absolute top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                        isOwn ? "right-full mr-1" : "left-full ml-1"
                      }`}>
                      {isOwn && m.content && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(m)}>
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-6 w-6"
                          onClick={() => setDeleteTargetId(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-muted-foreground mt-0.5 px-1 text-[11px]">
                  {new Date(m.created_at).toLocaleString(dateLocale)}
                  {m.edited_at && !isDeleted && <span className="italic"> · {t.edited}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-border space-y-2 border-t p-3">
        {file && (
          <div className="bg-muted flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-xs">
            <Paperclip className="h-3 w-3" />
            <span className="max-w-[200px] truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="hidden"
            onChange={handleFilePick}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.placeholder}
            rows={1}
            className="min-h-10 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="bg-violet hover:bg-violet/90 shrink-0"
            onClick={() => void handleSend()}
            disabled={sending || (!content.trim() && !file)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={t.deleteTitle}
        description={t.deleteDescription}
        confirmLabel={t.deleteConfirm}
        cancelLabel={t.cancel}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
      />
    </div>
  )
}
