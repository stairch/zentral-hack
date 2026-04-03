'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Bot, GraduationCap, MapPin, Edit2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  bot: <Bot className="w-6 h-6" />,
  'graduation-cap': <GraduationCap className="w-6 h-6" />,
  'map-pin': <MapPin className="w-6 h-6" />,
};

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ description: '' });
  const [saved, setSaved] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/categories', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data?.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Fehler beim Laden der Kategorien');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Save category description
  const handleSaveDescription = async (categoryId: string) => {
    if (!editForm.description.trim()) {
      toast.error('Beschreibung erforderlich');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: categoryId,
          description: editForm.description,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Speichern');
      }

      setSaved(true);
      toast.success('Beschreibung aktualisiert');
      
      // Update local state
      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, description: editForm.description } : c
      ));

      setTimeout(() => {
        setSaved(false);
        setEditingId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          KATEGORIEN
        </h1>
        <p className="text-muted-foreground mt-2">
          Hackathon-Kategorien und Challenges verwalten
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories?.length > 0 ? (
          categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: category.color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {iconMap[category.icon] || <Sparkles className="w-6 h-6" />}
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.slug}</CardDescription>
                    </div>
                  </div>
                  <Dialog open={editingId === category.id} onOpenChange={(open) => {
                    if (open) {
                      setEditingId(category.id);
                      setEditForm({ description: category.description });
                    } else {
                      setEditingId(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Beschreibung bearbeiten</DialogTitle>
                        <DialogDescription>
                          Aktualisiere die Beschreibung für &quot;{category.name}&quot;
                        </DialogDescription>
                      </DialogHeader>

                      {saved ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Check className="w-12 h-12 text-green-500 mb-4" />
                          <p>Erfolgreich gespeichert!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="description">Beschreibung</Label>
                            <Textarea
                              id="description"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ description: e.target.value })}
                              placeholder="Beschreibe diese Kategorie und ihre Herausforderungen..."
                              rows={6}
                            />
                          </div>
                          <Button
                            onClick={() => handleSaveDescription(category.id)}
                            disabled={saving}
                            className="w-full bg-violet hover:bg-violet/90"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Wird gespeichert...
                              </>
                            ) : (
                              'Speichern'
                            )}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">{category.description}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Keine Kategorien gefunden</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
