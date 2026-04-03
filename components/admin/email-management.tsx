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
import { Mail, Users, Send, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NewsletterSubscriber {
  email: string;
  subscribed: boolean;
}

export function EmailManagementPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [campignSent, setCampaignSent] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    htmlContent: '',
    recipientType: 'all_registered' as 'all_registered' | 'newsletter_subscribers',
  });

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

  // Send campaign
  const handleSendCampaign = async () => {
    if (!emailForm.subject.trim() || !emailForm.htmlContent.trim()) {
      toast.error('Betreff und Inhalt erforderlich');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailForm.subject,
          htmlContent: emailForm.htmlContent,
          recipientType: emailForm.recipientType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Versenden');
      }

      setCampaignSent(true);
      toast.success('E-Mail-Kampagne versendet');
      setEmailForm({ subject: '', htmlContent: '', recipientType: 'all_registered' });
      setTimeout(() => {
        setCampaignSent(false);
        setDialogOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to send campaign:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Versenden');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          E-MAIL VERWALTUNG
        </h1>
        <p className="text-muted-foreground mt-2">
          Newsletter-Abonnenten und E-Mail-Kampagnen verwalten
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#530A5D]" />
              Newsletter-Abonnenten
            </CardTitle>
            <CardDescription>{subscribers.length} aktive Abonnenten</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : subscribers.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subscribers.map((sub) => (
                  <div key={sub.email} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                    <span className="text-muted-foreground">{sub.email}</span>
                    {sub.subscribed && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Noch keine Abonnenten
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#530A5D]" />
              E-Mail Kampagne
            </CardTitle>
            <CardDescription>Versende E-Mails an Teilnehmer</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-violet hover:bg-violet/90">
                  <Send className="w-4 h-4" />
                  Neue Kampagne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>E-Mail-Kampagne erstellen</DialogTitle>
                  <DialogDescription>
                    Versende eine E-Mail an Teilnehmer oder Newsletter-Abonnenten
                  </DialogDescription>
                </DialogHeader>

                {campignSent ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Check className="w-12 h-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">E-Mail versendet!</h3>
                    <p className="text-muted-foreground text-center">
                      Deine Kampagne wurde erfolgreich an alle Empfänger versendet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipient-type">Empfänger</Label>
                      <Select value={emailForm.recipientType} onValueChange={(val: any) => setEmailForm({ ...emailForm, recipientType: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_registered">
                            Alle angemeldeten Teilnehmer
                          </SelectItem>
                          <SelectItem value="newsletter_subscribers">
                            Newsletter Abonnenten
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Betreff</Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="z.B. Zentral Hack 2026 - Neue Updates"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">E-Mail Inhalt (HTML)</Label>
                      <Textarea
                        id="content"
                        value={emailForm.htmlContent}
                        onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
                        placeholder="<h2>Hallo Teilnehmer!</h2><p>Das Event wird am...</p>"
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleSendCampaign}
                      disabled={sending}
                      className="w-full gap-2 bg-violet hover:bg-violet/90"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Wird versendet...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kampagne versenden
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                💡 <strong>Tipp:</strong> Du kannst HTML verwenden um schöne, formatierte E-Mails zu erstellen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
