'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const sponsorPackages = [
  {
    name: 'Platin',
    order: 1,
    color: '#530A5D',
    description: 'Premium Partnership Package',
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
    description: 'Gold Partnership Package',
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
    description: 'Silver Partnership Package',
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
    description: 'Bronze Partnership Package',
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

interface SponsorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SponsorshipModal({ isOpen, onClose }: SponsorshipModalProps) {
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

      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Versenden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 max-h-[90vh] max-w-3xl overflow-y-auto"
          >
            <Card className="rounded-xl shadow-2xl">
              {/* Header */}
              <CardHeader className="relative pb-4 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-4 top-4"
                >
                  <X className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">Sponsoring Pakete</CardTitle>
                <CardDescription>
                  Wähle dein Sponsoring-Paket und kontaktiere uns für weitere Details
                </CardDescription>
              </CardHeader>

              {/* Content */}
              <CardContent className="pt-6">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Danke für deine Anfrage!</h3>
                    <p className="text-muted-foreground">
                      Wir werden dich bald kontaktieren, um die Details zu besprechen.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {/* Packages Grid */}
                    <div>
                      <h3 className="font-semibold mb-4 text-sm">Verfügbare Pakete</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {sponsorPackages.map((pkg) => (
                          <motion.div
                            key={pkg.name}
                            className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                            style={{
                              borderColor:
                                formData.interestedIn === pkg.name.toLowerCase()
                                  ? pkg.color
                                  : '#e5e7eb',
                              backgroundColor:
                                formData.interestedIn === pkg.name.toLowerCase()
                                  ? `${pkg.color}15`
                                  : 'transparent',
                            }}
                            onClick={() => handleSelectChange(pkg.name.toLowerCase())}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div
                              className="font-bold text-sm mb-2"
                              style={{
                                color: formData.interestedIn === pkg.name.toLowerCase() ? pkg.color : '#666',
                              }}
                            >
                              {pkg.name}
                            </div>
                            <ul className="text-xs space-y-1">
                              {pkg.benefits.slice(0, 2).map((benefit) => (
                                <li key={benefit} className="flex items-start gap-1">
                                  <span className="text-[10px]">✓</span>
                                  <span className="line-clamp-1">{benefit}</span>
                                </li>
                              ))}
                              {pkg.benefits.length > 2 && (
                                <li className="text-[10px] text-muted-foreground italic">
                                  +{pkg.benefits.length - 2} weitere Benefits
                                </li>
                              )}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm">
                            Firmenname *
                          </Label>
                          <Input
                            id="companyName"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            required
                            placeholder="Dein Unternehmen"
                            size="sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-sm">
                            Kontaktperson *
                          </Label>
                          <Input
                            id="contactName"
                            name="contactName"
                            value={formData.contactName}
                            onChange={handleChange}
                            required
                            placeholder="Dein Name"
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">
                            E-Mail *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="deine@email.ch"
                            size="sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Telefon
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+41 XX XXX XX XX"
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">
                          Nachricht
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Weitere Informationen..."
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading || !formData.interestedIn}
                        className="w-full bg-[#530A5D] hover:bg-[#530A5D]/90 text-white h-10"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Anfrage senden'
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
