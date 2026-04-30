"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { ADMIN_PERMISSIONS } from "@/lib/admin-permissions"

interface AdminRole {
  id: string
  name: string
  category_id: string | null
  category_name: string | null
  permissions: string[]
  created_at: string
}

interface Category {
  id: string
  name: string
}

const copy = {
  de: {
    heading: "Rollen",
    subtitle: "Benutzerdefinierte Admin-Rollen mit konfigurierbaren Berechtigungen verwalten",
    newRole: "Neue Rolle",
    noRoles: "Noch keine Rollen erstellt",
    noRolesHint:
      "Erstelle eine Rolle und verknüpfe sie mit einer Kategorie und wähle, welche Bereiche im Admin-Panel sichtbar sind.",
    category: "Kategorie",
    noCategory: "Keine Kategorie",
    permissions: "Berechtigungen",
    noPermissions: "Keine Berechtigungen",
    editRole: "Rolle bearbeiten",
    createRole: "Neue Rolle erstellen",
    roleDialogDesc:
      "Gib der Rolle einen Namen, verknüpfe sie optional mit einer Kategorie und wähle die sichtbaren Admin-Bereiche.",
    roleName: "Name der Rolle",
    roleNamePlaceholder: "z.B. Young Talents Admin",
    categoryLabel: "Verknüpfte Kategorie (optional)",
    categoryPlaceholder: "Kategorie wählen...",
    noCategoryOption: "Keine Kategorie",
    permissionsLabel: "Sichtbare Admin-Bereiche",
    cancel: "Abbrechen",
    save: "Speichern",
    create: "Erstellen",
    deleteRole: "Rolle löschen",
    deleteConfirm: "Bist du sicher, dass du die Rolle",
    deleteConfirm2: "löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteButton: "Endgültig löschen",
    createSuccess: "Rolle erstellt",
    updateSuccess: "Rolle aktualisiert",
    deleteSuccess: "Rolle gelöscht",
    createError: "Fehler beim Erstellen",
    updateError: "Fehler beim Aktualisieren",
    deleteError: "Fehler beim Löschen",
    nameRequired: "Name ist erforderlich",
    loadError: "Fehler beim Laden"
  },
  en: {
    heading: "Roles",
    subtitle: "Manage custom admin roles with configurable permissions",
    newRole: "New Role",
    noRoles: "No roles created yet",
    noRolesHint:
      "Create a role and link it to a category, then choose which admin panel sections are visible.",
    category: "Category",
    noCategory: "No category",
    permissions: "Permissions",
    noPermissions: "No permissions",
    editRole: "Edit role",
    createRole: "Create new role",
    roleDialogDesc:
      "Give the role a name, optionally link it to a category, and choose which admin sections are visible.",
    roleName: "Role name",
    roleNamePlaceholder: "e.g. Young Talents Admin",
    categoryLabel: "Linked category (optional)",
    categoryPlaceholder: "Select category...",
    noCategoryOption: "No category",
    permissionsLabel: "Visible admin sections",
    cancel: "Cancel",
    save: "Save",
    create: "Create",
    deleteRole: "Delete role",
    deleteConfirm: "Are you sure you want to delete the role",
    deleteConfirm2: "? This action cannot be undone.",
    deleteButton: "Delete permanently",
    createSuccess: "Role created",
    updateSuccess: "Role updated",
    deleteSuccess: "Role deleted",
    createError: "Failed to create role",
    updateError: "Failed to update role",
    deleteError: "Failed to delete role",
    nameRequired: "Name is required",
    loadError: "Failed to load"
  }
} as const

interface RoleFormState {
  name: string
  categoryId: string
  permissions: string[]
}

const EMPTY_FORM: RoleFormState = { name: "", categoryId: "", permissions: [] }

export function AdminRolesPage() {
  const { language } = useLanguage()
  const text = copy[language]

  const [roles, setRoles] = useState<AdminRole[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null)
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AdminRole | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [rolesRes, catsRes] = await Promise.all([
        fetch("/api/admin/roles", { credentials: "include" }),
        fetch("/api/categories", { credentials: "include" })
      ])
      if (rolesRes.ok) {
        const json = await rolesRes.json()
        setRoles(json.data?.roles || [])
      }
      if (catsRes.ok) {
        const json = await catsRes.json()
        setCategories(json.data?.categories || [])
      }
    } catch {
      toast.error(text.loadError)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingRole(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(role: AdminRole) {
    setEditingRole(role)
    setForm({
      name: role.name,
      categoryId: role.category_id || "",
      permissions: Array.isArray(role.permissions) ? [...role.permissions] : []
    })
    setDialogOpen(true)
  }

  function togglePermission(key: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key]
    }))
  }

  async function saveRole() {
    if (!form.name.trim()) {
      toast.error(text.nameRequired)
      return
    }
    setSaving(true)
    try {
      const body = {
        name: form.name,
        categoryId: form.categoryId || null,
        permissions: form.permissions
      }

      const res = await fetch("/api/admin/roles", {
        method: editingRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editingRole ? { id: editingRole.id, ...body } : body)
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || (editingRole ? text.updateError : text.createError))
        return
      }

      const json = await res.json()
      const savedRole: AdminRole = json.data.role

      if (editingRole) {
        setRoles((prev) => prev.map((r) => (r.id === savedRole.id ? savedRole : r)))
        toast.success(text.updateSuccess)
      } else {
        setRoles((prev) => [...prev, savedRole])
        toast.success(text.createSuccess)
      }

      setDialogOpen(false)
    } catch {
      toast.error(editingRole ? text.updateError : text.createError)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/roles?id=${pendingDelete.id}`, {
        method: "DELETE",
        credentials: "include"
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || text.deleteError)
        return
      }
      setRoles((prev) => prev.filter((r) => r.id !== pendingDelete.id))
      toast.success(text.deleteSuccess)
      setDeleteDialogOpen(false)
      setPendingDelete(null)
    } catch {
      toast.error(text.deleteError)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{text.heading}</h1>
          <p className="text-muted-foreground">{text.subtitle}</p>
        </div>
        <Button onClick={openCreate} className="w-full shrink-0 gap-2 sm:w-auto">
          <Plus className="h-4 w-4" />
          {text.newRole}
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="font-medium">{text.noRoles}</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">{text.noRolesHint}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {role.category_name ? `${text.category}: ${role.category_name}` : text.noCategory}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => {
                        setPendingDelete(role)
                        setDeleteDialogOpen(true)
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">{text.permissions}</p>
                {role.permissions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{text.noPermissions}</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p) => {
                      const perm = ADMIN_PERMISSIONS.find((x) => x.key === p)
                      return (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {perm ? (language === "en" ? perm.labelEn : perm.labelDe) : p}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? text.editRole : text.createRole}</DialogTitle>
            <DialogDescription>{text.roleDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>{text.roleName}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={text.roleNamePlaceholder}
              />
            </div>

            <div>
              <Label>{text.categoryLabel}</Label>
              <Select
                value={form.categoryId || "__none__"}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "__none__" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={text.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{text.noCategoryOption}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-3 block">{text.permissionsLabel}</Label>
              <div className="grid grid-cols-2 gap-2">
                {ADMIN_PERMISSIONS.map((perm) => (
                  <label
                    key={perm.key}
                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
                    <Checkbox
                      checked={form.permissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    {language === "en" ? perm.labelEn : perm.labelDe}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {text.cancel}
              </Button>
              <Button onClick={saveRole} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRole ? text.save : text.create}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {text.deleteRole}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {text.deleteConfirm} <strong>{pendingDelete?.name}</strong>
              {text.deleteConfirm2}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {text.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {text.deleteButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
