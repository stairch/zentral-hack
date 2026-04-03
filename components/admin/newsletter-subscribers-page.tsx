'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Subscriber {
  email: string;
  subscribed: boolean;
  created_at: string;
}

export function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  // Fetch subscribers
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin-email-subscribers', {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setSubscribers(data.data?.subscribers || []);
        }
      } catch (error) {
        console.error('Failed to fetch subscribers:', error);
        toast.error('Fehler beim Laden der Abonnenten');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Toggle email selection
  const toggleEmail = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  };

  // Toggle all
  const toggleAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set());
      setAllSelected(false);
    } else {
      setSelectedEmails(new Set(subscribers.map(s => s.email)));
      setAllSelected(true);
    }
  };

  // Export CSV
  const handleExport = () => {
    const emailsToExport = selectedEmails.size > 0 
      ? Array.from(selectedEmails)
      : subscribers.map(s => s.email);

    if (emailsToExport.length === 0) {
      toast.error('Keine E-Mails zum Exportieren ausgewählt');
      return;
    }

    // Create CSV content
    const csvContent = ['email', ...emailsToExport].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${emailsToExport.length} E-Mails exportiert`);
  };

  // Bulk unsubscribe
  const handleBulkUnsubscribe = async () => {
    if (selectedEmails.size === 0) {
      toast.error('Bitte wählen Sie E-Mails aus');
      return;
    }

    if (!confirm(`Möchten Sie ${selectedEmails.size} Abonnenten abmelden?`)) return;

    try {
      const res = await fetch('/api/admin-newsletter-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emails: Array.from(selectedEmails),
        }),
      });

      if (res.ok) {
        setSubscribers(subscribers.filter(s => !selectedEmails.has(s.email)));
        setSelectedEmails(new Set());
        setAllSelected(false);
        toast.success('Abonnenten abgemeldet');
      } else {
        toast.error('Fehler beim Abmelden');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Fehler beim Abmelden');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          NEWSLETTER ABONNENTEN
        </h1>
        <p className="text-muted-foreground mt-2">
          Verwalte Newsletter Abonnenten - {subscribers.length} aktive Abonnenten
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Abonnenten ({selectedEmails.size > 0 ? `${selectedEmails.size} ausgewählt` : 'Alle'})</CardTitle>
              <CardDescription>Wähle Abonnenten aus und exportiere sie oder melde sie ab</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV Exportieren
              </Button>
              {selectedEmails.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkUnsubscribe}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscribers.length > 0 ? (
            <div className="space-y-2">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
                <span className="font-medium text-sm">Alle auswählen ({subscribers.length})</span>
              </div>

              {/* Subscriber List */}
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {subscribers.map((sub) => (
                  <div
                    key={sub.email}
                    className="flex items-center gap-3 p-3 rounded border border-border hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedEmails.has(sub.email)}
                      onCheckedChange={() => toggleEmail(sub.email)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sub.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Abonniert am {new Date(sub.created_at).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Keine Newsletter Abonnenten vorhanden
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
