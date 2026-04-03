'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Edit2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  categoryIconMap,
  categoryIconOptions,
  getCategoryPresentation,
  hexToRgba,
  normalizeHexColor,
} from '@/lib/category-config';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  partner_name?: string | null;
  color?: string | null;
  icon?: string | null;
  challenge_description?: string | null;
  show_challenge_description?: boolean | null;
}

interface EditFormState {
  name: string;
  description: string;
  partnerName: string;
  color: string;
  icon: string;
  challengeDescription: string;
  showChallengeDescription: boolean;
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    description: '',
    partnerName: '',
    color: '#530A5D',
    icon: 'sparkles',
    challengeDescription: '',
    showChallengeDescription: false,
  });
  const [saved, setSaved] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/categories', {
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

  const updateEditForm = (field: keyof EditFormState, value: string) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  // Save category content
  const handleSaveCategory = async (categoryId: string) => {
    if (!editForm.name.trim()) {
      toast.error('Titel erforderlich');
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
          name: editForm.name,
          description: editForm.description,
          partnerName: editForm.partnerName,
          color: normalizeHexColor(editForm.color),
          icon: editForm.icon,
          challengeDescription: editForm.challengeDescription,
          showChallengeDescription: editForm.showChallengeDescription,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Speichern');
      }

      setSaved(true);
      toast.success('Kategorie aktualisiert');
      
      // Update local state
      setCategories(categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: editForm.name,
              description: editForm.description,
              partner_name: editForm.partnerName,
              color: normalizeHexColor(editForm.color),
              icon: editForm.icon,
              challenge_description: editForm.challengeDescription,
              show_challenge_description: editForm.showChallengeDescription,
            }
          : category
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
              <div className="h-2" style={{ backgroundColor: getCategoryPresentation(category).color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const presentation = getCategoryPresentation(category);
                      const Icon = presentation.icon;

                      return (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: hexToRgba(presentation.color, 0.14),
                        color: presentation.color,
                      }}
                    >
                          <Icon className="w-6 h-6" />
                    </div>
                      );
                    })()}
                    <div>
                      <CardTitle>{getCategoryPresentation(category).title}</CardTitle>
                      <CardDescription>{category.slug}</CardDescription>
                    </div>
                  </div>
                  <Dialog open={editingId === category.id} onOpenChange={(open) => {
                    if (open) {
                      const presentation = getCategoryPresentation(category);
                      setEditingId(category.id);
                      setEditForm({
                        name: category.name,
                        description: category.description || '',
                        partnerName: category.partner_name || '',
                        color: presentation.color,
                        icon: presentation.iconName,
                        challengeDescription: category.challenge_description || '',
                        showChallengeDescription: Boolean(category.show_challenge_description),
                      });
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
                        <DialogTitle>Kategorie bearbeiten</DialogTitle>
                        <DialogDescription>
                          Aktualisiere Titel, Partner, Icon, Farbe sowie Kategorie- und Challenge-Beschrieb für &quot;{category.name}&quot;
                        </DialogDescription>
                      </DialogHeader>

                      {saved ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Check className="w-12 h-12 text-green-500 mb-4" />
                          <p>Erfolgreich gespeichert!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="name">Titel</Label>
                              <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => updateEditForm('name', e.target.value)}
                                placeholder="Name der Kategorie"
                              />
                            </div>
                            <div>
                              <Label htmlFor="partnerName">Partner</Label>
                              <Input
                                id="partnerName"
                                value={editForm.partnerName}
                                onChange={(e) => updateEditForm('partnerName', e.target.value)}
                                placeholder="Partnername"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                            <div>
                              <Label htmlFor="icon">Icon</Label>
                              <Select value={editForm.icon} onValueChange={(value) => updateEditForm('icon', value)}>
                                <SelectTrigger id="icon">
                                  <SelectValue placeholder="Icon wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoryIconOptions.map((option) => {
                                    const Icon = categoryIconMap[option.value];

                                    return (
                                      <SelectItem key={option.value} value={option.value}>
                                        <span className="flex items-center gap-2">
                                          <Icon className="w-4 h-4" />
                                          <span>{option.label}</span>
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="color">Farbe</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="color"
                                  type="color"
                                  value={normalizeHexColor(editForm.color)}
                                  onChange={(e) => updateEditForm('color', e.target.value)}
                                  className="h-10 w-14 p-1"
                                />
                                <Input
                                  value={editForm.color}
                                  onChange={(e) => updateEditForm('color', e.target.value)}
                                  placeholder="#530A5D"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description">Beschreibung</Label>
                            <Textarea
                              id="description"
                              value={editForm.description}
                              onChange={(e) => updateEditForm('description', e.target.value)}
                              placeholder="Beschreibe diese Kategorie und ihre Herausforderungen..."
                              rows={6}
                            />
                          </div>

                          <div className="rounded-lg border p-4 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <Label htmlFor="showChallengeDescription">Challenge-Beschrieb anzeigen</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Wenn aktiv, wird auf der öffentlichen Kategorie-Detailansicht zusätzlich ein Challenge-Beschrieb angezeigt.
                                </p>
                              </div>
                              <Switch
                                id="showChallengeDescription"
                                checked={editForm.showChallengeDescription}
                                onCheckedChange={(checked) =>
                                  setEditForm((current) => ({ ...current, showChallengeDescription: Boolean(checked) }))
                                }
                              />
                            </div>

                            <div>
                              <Label htmlFor="challengeDescription">Challenge-Beschrieb</Label>
                              <Textarea
                                id="challengeDescription"
                                value={editForm.challengeDescription}
                                onChange={(e) => updateEditForm('challengeDescription', e.target.value)}
                                placeholder="Konkrete Aufgabenstellung, Ziele und Rahmenbedingungen der Challenge..."
                                rows={5}
                              />
                            </div>
                          </div>

                          <div
                            className="rounded-xl border p-4"
                            style={{
                              backgroundColor: normalizeHexColor(editForm.color),
                              color: getCategoryPresentation({ slug: category.slug, ...editForm, partner_name: editForm.partnerName }).textColor,
                            }}
                          >
                            {(() => {
                              const preview = getCategoryPresentation({
                                slug: category.slug,
                                name: editForm.name,
                                description: editForm.description,
                                partner_name: editForm.partnerName,
                                color: editForm.color,
                                icon: editForm.icon,
                              });
                              const Icon = preview.icon;

                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <p className="font-semibold">Vorschau</p>
                                  </div>
                                  <div>
                                    <p className="font-display text-xl font-bold">{preview.title}</p>
                                    <p className="mt-2 text-sm opacity-90">{preview.description}</p>
                                    {editForm.showChallengeDescription && editForm.challengeDescription.trim() ? (
                                      <p className="mt-2 text-sm opacity-85">Challenge: {editForm.challengeDescription}</p>
                                    ) : null}
                                    <p className="mt-3 text-xs opacity-75">Partner: {preview.partnerName}</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <Button
                            onClick={() => handleSaveCategory(category.id)}
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
                <p className="text-sm font-medium mb-2">Partner: {getCategoryPresentation(category).partnerName}</p>
                <p className="text-muted-foreground text-sm line-clamp-3">{category.description}</p>
                {category.show_challenge_description && category.challenge_description ? (
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                    Challenge: {category.challenge_description}
                  </p>
                ) : null}
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
