"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft, Check, Loader2, Home, Lock } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export function RegistrationForm() {
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signup, verify2FA } = useAuth()
  const router = useRouter()
  const [show2FA, setShow2FA] = useState(false)
  const [code2FA, setCode2FA] = useState("")
  const { language } = useLanguage()

  const t = {
    de: {
      categoriesLoadError: "Kategorien konnten nicht geladen werden",
      firstNameLastNameRequired: "Vorname und Nachname erforderlich",
      emailRequired: "Email erforderlich",
      passwordRequired: "Passwort erforderlich",
      passwordsNoMatch: "Passwörter stimmen nicht überein",
      passwordMin: "Passwort muss mindestens 12 Zeichen lang sein",
      passwordUpper: "Passwort muss mindestens einen Großbuchstaben enthalten",
      passwordNumber: "Passwort muss mindestens eine Zahl enthalten",
      passwordSpecial: "Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)",
      universityRequired: "Universität erforderlich",
      studyRequired: "Studiengang erforderlich",
      semesterRequired: "Semester erforderlich",
      categoryRequired: "Kategorie erforderlich",
      signupFailed: "Registrierung fehlgeschlagen",
      twoFaSent: "2FA Code wurde an deine E-Mail gesendet",
      enter2faCode: "Bitte geben Sie den 2FA Code ein",
      verifyFailed: "2FA Verifizierung fehlgeschlagen",
      registrationSuccess: "Registrierung erfolgreich! Bestätigungsemail versendet.",
      verifyError: "Fehler bei der Verifizierung",
      successTitle: "Registrierung erfolgreich!",
      successText: "Bestätigungsemail wurde versendet. Du wirst zum Dashboard weitergeleitet...",
      personalInfo: "Persönliche Informationen",
      firstName: "Vorname *",
      lastName: "Nachname *",
      credentials: "Anmeldedaten",
      email: "E-Mail *",
      password: "Passwort *",
      confirmPassword: "Passwort bestätigen *",
      uniInfo: "Universitäts-Informationen",
      university: "Universität/Schule *",
      studyProgram: "Studiengang *",
      semester: "Semester *",
      allergies: "Allergien (optional)",
      intolerances: "Unverträglichkeiten (optional)",
      categorySettings: "Kategorie & Einstellungen",
      chooseCategory: "Wähle eine Kategorie *",
      categoryPlaceholder: "Kategorie wählen...",
      newsletterOptIn: "Ich möchte Hackathon-Updates und Kategorie-News per E-Mail erhalten",
      home: "Startseite",
      back: "Zurück",
      hasAccount: "Du hast schon ein Konto?",
      loginHere: "Hier anmelden",
      next: "Weiter",
      register: "Registrieren",
      auth2fa: "2-FAKTOR AUTH",
      codeSentTo: "Code wurde an",
      verificationCode: "Verifizierungscode",
      codeHint: "6 Zeichen aus E-Mail",
      verify: "Verifizieren",
      codeSentSuffix: "gesendet",
      schoolPlaceholder: "z.B. HSLU, ETH Zürich, etc.",
      studyPlaceholder: "z.B. Informatik, Wirtschaft, etc."
    },
    en: {
      categoriesLoadError: "Could not load categories",
      firstNameLastNameRequired: "First name and last name are required",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      passwordsNoMatch: "Passwords do not match",
      passwordMin: "Password must be at least 12 characters",
      passwordUpper: "Password must include at least one uppercase letter",
      passwordNumber: "Password must include at least one number",
      passwordSpecial: "Password must include at least one special character (!@#$%^&*...)",
      universityRequired: "University is required",
      studyRequired: "Study program is required",
      semesterRequired: "Semester is required",
      categoryRequired: "Category is required",
      signupFailed: "Registration failed",
      twoFaSent: "2FA code was sent to your email",
      enter2faCode: "Please enter the 2FA code",
      verifyFailed: "2FA verification failed",
      registrationSuccess: "Registration successful. Confirmation email sent.",
      verifyError: "Verification failed",
      successTitle: "Registration successful!",
      successText: "Confirmation email sent. Redirecting to dashboard...",
      personalInfo: "Personal Information",
      firstName: "First name *",
      lastName: "Last name *",
      credentials: "Account Details",
      email: "Email *",
      password: "Password *",
      confirmPassword: "Confirm password *",
      uniInfo: "University Information",
      university: "University/School *",
      studyProgram: "Study program *",
      semester: "Semester *",
      allergies: "Allergies (optional)",
      intolerances: "Intolerances (optional)",
      categorySettings: "Category & Preferences",
      chooseCategory: "Choose a category *",
      categoryPlaceholder: "Select category...",
      newsletterOptIn: "I want to receive hackathon updates and category news by email",
      home: "Home",
      back: "Back",
      hasAccount: "Already have an account?",
      loginHere: "Login here",
      next: "Next",
      register: "Register",
      auth2fa: "2-FACTOR AUTH",
      codeSentTo: "Code was sent to",
      verificationCode: "Verification code",
      codeHint: "6 characters from email",
      verify: "Verify",
      codeSentSuffix: "received the code",
      schoolPlaceholder: "e.g. HSLU, ETH Zurich, etc.",
      studyPlaceholder: "e.g. Computer Science, Business, etc."
    }
  }[language]

  const [formData, setFormData] = useState({
    // Persönliche Infos
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Universitäts-Infos
    university: "",
    studyProgram: "",
    semester: "",

    // Gesundheit
    allergies: "",
    intolerances: "",

    // Kategorie
    categoryId: "",
    newsletter: true
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast.error(t.categoriesLoadError)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        toast.error(t.firstNameLastNameRequired)
        return false
      }
    }
    if (step === 2) {
      if (!formData.email) {
        toast.error(t.emailRequired)
        return false
      }
      if (!formData.password || !formData.confirmPassword) {
        toast.error(t.passwordRequired)
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error(t.passwordsNoMatch)
        return false
      }
      if (formData.password.length < 12) {
        toast.error(t.passwordMin)
        return false
      }
      if (!/[A-Z]/.test(formData.password)) {
        toast.error(t.passwordUpper)
        return false
      }
      if (!/[0-9]/.test(formData.password)) {
        toast.error(t.passwordNumber)
        return false
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        toast.error(t.passwordSpecial)
        return false
      }
    }
    if (step === 3) {
      if (!formData.university) {
        toast.error(t.universityRequired)
        return false
      }
      if (!formData.studyProgram) {
        toast.error(t.studyRequired)
        return false
      }
      if (!formData.semester) {
        toast.error(t.semesterRequired)
        return false
      }
    }
    if (step === 4) {
      if (!formData.categoryId) {
        toast.error(t.categoryRequired)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setLoading(true)

    try {
      // Try to sign up first
      await signup(formData.email, formData.password, formData.firstName, formData.lastName)

      // Verification is required for all users
      setShow2FA(true)
      toast.success(t.twoFaSent)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.signupFailed
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!code2FA.trim()) {
        throw new Error(t.enter2faCode)
      }

      await verify2FA(formData.email, code2FA.toUpperCase())

      // Complete registration with category and details
      const registerRes = await fetch("/api/hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
          subscribeNewsletter: formData.newsletter
        })
      })

      if (!registerRes.ok) {
        const errorData = await registerRes.json().catch(() => null)
        throw new Error(errorData?.error || t.signupFailed)
      }

      setSuccess(true)
      toast.success(t.registrationSuccess)
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : t.signupFailed
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">{t.successTitle}</h2>
        <p className="text-muted-foreground">{t.successText}</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl space-y-6">
      {!show2FA ? (
        <>
          {/* Progress */}
          <div className="mb-8 flex justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`mx-1 h-2 flex-1 rounded-full ${s <= step ? "bg-[#530A5D]" : "bg-muted"}`}
              />
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
                className="space-y-4">
                <h2 className="text-2xl font-bold">{t.personalInfo}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t.firstName}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t.lastName}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
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
                className="space-y-4">
                <h2 className="text-2xl font-bold">{t.credentials}</h2>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={language === "de" ? "deine@email.ch" : "your@email.com"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
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
                className="space-y-4">
                <h2 className="text-2xl font-bold">{t.uniInfo}</h2>

                <div className="space-y-2">
                  <Label htmlFor="university">{t.university}</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => handleInputChange("university", e.target.value)}
                    placeholder={t.schoolPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyProgram">{t.studyProgram}</Label>
                  <Input
                    id="studyProgram"
                    value={formData.studyProgram}
                    onChange={(e) => handleInputChange("studyProgram", e.target.value)}
                    placeholder={t.studyPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">{t.semester}</Label>
                  <Input
                    id="semester"
                    type="number"
                    value={formData.semester}
                    onChange={(e) => handleInputChange("semester", e.target.value)}
                    placeholder="z.B. 3"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">{t.allergies}</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    placeholder="z.B. Erdnussallergie, Shellfish..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intolerances">{t.intolerances}</Label>
                  <Textarea
                    id="intolerances"
                    value={formData.intolerances}
                    onChange={(e) => handleInputChange("intolerances", e.target.value)}
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
                className="space-y-4">
                <h2 className="text-2xl font-bold">{t.categorySettings}</h2>

                <div className="space-y-2">
                  <Label htmlFor="category">{t.chooseCategory}</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleInputChange("categoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.categoryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div>
                            <div className="font-semibold">{cat.name}</div>
                            <div className="text-muted-foreground text-xs">{cat.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted mt-4 flex items-center space-x-2 rounded p-3">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => handleInputChange("newsletter", checked === true)}
                  />
                  <Label htmlFor="newsletter" className="cursor-pointer font-normal">
                    {t.newsletterOptIn}
                  </Label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons & Links */}
          <div className="mt-8 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {step === 1 ? (
                <Link href="/">
                  <Button variant="outline">
                    <Home className="mr-2 h-4 w-4" />
                    {t.home}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1 || loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <p className="text-muted-foreground text-sm">
                {t.hasAccount}{" "}
                <Link href="/auth/login" className="text-violet font-semibold hover:underline">
                  {t.loginHere}
                </Link>
              </p>
            </div>

            {step < 4 ? (
              <Button
                onClick={() => validateStep() && setStep(step + 1)}
                disabled={loading}
                className="bg-[#530A5D] hover:bg-[#530A5D]/90">
                {t.next} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#530A5D] hover:bg-[#530A5D]/90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.register}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[#530A5D]/10 p-4">
                <Lock className="h-8 w-8 text-[#530A5D]" />
              </div>
            </div>
            <h1
              className="text-foreground mb-2 text-2xl font-bold"
              style={{ fontFamily: "var(--font-display)" }}>
              {t.auth2fa}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === "de" ? (
                <>
                  {t.codeSentTo} <strong>{formData.email}</strong> {t.codeSentSuffix}
                </>
              ) : (
                <>
                  <strong>{formData.email}</strong> {t.codeSentSuffix}
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">{t.verificationCode}</Label>
              <Input
                id="code"
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.toUpperCase())}
                placeholder="z.B. AB12CD"
                maxLength={6}
                required
                className="bg-background text-center font-mono text-xl"
                autoFocus
              />
              <p className="text-muted-foreground text-center text-xs">{t.codeHint}</p>
            </div>

            <Button
              type="submit"
              disabled={loading || code2FA.length !== 6}
              className="h-12 w-full bg-[#530A5D] text-white hover:bg-[#530A5D]/90">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Lock className="mr-2 h-5 w-5" />
                  {t.verify}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShow2FA(false)
                setCode2FA("")
              }}
              className="w-full">
              {t.back}
            </Button>
          </form>
        </>
      )}
    </motion.div>
  )
}
