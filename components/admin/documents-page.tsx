"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { FileText, Upload, Loader2, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"

interface Document {
  id: string
  name: string
  description?: string
  file_path: string
  file_size?: number
  category_name?: string
  created_at: string
}

interface Category {
  id: string
  name: string
}

const copy = {
  de: {
    heading: "DOKUMENTE",
    subtitle: "Kategorie-Dokumente verwalten",
    upload: "Dokument hochladen",
    dialogTitle: "Dokument hochladen",
    dialogDesc: "Lade ein Dokument für eine Kategorie hoch",
    successMsg: "Erfolgreich hochgeladen!",
    docName: "Dokumentname",
    docNamePlaceholder: "z.B. Challenge Briefing",
    category: "Kategorie",
    categoryPlaceholder: "Wähle eine Kategorie",
    file: "Datei",
    uploading: "Wird hochgeladen...",
    uploadButton: "Hochladen",
    allDocs: "Alle Dokumente",
    docCount: "Dokumente insgesamt",
    noDocs: "Noch keine Dokumente hochgeladen",
    download: "Download",
    loadError: "Fehler beim Laden der Daten",
    validationError: "Datei und Kategorie erforderlich",
    uploadError: "Fehler beim Upload",
    uploadSuccess: "Dokument hochgeladen",
    deleteConfirm: "Möchtest du dieses Dokument wirklich löschen?",
    deleteError: "Fehler beim Löschen",
    deleteSuccess: "Dokument gelöscht"
  },
  en: {
    heading: "DOCUMENTS",
    subtitle: "Manage category documents",
    upload: "Upload Document",
    dialogTitle: "Upload Document",
    dialogDesc: "Upload a document for a category",
    successMsg: "Successfully uploaded!",
    docName: "Document name",
    docNamePlaceholder: "e.g. Challenge Briefing",
    category: "Category",
    categoryPlaceholder: "Select a category",
    file: "File",
    uploading: "Uploading...",
    uploadButton: "Upload",
    allDocs: "All Documents",
    docCount: "documents total",
    noDocs: "No documents uploaded yet",
    download: "Download",
    loadError: "Failed to load data",
    validationError: "File and category are required",
    uploadError: "Upload failed",
    uploadSuccess: "Document uploaded",
    deleteConfirm: "Do you really want to delete this document?",
    deleteError: "Failed to delete",
    deleteSuccess: "Document deleted"
  }
} as const

export function DocumentsManagementPage() {
  const { language, isReady } = useLanguage()
  const { user } = useAuth()
  const text = copy[language]
  const isCategoryPartner = user?.role === "category_partner"

  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const hasDataFetched = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState<string>(user?.categoryId || "")
  const [docName, setDocName] = useState<string>("")

  useEffect(() => {
    if (!isReady || hasDataFetched.current) return
    hasDataFetched.current = true
    const fetchData = async () => {
      try {
        setLoading(true)
        const [docsRes, catsRes] = await Promise.all([
          fetch("/api/admin/documents", { credentials: "include" }),
          fetch("/api/categories", { credentials: "include" })
        ])
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          setDocuments(docsData.data?.documents || [])
        }
        if (catsRes.ok) {
          const catsData = await catsRes.json()
          setCategories(catsData.data?.categories || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error(text.loadError)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isReady])

  const handleUpload = async () => {
    if (!file || !categoryId) {
      toast.error(text.validationError)
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("categoryId", categoryId)
      if (docName.trim()) formData.append("name", docName.trim())

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        credentials: "include",
        body: formData
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || text.uploadError)
      }
      const data = await res.json()
      setDocuments([...documents, data.data?.document])
      setUploaded(true)
      toast.success(text.uploadSuccess)
      setFile(null)
      setCategoryId("")
      setDocName("")
      setTimeout(() => {
        setUploaded(false)
        setDialogOpen(false)
      }, 2000)
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error(error instanceof Error ? error.message : text.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm(text.deleteConfirm)) return
    try {
      const res = await fetch(`/api/admin/documents?id=${docId}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) throw new Error(text.deleteError)
      setDocuments(documents.filter((d) => d.id !== docId))
      toast.success(text.deleteSuccess)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(error instanceof Error ? error.message : text.deleteError)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-foreground text-3xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground mt-2">{text.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet hover:bg-violet/90 gap-2">
              <Upload className="h-4 w-4" />
              {text.upload}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{text.dialogTitle}</DialogTitle>
              <DialogDescription>{text.dialogDesc}</DialogDescription>
            </DialogHeader>

            {uploaded ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Check className="mb-4 h-12 w-12 text-green-500" />
                <p>{text.successMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">{text.docName}</Label>
                  <Input
                    id="doc-name"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder={text.docNamePlaceholder}
                  />
                </div>
                {!isCategoryPartner && (
                  <div>
                    <Label htmlFor="category">{text.category}</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder={text.categoryPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="file">{text.file}</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  {file && <p className="text-muted-foreground mt-2 text-sm">📎 {file.name}</p>}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !file || !categoryId}
                  className="bg-violet hover:bg-violet/90 w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {text.uploading}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {text.uploadButton}
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.allDocs}</CardTitle>
          <CardDescription>
            {documents?.length || 0} {text.docCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#530A5D]" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {doc.category_name || ""}{" "}
                        {doc.file_size ? `• ${Math.round(doc.file_size / 1024)} KB` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => window.open(doc.file_path, "_blank")}>
                      {text.download}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">{text.noDocs}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
