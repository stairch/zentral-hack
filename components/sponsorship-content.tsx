'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { toast } from 'sonner';

const sponsorPackages = [
  {
    name: 'Platin',
    order: 1,
    color: '#530A5D',
    description: 'Premium Partnership',
    benefits: [
      'Individuell',
      'Projektkosten inkl.',
      'Mitwerbschaft/ Präsentation',
      'Verpflegung',
      'Exklusive Networking Events',
    ],
  },
  {
    name: 'Gold',
    order: 2,
    color: '#E6FF17',
    description: 'Gold Partnership',
    benefits: [
      'Logo auf Website und Event Plattform',
      'Logo auf Flyer und Signalétik-Plakaten',
      'Logo auf Social Media Beiträgen',
      'Porträt Sponsor auf Social Media',
      'LED-Banner (0.85m)',
      'Mitwerbung Aussenbereich',
    ],
  },
  {
    name: 'Silber',
    order: 3,
    color: '#C0C0C0',
    description: 'Silver Partnership',
    benefits: [
      'Logo auf Website',
      'Logo auf Event Plattform',
      'Logo auf Social Media Beiträgen',
      'Porträt Sponsor auf Social Media',
      'Mitwerbung Aussenbereich',
    ],
  },
  {
    name: 'Bronze',
    order: 4,
    color: '#CD7F32',
    description: 'Bronze Partnership',
    benefits: [
      'Logo auf Website',
      'Präsenz auf Event Plattform',
      'Mitwerbung Aussenbereich',
    ],
  },
];

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  interestedIn: string;
  message: string;
}

export function SponsorshipContent() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    interestedIn: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      interestedIn: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/sponsorship-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Versenden');
      }

      setSubmitted(true);
      toast.success('Anfrage versendet! Wir melden uns bald.');
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        interestedIn: '',
        message: '',
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Versenden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            SPONSORING
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Werde Teil des grössten Hackathons der Zentralschweiz und unterstütze die nächste
            Generation von Innovatoren
          </motion.p>
        </div>
      </section>

      {/* Sponsorship Packages */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-3xl font-bold text-center mb-12"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            UNSERE SPONSORING PAKETE
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sponsorPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="h-2"
                    style={{ backgroundColor: pkg.color }}
                  />
                  <CardHeader>
                    <CardTitle style={{ color: pkg.color }} className="text-2xl">
                      {pkg.name}
                    </CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pkg.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: pkg.color }}
                          />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Kontakt für Sponsoring
                </CardTitle>
                <CardDescription>
                  Interessiert? Kontaktiere uns für weitere Informationen zu unseren Sponsoring-Paketen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Danke für deine Anfrage!</h3>
                    <p className="text-muted-foreground">
                      Wir werden dich bald kontaktieren, um die Details zu besprechen.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Firmenname *</Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          placeholder="Dein Unternehmen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Kontaktperson *</Label>
                        <Input
                          id="contactName"
                          name="contactName"
                          value={formData.contactName}
                          onChange={handleChange}
                          required
                          placeholder="Dein Name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="deine@email.ch"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+41 XX XXX XX XX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestedIn">Interessiertes Paket</Label>
                      <Select value={formData.interestedIn} onValueChange={handleSelectChange}>
                        <SelectTrigger id="interestedIn">
                          <SelectValue placeholder="Wähle ein Paket" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="platin">Platin</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="silber">Silber</SelectItem>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="other">Andere Anfrage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nachricht</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Zusätzliche Informationen..."
                        rows={4}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#530A5D] hover:bg-[#530A5D]/90 text-white h-12"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Anfrage senden'
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Wir werden deine Anfrage innerhalb von 2-3 Arbeitstagen bearbeiten.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
