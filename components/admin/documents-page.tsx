"use client"

import { useEffect, useState } from "react"
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

export function DocumentsManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [categoryId, setCategoryId] = useState<string>("")
  const [docName, setDocName] = useState<string>("")

  // Fetch documents and categories
  useEffect(() => {
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
        toast.error("Fehler beim Laden der Daten")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle file upload
  const handleUpload = async () => {
    if (!file || !categoryId) {
      toast.error("Datei und Kategorie erforderlich")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("categoryId", categoryId)
      if (docName.trim()) {
        formData.append("name", docName.trim())
      }

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        credentials: "include",
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Upload")
      }

      const data = await res.json()
      setDocuments([...documents, data.data?.document])
      setUploaded(true)
      toast.success("Dokument hochgeladen")

      setFile(null)
      setCategoryId("")
      setDocName("")

      setTimeout(() => {
        setUploaded(false)
        setDialogOpen(false)
      }, 2000)
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Upload")
    } finally {
      setUploading(false)
    }
  }

  // Handle delete
  const handleDelete = async (docId: string) => {
    if (!confirm("Möchtest du dieses Dokument wirklich löschen?")) return

    try {
      const res = await fetch(`/api/admin/documents?id=${docId}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!res.ok) {
        throw new Error("Fehler beim Löschen")
      }

      setDocuments(documents.filter((d) => d.id !== docId))
      toast.success("Dokument gelöscht")
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Löschen")
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
          <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            DOKUMENTE
          </h1>
          <p className="text-muted-foreground mt-2">Kategorie-Dokumente verwalten</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet hover:bg-violet/90 gap-2">
              <Upload className="h-4 w-4" />
              Dokument hochladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dokument hochladen</DialogTitle>
              <DialogDescription>Lade ein Dokument für eine Kategorie hoch</DialogDescription>
            </DialogHeader>

            {uploaded ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Check className="mb-4 h-12 w-12 text-green-500" />
                <p>Erfolgreich hochgeladen!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">Dokumentname</Label>
                  <Input
                    id="doc-name"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="z.B. Challenge Briefing"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Kategorie</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle eine Kategorie" />
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

                <div>
                  <Label htmlFor="file">Datei</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
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
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Hochladen
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
          <CardTitle>Alle Dokumente</CardTitle>
          <CardDescription>{documents?.length || 0} Dokumente insgesamt</CardDescription>
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
                      Download
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
            <p className="text-muted-foreground py-8 text-center">Noch keine Dokumente hochgeladen</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
