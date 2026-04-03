'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Users, Send, Loader2, Check, Eye, FlaskConical, Layout, Save, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NewsletterSubscriber {
  email: string;
  subscribed: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  base_template_id: string;
  subject: string;
  content: string;
  cta_text: string | null;
  cta_url: string | null;
  footer_note: string | null;
  created_at: string;
  updated_at: string;
}

const templates: Template[] = [
  { id: 'standard', name: 'Standard', description: 'Sauberes Layout mit Logo-Header und optionalem Button' },
  { id: 'announcement', name: 'Ankündigung', description: 'Auffälliges Design für wichtige Ankündigungen' },
  { id: 'event-reminder', name: 'Event-Erinnerung', description: 'Countdown-Stil für Event-bezogene Nachrichten' },
  { id: 'update', name: 'Update / Newsletter', description: 'Minimales Design für regelmässige Updates' },
];

export function EmailManagementPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [campaignSent, setCampaignSent] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    templateId: 'standard',
    recipientType: 'central_updates' as string,
    ctaText: '',
    ctaUrl: '',
    footerNote: '',
    testEmail: '',
  });

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/email-subscribers', { credentials: 'include' });
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
    fetchSavedTemplates();
  }, []);

  async function fetchSavedTemplates() {
    try {
      const res = await fetch('/api/admin/email-templates', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSavedTemplates(data.data?.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim() || !emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error('Name, Betreff und Inhalt sind erforderlich');
      return;
    }
    try {
      setSavingTemplate(true);
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          baseTemplateId: emailForm.templateId,
          subject: emailForm.subject,
          content: emailForm.content,
          ctaText: emailForm.ctaText || null,
          ctaUrl: emailForm.ctaUrl || null,
          footerNote: emailForm.footerNote || null,
        }),
      });
      if (res.ok) {
        toast.success('Vorlage gespeichert');
        setTemplateDialogOpen(false);
        setTemplateName('');
        setTemplateDescription('');
        fetchSavedTemplates();
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast.error('Fehler beim Speichern der Vorlage');
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/email-templates?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Vorlage gelöscht');
        fetchSavedTemplates();
      }
    } catch {
      toast.error('Fehler beim Löschen');
    }
  }

  function loadSavedTemplate(template: SavedTemplate) {
    setEmailForm({
      subject: template.subject,
      content: template.content,
      templateId: template.base_template_id,
      recipientType: 'central_updates',
      ctaText: template.cta_text || '',
      ctaUrl: template.cta_url || '',
      footerNote: template.footer_note || '',
      testEmail: emailForm.testEmail,
    });
    setDialogOpen(true);
    toast.success(`Vorlage "${template.name}" geladen`);
  }

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === emailForm.templateId),
    [emailForm.templateId]
  );

  // Simple client-side preview HTML that mirrors the server template structure
  const previewHtml = useMemo(() => {
    const brandColor = '#530A5D';
    const content = emailForm.content.replace(/\n/g, '<br>');
    const subject = emailForm.subject || 'Betreff';
    const cta = emailForm.ctaText && emailForm.ctaUrl
      ? `<div style="text-align:center;margin:25px 0;"><a href="${emailForm.ctaUrl}" style="display:inline-block;padding:14px 32px;background:${brandColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${emailForm.ctaText}</a></div>`
      : '';
    const footer = emailForm.footerNote
      ? `<p style="margin:20px 0 0;color:#888;font-size:13px;border-top:1px solid #eee;padding-top:15px;">${emailForm.footerNote.replace(/\n/g, '<br>')}</p>`
      : '';

    if (emailForm.templateId === 'announcement') {
      return `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;"><div style="background:linear-gradient(135deg,${brandColor},#7B1FA2);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;"><p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">📢 Ankündigung</p><h1 style="margin:0;color:#fff;font-size:26px;">${subject}</h1></div><div style="background:#fff;padding:35px 30px;border-radius:0 0 12px 12px;"><div style="color:#333;font-size:16px;line-height:1.6;">${content}</div>${cta}${footer}</div></div>`;
    }
    if (emailForm.templateId === 'event-reminder') {
      return `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;"><div style="background:${brandColor};padding:25px 30px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="margin:0;color:#fff;font-size:24px;">ZENTRAL HACK</h1></div><div style="background:#fff;padding:30px;text-align:center;"><span style="display:inline-block;background:#FEF3C7;color:#92400E;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">🗓️ Event-Erinnerung</span></div><div style="background:#fff;padding:0 30px 35px;"><h2 style="text-align:center;color:#333;font-size:22px;">${subject}</h2><div style="color:#333;font-size:16px;line-height:1.6;">${content}</div>${cta}${footer}</div></div>`;
    }
    if (emailForm.templateId === 'update') {
      return `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;"><div style="background:#fff;padding:30px 30px 0;border-radius:12px 12px 0 0;"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:${brandColor};font-size:18px;font-weight:700;letter-spacing:0.05em;">ZENTRAL HACK</span><span style="color:#999;font-size:13px;">Newsletter</span></div><hr style="border:none;border-top:2px solid ${brandColor};margin:15px 0 0;"></div><div style="background:#fff;padding:25px 30px 35px;border-radius:0 0 12px 12px;"><h2 style="color:#333;font-size:20px;">${subject}</h2><div style="color:#333;font-size:15px;line-height:1.7;">${content}</div>${cta}${footer}</div></div>`;
    }
    // Standard template
    return `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;"><div style="background:${brandColor};padding:30px;text-align:center;border-radius:12px 12px 0 0;"><h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:0.05em;">ZENTRAL HACK</h1></div><div style="background:#fff;padding:35px 30px;border-radius:0 0 12px 12px;"><h2 style="color:#333;font-size:22px;">${subject}</h2><div style="color:#333;font-size:16px;line-height:1.6;">${content}</div>${cta}${footer}</div></div>`;
  }, [emailForm.subject, emailForm.content, emailForm.templateId, emailForm.ctaText, emailForm.ctaUrl, emailForm.footerNote]);

  const handleSendTest = async () => {
    if (!emailForm.testEmail.trim()) {
      toast.error('Test-E-Mail-Adresse erforderlich');
      return;
    }
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error('Betreff und Inhalt erforderlich');
      return;
    }

    try {
      setSendingTest(true);
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailForm.subject,
          content: emailForm.content,
          templateId: emailForm.templateId,
          ctaText: emailForm.ctaText || undefined,
          ctaUrl: emailForm.ctaUrl || undefined,
          footerNote: emailForm.footerNote || undefined,
          testEmail: emailForm.testEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Versenden');
      }

      toast.success(`Test-E-Mail an ${emailForm.testEmail} gesendet`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Test-Versand');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendCampaign = async () => {
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      toast.error('Betreff und Inhalt erforderlich');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: emailForm.subject,
          content: emailForm.content,
          templateId: emailForm.templateId,
          ctaText: emailForm.ctaText || undefined,
          ctaUrl: emailForm.ctaUrl || undefined,
          footerNote: emailForm.footerNote || undefined,
          campaignType: emailForm.recipientType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Versenden');
      }

      const data = await res.json();
      setCampaignSent(true);
      toast.success(`E-Mail an ${data.data?.recipientCount || '?'} Empfänger versendet`);
      setEmailForm({
        subject: '',
        content: '',
        templateId: 'standard',
        recipientType: 'central_updates',
        ctaText: '',
        ctaUrl: '',
        footerNote: '',
        testEmail: '',
      });
      setTimeout(() => {
        setCampaignSent(false);
        setDialogOpen(false);
      }, 2500);
    } catch (error) {
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
              <p className="text-muted-foreground text-center py-8">Noch keine Abonnenten</p>
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
            <CardDescription>Versende E-Mails mit professionellen Vorlagen</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2 bg-violet hover:bg-violet/90">
                  <Send className="w-4 h-4" />
                  Neue Kampagne
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>E-Mail-Kampagne erstellen</DialogTitle>
                  <DialogDescription>
                    Wähle eine Vorlage, gib deinen Text ein und sende zuerst eine Test-E-Mail
                  </DialogDescription>
                </DialogHeader>

                {campaignSent ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Check className="w-12 h-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">E-Mail versendet!</h3>
                    <p className="text-muted-foreground text-center">
                      Deine Kampagne wurde erfolgreich an alle Empfänger versendet.
                    </p>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="compose" className="gap-2">
                        <Layout className="w-4 h-4" />
                        Verfassen
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Vorschau
                      </TabsTrigger>
                      <TabsTrigger value="send" className="gap-2">
                        <Send className="w-4 h-4" />
                        Senden
                      </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Compose ── */}
                    <TabsContent value="compose" className="space-y-4 mt-4">
                      {/* Template Selector */}
                      <div>
                        <Label>Vorlage</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setEmailForm({ ...emailForm, templateId: t.id })}
                              className={`text-left p-3 rounded-lg border-2 transition-all ${
                                emailForm.templateId === t.id
                                  ? 'border-[#530A5D] bg-[#530A5D]/5'
                                  : 'border-border hover:border-[#530A5D]/40'
                              }`}
                            >
                              <p className="font-semibold text-sm">{t.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <Label htmlFor="subject">Betreff *</Label>
                        <Input
                          id="subject"
                          value={emailForm.subject}
                          onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                          placeholder="z.B. Zentral Hack 2026 - Wichtige Updates"
                        />
                      </div>

                      {/* Content */}
                      <div>
                        <Label htmlFor="content">Inhalt * (Nur Text – wird automatisch formatiert)</Label>
                        <Textarea
                          id="content"
                          value={emailForm.content}
                          onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                          placeholder={'Hallo Teilnehmer!\n\nWir freuen uns, euch mitzuteilen, dass...\n\nLiebe Grüsse,\nDas Zentral Hack Team'}
                          rows={8}
                        />
                      </div>

                      {/* CTA Button (optional) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ctaText">Button-Text (optional)</Label>
                          <Input
                            id="ctaText"
                            value={emailForm.ctaText}
                            onChange={(e) => setEmailForm({ ...emailForm, ctaText: e.target.value })}
                            placeholder="z.B. Jetzt anmelden"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ctaUrl">Button-Link</Label>
                          <Input
                            id="ctaUrl"
                            value={emailForm.ctaUrl}
                            onChange={(e) => setEmailForm({ ...emailForm, ctaUrl: e.target.value })}
                            placeholder="https://zentralhack.ch/anmeldung"
                          />
                        </div>
                      </div>

                      {/* Footer Note (optional) */}
                      <div>
                        <Label htmlFor="footerNote">Fussnote (optional)</Label>
                        <Input
                          id="footerNote"
                          value={emailForm.footerNote}
                          onChange={(e) => setEmailForm({ ...emailForm, footerNote: e.target.value })}
                          placeholder="z.B. Bei Fragen antworte einfach auf diese E-Mail."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => setActiveTab('preview')} className="flex-1 gap-2" variant="outline">
                          <Eye className="w-4 h-4" />
                          Vorschau anzeigen
                        </Button>
                        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2" disabled={!emailForm.subject || !emailForm.content}>
                              <Save className="w-4 h-4" />
                              Als Vorlage speichern
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Vorlage speichern</DialogTitle>
                              <DialogDescription>Speichere diese E-Mail als wiederverwendbare Vorlage</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="tpl-name">Vorlagenname *</Label>
                                <Input
                                  id="tpl-name"
                                  value={templateName}
                                  onChange={(e) => setTemplateName(e.target.value)}
                                  placeholder="z.B. Willkommens-E-Mail"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tpl-desc">Beschreibung (optional)</Label>
                                <Input
                                  id="tpl-desc"
                                  value={templateDescription}
                                  onChange={(e) => setTemplateDescription(e.target.value)}
                                  placeholder="z.B. Wird an neue Teilnehmer gesendet"
                                />
                              </div>
                              <Button onClick={handleSaveTemplate} disabled={savingTemplate || !templateName.trim()} className="w-full gap-2">
                                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Speichern
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Preview ── */}
                    <TabsContent value="preview" className="mt-4">
                      <div className="space-y-4">
                        <div className="p-2 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                          <Layout className="w-4 h-4" />
                          Vorlage: <strong>{selectedTemplate?.name}</strong>
                        </div>

                        <div
                          className="border rounded-lg p-4 bg-[#f4f4f7] min-h-[300px]"
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />

                        <div className="flex gap-2">
                          <Button onClick={() => setActiveTab('compose')} variant="outline" className="flex-1">
                            Zurück zum Bearbeiten
                          </Button>
                          <Button onClick={() => setActiveTab('send')} className="flex-1 gap-2 bg-violet hover:bg-violet/90">
                            <Send className="w-4 h-4" />
                            Weiter zum Senden
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── Tab: Send ── */}
                    <TabsContent value="send" className="mt-4 space-y-6">
                      {/* Test Email Section */}
                      <Card className="border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-blue-500" />
                            Test-E-Mail senden
                          </CardTitle>
                          <CardDescription>
                            Sende eine Vorschau an dich selbst, bevor du die Kampagne startest
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Input
                              value={emailForm.testEmail}
                              onChange={(e) => setEmailForm({ ...emailForm, testEmail: e.target.value })}
                              placeholder="deine@email.ch"
                              type="email"
                              className="flex-1"
                            />
                            <Button
                              onClick={handleSendTest}
                              disabled={sendingTest}
                              variant="outline"
                              className="gap-2"
                            >
                              {sendingTest ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FlaskConical className="w-4 h-4" />
                              )}
                              Testen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recipient Selection */}
                      <div>
                        <Label>Empfänger</Label>
                        <Select
                          value={emailForm.recipientType}
                          onValueChange={(val) => setEmailForm({ ...emailForm, recipientType: val })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="central_updates">
                              Alle registrierten Teilnehmer + Newsletter
                            </SelectItem>
                            <SelectItem value="newsletter_subscribers">
                              Nur Newsletter-Abonnenten
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Send Button */}
                      <Button
                        onClick={handleSendCampaign}
                        disabled={sending || !emailForm.subject || !emailForm.content}
                        className="w-full gap-2 bg-violet hover:bg-violet/90 h-12 text-base"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Wird versendet...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Kampagne jetzt versenden
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                💡 <strong>Neu:</strong> Wähle eine Vorlage, gib nur deinen Text ein – das HTML wird automatisch erstellt. Teste zuerst mit einer Test-E-Mail!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#530A5D]" />
            Gespeicherte Vorlagen
          </CardTitle>
          <CardDescription>Klicke auf eine Vorlage, um sie für eine neue Kampagne zu verwenden</CardDescription>
        </CardHeader>
        <CardContent>
          {savedTemplates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Noch keine gespeicherten Vorlagen. Erstelle eine Kampagne und speichere sie als Vorlage.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="border rounded-lg p-4 hover:border-[#530A5D]/40 transition-all cursor-pointer group"
                  onClick={() => loadSavedTemplate(tpl)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{tpl.name}</h4>
                      {tpl.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{tpl.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Betreff: {tpl.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Layout: {templates.find((t) => t.id === tpl.base_template_id)?.name || tpl.base_template_id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(tpl.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                    Aktualisiert: {new Date(tpl.updated_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
