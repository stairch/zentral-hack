'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, Pencil, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
}

export function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '' });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faqs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.data?.faqs || []);
      }
    } catch {
      toast.error('Fehler beim Laden der FAQs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingFaq(null);
    setForm({ question: '', answer: '' });
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setForm({ question: faq.question, answer: faq.answer });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Frage und Antwort sind erforderlich');
      return;
    }

    setSaving(true);
    try {
      if (editingFaq) {
        const res = await fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: editingFaq.id,
            question: form.question,
            answer: form.answer,
          }),
        });
        if (!res.ok) throw new Error('Fehler beim Aktualisieren');
        setFaqs(faqs.map(f =>
          f.id === editingFaq.id ? { ...f, question: form.question, answer: form.answer } : f
        ));
        toast.success('FAQ aktualisiert');
      } else {
        const res = await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Fehler beim Erstellen');
        const data = await res.json();
        setFaqs([...faqs, data.data.faq]);
        toast.success('FAQ erstellt');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('FAQ wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setFaqs(faqs.filter(f => f.id !== id));
        toast.success('FAQ gelöscht');
      }
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: faq.id, is_active: !faq.is_active }),
      });
      if (res.ok) {
        setFaqs(faqs.map(f =>
          f.id === faq.id ? { ...f, is_active: !f.is_active } : f
        ));
      }
    } catch {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const moveOrder = async (faq: FAQ, direction: 'up' | 'down') => {
    const idx = faqs.findIndex(f => f.id === faq.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= faqs.length) return;

    const other = faqs[swapIdx];
    try {
      await Promise.all([
        fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: faq.id, order_position: other.order_position }),
        }),
        fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: other.id, order_position: faq.order_position }),
        }),
      ]);

      const newFaqs = [...faqs];
      const tempOrder = newFaqs[idx].order_position;
      newFaqs[idx] = { ...newFaqs[idx], order_position: newFaqs[swapIdx].order_position };
      newFaqs[swapIdx] = { ...newFaqs[swapIdx], order_position: tempOrder };
      newFaqs.sort((a, b) => a.order_position - b.order_position);
      setFaqs(newFaqs);
    } catch {
      toast.error('Fehler beim Sortieren');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            FAQ VERWALTUNG
          </h1>
          <p className="text-muted-foreground mt-2">
            Häufig gestellte Fragen verwalten
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-violet hover:bg-violet/90" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Neue FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFaq ? 'FAQ bearbeiten' : 'Neue FAQ erstellen'}</DialogTitle>
              <DialogDescription>
                {editingFaq ? 'Bearbeite die Frage und Antwort' : 'Erstelle eine neue häufig gestellte Frage'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question">Frage</Label>
                <Input
                  id="question"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="z.B. Was ist der Zentral Hack?"
                />
              </div>
              <div>
                <Label htmlFor="answer">Antwort</Label>
                <Textarea
                  id="answer"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Die Antwort auf die Frage..."
                  rows={5}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-violet hover:bg-violet/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingFaq ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle FAQs</CardTitle>
          <CardDescription>
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} • {faqs.filter(f => f.is_active).length} aktiv
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                    faq.is_active ? 'border-border bg-card' : 'border-dashed border-muted bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex flex-col gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => moveOrder(faq, 'up')}
                    >
                      <GripVertical className="w-3 h-3 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === faqs.length - 1}
                      onClick={() => moveOrder(faq, 'down')}
                    >
                      <GripVertical className="w-3 h-3" />
                    </Button>
                  </div>
                  <HelpCircle className="w-5 h-5 text-violet mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={() => toggleActive(faq)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Noch keine FAQs. Klicke auf &quot;Neue FAQ&quot;, um zu starten.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
