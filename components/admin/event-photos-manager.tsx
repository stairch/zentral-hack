"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Loader2, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { eventPhotoSrc } from "@/lib/event-phase"
import { uploadEventPhoto } from "@/lib/client-upload"

interface EventPhoto {
  id: string
  caption: string | null
  display_order: number
  created_at: string
}

const copy = {
  de: {
    uploadHint:
      "Mehrere Fotos auf einmal möglich, bis 30 MB pro Foto. Sie werden beim Hochladen komprimiert und brauchen kein Speichern.",
    captionLabel: "Bildunterschrift (optional)",
    captionPlaceholder: "z.B. Pitch-Finale Samstagabend",
    upload: "Hochladen",
    uploadSuccess: (n: number) => (n === 1 ? "Foto hochgeladen" : `${n} Fotos hochgeladen`),
    uploadError: "Fehler beim Hochladen",
    uploadFailed: (n: number) => `${n} ${n === 1 ? "Foto konnte" : "Fotos konnten"} nicht hochgeladen werden`,
    uploadProgress: (done: number, total: number) => `${done} / ${total}`,
    listTitle: "Hochgeladene Fotos",
    noPhotos: "Noch keine Fotos hochgeladen.",
    loadError: "Fehler beim Laden",
    deleteTitle: "Foto löschen?",
    deleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteConfirm: "Löschen",
    cancel: "Abbrechen",
    deleteSuccess: "Foto gelöscht",
    deleteError: "Fehler beim Löschen"
  },
  en: {
    uploadHint:
      "Several photos at once, up to 30 MB each. They are compressed while uploading and need no saving.",
    captionLabel: "Caption (optional)",
    captionPlaceholder: "e.g. Saturday night pitch finale",
    upload: "Upload",
    uploadSuccess: (n: number) => (n === 1 ? "Photo uploaded" : `${n} photos uploaded`),
    uploadError: "Failed to upload",
    uploadFailed: (n: number) => `${n} ${n === 1 ? "photo" : "photos"} could not be uploaded`,
    uploadProgress: (done: number, total: number) => `${done} / ${total}`,
    listTitle: "Uploaded photos",
    noPhotos: "No photos uploaded yet.",
    loadError: "Failed to load",
    deleteTitle: "Delete photo?",
    deleteDescription: "This action cannot be undone.",
    deleteConfirm: "Delete",
    cancel: "Cancel",
    deleteSuccess: "Photo deleted",
    deleteError: "Failed to delete"
  }
} as const

// Embedded in the event phase admin page, next to the gallery texts
export function EventPhotosManager() {
  const { language } = useLanguage()
  const text = copy[language]

  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState("")
  const [files, setFiles] = useState<File[]>([])
  // Photos are uploaded one after another, so progress is the count done so far
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  useEffect(() => {
    void load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/event-photos", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setPhotos(data.data?.photos || [])
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    let uploaded = 0
    let failed = 0
    setProgress({ done: 0, total: files.length })
    for (const file of files) {
      try {
        const photo = await uploadEventPhoto(file, { caption: caption.trim() || undefined })
        setPhotos((prev) => [...prev, photo])
        uploaded++
      } catch (error) {
        console.error(`[Event Photos] Upload of ${file.name} failed:`, error)
        failed++
      }
      setProgress({ done: uploaded + failed, total: files.length })
    }
    setProgress(null)
    setFiles([])
    setCaption("")
    setFileInputKey((k) => k + 1)
    if (uploaded > 0) toast.success(text.uploadSuccess(uploaded))
    if (failed > 0) toast.error(text.uploadFailed(failed))
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/event-photos?id=${deleteId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error()
      setPhotos((prev) => prev.filter((p) => p.id !== deleteId))
      toast.success(text.deleteSuccess)
      setDeleteId(null)
    } catch {
      toast.error(text.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            key={fileInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={progress !== null}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={text.captionPlaceholder}
            aria-label={text.captionLabel}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">{text.uploadHint}</p>
          <Button
            onClick={() => void handleUpload()}
            disabled={progress !== null || files.length === 0}
            className="bg-violet hover:bg-violet/90 gap-2">
            {progress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {progress ? text.uploadProgress(progress.done, progress.total) : text.upload}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{text.listTitle}</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">{text.noPhotos}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border">
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={eventPhotoSrc(photo.id, "thumbnail")}
                    alt={photo.caption || ""}
                    className="aspect-square w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                  />
                </div>
                {photo.caption && <p className="bg-background/90 truncate p-2 text-xs">{photo.caption}</p>}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setDeleteId(photo.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={text.deleteTitle}
        description={text.deleteDescription}
        confirmLabel={text.deleteConfirm}
        cancelLabel={text.cancel}
        onConfirm={() => void handleDelete()}
        loading={deleting}
      />
    </div>
  )
}
