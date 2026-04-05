"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { toast } from "sonner"

interface Registration {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  category_name: string
  university?: string
  study_program?: string
  semester?: string
  allergies?: string
  dietary_restrictions?: string
  status: string
  created_at: string
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string; description: string }[]
  >([])

  // Fetch categories for filter dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", {
          credentials: "include"
        })
        if (res.ok) {
          const data = await res.json()
          setCategories(data.data?.categories || [])
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()
  }, [])

  // Fetch registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchTerm) params.append("search", searchTerm)
        if (filterCategory) params.append("categoryId", filterCategory)
        params.append("limit", "100")

        const res = await fetch(`/api/admin/registrations?${params}`, {
          credentials: "include"
        })

        if (!res.ok) {
          throw new Error("Failed to fetch registrations")
        }

        const data = await res.json()
        setRegistrations(data.data?.registrations || [])
      } catch (error) {
        console.error("Failed to fetch registrations:", error)
        toast.error("Fehler beim Laden der Anmeldungen")
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchRegistrations()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, filterCategory])

  // Export to CSV
  const handleExport = () => {
    if (registrations.length === 0) {
      toast.error("Keine Daten zum Exportieren")
      return
    }

    const headers = [
      "Name",
      "E-Mail",
      "Kategorie",
      "Hochschule",
      "Studiengang",
      "Semester",
      "Allergien",
      "Diätetische Einschränkungen"
    ]
    const rows = registrations.map((reg) => [
      `${reg.first_name} ${reg.last_name}`,
      reg.email,
      reg.category_name,
      reg.university || "-",
      reg.study_program || "-",
      reg.semester || "-",
      reg.allergies || "-",
      reg.dietary_restrictions || "-"
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `registrations-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Anmeldungen exportiert")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          ANMELDUNGEN
        </h1>
        <p className="text-muted-foreground mt-2">Alle Registrierungen für den Zentral Hack 2026</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Nach Name oder E-Mail suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="cursor-pointer rounded-md border px-4 py-2">
          <option value="">Alle Kategorien</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{registrations?.length || 0} Anmeldungen</span>
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          </CardTitle>
          <CardDescription>Übersicht aller Teilnehmer</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : registrations && registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Hochschule</TableHead>
                    <TableHead>Studiengang</TableHead>
                    <TableHead>Allergien</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        {reg.first_name} {reg.last_name}
                      </TableCell>
                      <TableCell className="text-sm">{reg.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reg.category_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{reg.university || "-"}</TableCell>
                      <TableCell className="text-sm">{reg.study_program || "-"}</TableCell>
                      <TableCell className="text-sm">{reg.allergies ? "✓" : "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={reg.status === "confirmed" ? "default" : "outline"}
                          className={reg.status === "confirmed" ? "bg-green-600" : ""}>
                          {reg.status === "confirmed"
                            ? "Bestätigt"
                            : reg.status === "pending"
                              ? "Ausstehend"
                              : reg.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center">Keine Anmeldungen gefunden</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
