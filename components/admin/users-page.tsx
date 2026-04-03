"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserCog, Shield, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "category_partner" | "admin";
  is_active: boolean;
  category_name: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const roleBadgeMap: Record<string, { label: string; className: string }> = {
  admin: { label: "Super Admin", className: "bg-red-600 text-white" },
  category_partner: {
    label: "Kategorien-Admin",
    className: "bg-violet-600 text-white",
  },
  user: { label: "Teilnehmer", className: "bg-gray-500 text-white" },
};

export function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Role change dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    newRole: string;
    userName: string;
  } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [usersRes, catsRes] = await Promise.all([
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/categories", { credentials: "include" }),
      ]);
      if (usersRes.ok) {
        const json = await usersRes.json();
        setUsers(json.data?.users || []);
      }
      if (catsRes.ok) {
        const json = await catsRes.json();
        setCategories(json.data?.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleRoleSelect(userId: string, newRole: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (newRole === "category_partner") {
      setPendingRoleChange({
        userId,
        newRole,
        userName: `${user.first_name} ${user.last_name}`,
      });
      setSelectedCategoryId("");
      setRoleDialogOpen(true);
    } else {
      updateRole(userId, newRole, null);
    }
  }

  async function confirmCategoryPartner() {
    if (!pendingRoleChange || !selectedCategoryId) {
      toast.error("Bitte wähle eine Kategorie aus");
      return;
    }
    await updateRole(
      pendingRoleChange.userId,
      pendingRoleChange.newRole,
      selectedCategoryId
    );
    setRoleDialogOpen(false);
    setPendingRoleChange(null);
  }

  async function updateRole(
    userId: string,
    newRole: string,
    categoryId: string | null
  ) {
    setUpdatingUser(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, role: newRole, categoryId }),
      });
      if (res.ok) {
        const catName =
          categoryId
            ? categories.find((c) => c.id === categoryId)?.name || null
            : newRole === "admin"
            ? null
            : null;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  role: newRole as User["role"],
                  category_name: catName,
                }
              : u
          )
        );
        toast.success("Rolle aktualisiert");
      } else {
        const err = await res.json();
        toast.error(err.error || "Fehler beim Aktualisieren");
      }
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Fehler beim Aktualisieren der Rolle");
    } finally {
      setUpdatingUser(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      `${u.first_name} ${u.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    categoryPartners: users.filter((u) => u.role === "category_partner").length,
    participants: users.filter((u) => u.role === "user").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
        <p className="text-muted-foreground">
          Alle registrierten Benutzer verwalten und Rollen zuweisen
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Kategorien-Admins
            </CardTitle>
            <UserCog className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoryPartners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Teilnehmer</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nach Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Rolle filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Rollen</SelectItem>
            <SelectItem value="admin">Super Admin</SelectItem>
            <SelectItem value="category_partner">Kategorien-Admin</SelectItem>
            <SelectItem value="user">Teilnehmer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registriert am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Keine Benutzer gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const badge = roleBadgeMap[user.role] || roleBadgeMap.user;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.category_name || "-"}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700"
                          >
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-400">
                            Deaktiviert
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val) =>
                            handleRoleSelect(user.id, val)
                          }
                          disabled={updatingUser === user.id}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Super Admin</SelectItem>
                            <SelectItem value="category_partner">
                              Kategorien-Admin
                            </SelectItem>
                            <SelectItem value="user">Teilnehmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category selection dialog for category_partner role */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorien-Admin zuweisen</DialogTitle>
            <DialogDescription>
              Wähle die Kategorie, für die{" "}
              <strong>{pendingRoleChange?.userName}</strong> Admin-Rechte
              erhalten soll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategorie</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen..." />
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
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={confirmCategoryPartner}
                disabled={!selectedCategoryId || updatingUser !== null}
                className="bg-violet hover:bg-violet/90"
              >
                {updatingUser ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Zuweisen"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
