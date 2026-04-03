'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  member_count?: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export function TeamsAdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    categoryId: '',
  });

  // Fetch categories and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const catRes = await fetch('/api/categories', {
          credentials: 'include',
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.data?.categories || []);
        }

        // Fetch teams
        const teamsRes = await fetch('/api/admin-teams', {
          credentials: 'include',
        });
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData.data?.teams || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create team
  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.categoryId) {
      toast.error('Team-Name und Kategorie erforderlich');
      return;
    }

    try {
      setIsCreating(true);
      const res = await fetch('/api/admin-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description || null,
          categoryId: newTeam.categoryId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Erstellen des Teams');
      }

      const data = await res.json();
      setTeams([...teams, data.data.team]);
      setNewTeam({ name: '', description: '', categoryId: '' });
      setDialogOpen(false);
      toast.success('Team erstellt');
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Erstellen des Teams');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            TEAMS
          </h1>
          <p className="text-muted-foreground mt-2">
            Verwalte alle Teams und deren Mitglieder
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-violet hover:bg-violet/90">
              <Plus className="w-4 h-4" />
              Neues Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Team erstellen</DialogTitle>
              <DialogDescription>
                Erstelle ein neues Team für eine Kategorie
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team-Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="z.B. Team Alpha"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select value={newTeam.categoryId} onValueChange={(val) => setNewTeam({ ...newTeam, categoryId: val })}>
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
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Textarea
                  id="description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Teamdescription..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreating}
                className="w-full bg-violet hover:bg-violet/90"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Team erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.category_name}</CardDescription>
                  </div>
                  <Badge variant="outline">{team.member_count || 0} Members</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.description && (
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Team erstellt: {new Date(team.created_at).toLocaleDateString('de-CH')}
                </div>
                <Button variant="outline" className="w-full">
                  Team verwalten
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && teams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Noch keine Teams erstellt. Klicke auf "Neues Team", um zu starten.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
