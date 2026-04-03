'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Check, Loader2, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    // Persönliche Infos
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Universitäts-Infos
    university: '',
    studyProgram: '',
    semester: '',
    
    // Gesundheit
    allergies: '',
    intolerances: '',
    
    // Kategorie
    categoryId: '',
    newsletter: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Kategorien konnten nicht geladen werden');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        toast.error('Vorname und Nachname erforderlich');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.email) {
        toast.error('Email erforderlich');
        return false;
      }
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Passwort erforderlich');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwörter stimmen nicht überein');
        return false;
      }
      if (formData.password.length < 12) {
        toast.error('Passwort muss mindestens 12 Zeichen lang sein');
        return false;
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error('Passwort muss mindestens einen Großbuchstaben enthalten');
        return false;
      }
      if (!/[0-9]/.test(formData.password)) {
        toast.error('Passwort muss mindestens eine Zahl enthalten');
        return false;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        toast.error('Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.university) {
        toast.error('Universität erforderlich');
        return false;
      }
      if (!formData.studyProgram) {
        toast.error('Studiengang erforderlich');
        return false;
      }
      if (!formData.semester) {
        toast.error('Semester erforderlich');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.categoryId) {
        toast.error('Kategorie erforderlich');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);

    try {
      // Signup User
      await signup(formData.email, formData.password, formData.firstName, formData.lastName);
      
      // Complete registration with all details and send email
      const registerRes = await fetch('/api/hackathon/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          university: formData.university,
          studyProgram: formData.studyProgram,
          semester: formData.semester,
          allergies: formData.allergies,
          dietaryRestrictions: formData.intolerances,
          categoryId: formData.categoryId,
          subscribeNewsletter: formData.newsletter,
        }),
      });

      if (!registerRes.ok) {
        throw new Error('Registrierung fehlgeschlagen');
      }

      setSuccess(true);
      toast.success('Registrierung erfolgreich! Bestätigungsemail versendet.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registrierung fehlgeschlagen';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Registrierung erfolgreich!</h2>
        <p className="text-muted-foreground">Bestätigungsemail wurde versendet. Du wirst zum Dashboard weitergeleitet...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl space-y-6"
    >
      {/* Progress */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded-full mx-1 ${s <= step ? 'bg-[#530A5D]' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Persönliche Infos */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">Persönliche Informationen</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Anmeldedaten */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">Anmeldedaten</h2>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="deine@email.ch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </motion.div>
        )}

        {/* Step 3: Universitäts-Infos */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">Universitäts-Informationen</h2>
            
            <div className="space-y-2">
              <Label htmlFor="university">Universität/Schule *</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
                placeholder="z.B. HSLU, ETH Zürich, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyProgram">Studiengang *</Label>
              <Input
                id="studyProgram"
                value={formData.studyProgram}
                onChange={(e) => handleInputChange('studyProgram', e.target.value)}
                placeholder="z.B. Informatik, Wirtschaft, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                type="number"
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', e.target.value)}
                placeholder="z.B. 3"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergien (optional)</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="z.B. Erdnussallergie, Shellfish..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intolerances">Unverträglichkeiten (optional)</Label>
              <Textarea
                id="intolerances"
                value={formData.intolerances}
                onChange={(e) => handleInputChange('intolerances', e.target.value)}
                placeholder="z.B. Laktose, Gluten..."
                rows={2}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Kategorie & Einstellungen */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">Kategorie & Einstellungen</h2>
            
            <div className="space-y-2">
              <Label htmlFor="category">Wähle eine Kategorie *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div>
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-4 p-3 bg-muted rounded">
              <Checkbox
                id="newsletter"
                checked={formData.newsletter}
                onCheckedChange={(checked) => handleInputChange('newsletter', checked === true)}
              />
              <Label htmlFor="newsletter" className="font-normal cursor-pointer">
                Ich möchte Hackathon-Updates und Kategorie-News per E-Mail erhalten
              </Label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons & Links */}
      <div className="flex gap-2 justify-between mt-8 items-center">
        <div className="flex gap-2">
          {step === 1 ? (
            <Link href="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Startseite
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <p className="text-sm text-muted-foreground">
            Du hast schon ein Konto?{' '}
            <Link href="/auth/login" className="text-violet hover:underline font-semibold">
              Hier anmelden
            </Link>
          </p>
        </div>

        {step < 4 ? (
          <Button onClick={() => validateStep() && setStep(step + 1)} disabled={loading} className="bg-[#530A5D] hover:bg-[#530A5D]/90">
            Weiter <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#530A5D] hover:bg-[#530A5D]/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrieren'}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
