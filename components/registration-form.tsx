"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft, Check, Loader2, Home, Lock } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { getCategoryPresentationByLanguage, type CategoryRecord } from "@/lib/category-config"

interface DisplayCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
  textColor: string
  icon: React.ComponentType<{ className?: string }>
  partnerName: string
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * 48, opacity: 0 })
}

export function RegistrationForm() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [categories, setCategories] = useState<DisplayCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState("")
  const { signup, verify2FA } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
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
      studyRequired: "Studiengang erforderlich, wenn Hochschule/Schule angegeben ist",
      semesterRequired: "Semester erforderlich, wenn Hochschule/Schule angegeben ist",
      categoryRequired: "Bitte wähle eine Kategorie",
      signupFailed: "Registrierung fehlgeschlagen",
      twoFaSent: "2FA Code wurde an deine E-Mail gesendet",
      enter2faCode: "Bitte geben Sie den 2FA Code ein",
      verifyFailed: "2FA Verifizierung fehlgeschlagen",
      registrationSuccess: "Registrierung erfolgreich! Bestätigungsemail versendet.",
      verifyError: "Fehler bei der Verifizierung",
      successTitle: "Registrierung erfolgreich!",
      successText: "Bestätigungsemail wurde versendet. Du wirst zum Dashboard weitergeleitet...",
      step1Title: "Wähle deine Kategorie",
      step1Desc: "In welchem Bereich möchtest du antreten?",
      step2Title: "Persönliche Informationen",
      step3Title: "Zugangsdaten",
      step4Title: "Zusätzliche Informationen",
      firstName: "Vorname *",
      lastName: "Nachname *",
      email: "E-Mail *",
      password: "Passwort *",
      confirmPassword: "Passwort bestätigen *",
      university: "Universität / Schule (optional)",
      studyProgram: "Studiengang",
      semester: "Semester",
      allergies: "Allergien (optional)",
      intolerances: "Unverträglichkeiten (optional)",
      newsletterOptIn: "Ich möchte Hackathon-Updates und Neuigkeiten per E-Mail erhalten",
      partner: "Partner",
      home: "Startseite",
      back: "Zurück",
      hasAccount: "Du hast schon ein Konto?",
      loginHere: "Hier anmelden",
      next: "Weiter",
      register: "Registrieren",
      auth2fa: "2-FAKTOR AUTH",
      codeSentTo: "Code wurde an",
      codeSentSuffix: "gesendet",
      verificationCode: "Verifizierungscode",
      codeHint: "6 Zeichen aus deiner E-Mail",
      verify: "Verifizieren",
      schoolPlaceholder: "z.B. HSLU, ETH Zürich, etc.",
      studyPlaceholder: "z.B. Informatik, Wirtschaft, etc.",
      emailExists: "Ein Konto mit dieser E-Mail-Adresse existiert bereits",
      emailExistsHint: "Melden Sie sich an oder verwenden Sie eine andere E-Mail",
      stepLabels: ["Kategorie", "Persönlich", "Zugangsdaten", "Weiteres"]
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
      studyRequired: "Study program is required if university/school is provided",
      semesterRequired: "Semester is required if university/school is provided",
      categoryRequired: "Please choose a category",
      signupFailed: "Registration failed",
      twoFaSent: "2FA code was sent to your email",
      enter2faCode: "Please enter the 2FA code",
      verifyFailed: "2FA verification failed",
      registrationSuccess: "Registration successful. Confirmation email sent.",
      verifyError: "Verification failed",
      successTitle: "Registration successful!",
      successText: "Confirmation email sent. Redirecting to dashboard...",
      step1Title: "Choose your category",
      step1Desc: "Which track would you like to compete in?",
      step2Title: "Personal Information",
      step3Title: "Account Details",
      step4Title: "Additional Information",
      firstName: "First name *",
      lastName: "Last name *",
      email: "Email *",
      password: "Password *",
      confirmPassword: "Confirm password *",
      university: "University / School (optional)",
      studyProgram: "Study program",
      semester: "Semester",
      allergies: "Allergies (optional)",
      intolerances: "Intolerances (optional)",
      newsletterOptIn: "I want to receive hackathon updates and news by email",
      partner: "Partner",
      home: "Home",
      back: "Back",
      hasAccount: "Already have an account?",
      loginHere: "Login here",
      next: "Next",
      register: "Register",
      auth2fa: "2-FACTOR AUTH",
      codeSentTo: "Code was sent to",
      codeSentSuffix: "",
      verificationCode: "Verification code",
      codeHint: "6 characters from your email",
      verify: "Verify",
      schoolPlaceholder: "e.g. HSLU, ETH Zurich, etc.",
      studyPlaceholder: "e.g. Computer Science, Business, etc.",
      emailExists: "An account with this email address already exists",
      emailExistsHint: "Sign in or use a different email",
      stepLabels: ["Category", "Personal", "Credentials", "More Info"]
    }
  }[language]

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    studyProgram: "",
    semester: "",
    allergies: "",
    intolerances: "",
    categoryId: "",
    newsletter: true
  })

  useEffect(() => {
    fetchCategories()
  }, [language])

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (!categoryParam || categories.length === 0) return
    const cat = categories.find((c) => c.id === categoryParam || c.slug === categoryParam)
    if (cat) {
      setFormData((prev) => ({ ...prev, categoryId: cat.id }))
    }
  }, [categories, searchParams])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        const raw: CategoryRecord[] = data.data.categories
        setCategories(
          raw.map((cat) => {
            const p = getCategoryPresentationByLanguage(cat, language)
            return {
              id: cat.id || p.slug,
              name: p.title,
              slug: p.slug,
              description: p.description,
              color: p.color,
              textColor: p.textColor,
              icon: p.icon,
              partnerName: p.partnerName
            }
          })
        )
      }
    } catch {
      toast.error(t.categoriesLoadError)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = () => {
    if (step === 1) {
      if (!formData.categoryId) {
        toast.error(t.categoryRequired)
        return false
      }
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) {
        toast.error(t.firstNameLastNameRequired)
        return false
      }
    }
    if (step === 3) {
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
    if (step === 4) {
      const hasUniversity = formData.university.trim().length > 0
      if (hasUniversity && !formData.studyProgram.trim()) {
        toast.error(t.studyRequired)
        return false
      }
      if (hasUniversity && !formData.semester.trim()) {
        toast.error(t.semesterRequired)
        return false
      }
    }
    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setDirection(1)
    setStep((s) => Math.min(4, s + 1))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setEmailError("")
    try {
      await signup(formData.email, formData.password, formData.firstName, formData.lastName)
      setShow2FA(true)
      toast.success(t.twoFaSent)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.signupFailed
      if (
        message.toLowerCase().includes("email") ||
        message.toLowerCase().includes("already exists") ||
        message.toLowerCase().includes("unique")
      ) {
        setEmailError(message)
        setDirection(-1)
        setStep(3)
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!code2FA.trim()) throw new Error(t.enter2faCode)
      await verify2FA(formData.email, code2FA.toUpperCase())
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
      toast.error(err instanceof Error ? err.message : t.signupFailed)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">{t.successTitle}</h2>
        <p className="text-muted-foreground">{t.successText}</p>
      </motion.div>
    )
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
      {!show2FA ? (
        <>
          {/* Step indicator */}
          <div className="space-y-3">
            <div className="flex items-center">
              {t.stepLabels.map((label, i) => {
                const s = i + 1
                const isDone = step > s
                const isActive = step === s
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          isDone
                            ? "bg-[#530A5D] text-white"
                            : isActive
                              ? "border-2 border-[#530A5D] bg-[#530A5D]/5 text-[#530A5D]"
                              : "border-muted bg-background text-muted-foreground border-2"
                        }`}>
                        {isDone ? <Check className="h-3.5 w-3.5" /> : s}
                      </div>
                      <span
                        className={`hidden text-[10px] font-medium sm:block ${
                          isActive ? "text-[#530A5D]" : isDone ? "text-[#530A5D]/70" : "text-muted-foreground"
                        }`}>
                        {label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className={`mb-4 h-px flex-1 transition-all duration-300 sm:mb-6 ${
                          step > s ? "bg-[#530A5D]" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Category */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t.step1Title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{t.step1Desc}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.map((cat) => {
                    const isSelected = formData.categoryId === cat.id
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleInputChange("categoryId", cat.id)}
                        className={`relative overflow-hidden rounded-xl p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#530A5D] focus-visible:ring-offset-2 ${
                          isSelected
                            ? "scale-[1.02] shadow-lg"
                            : "opacity-90 hover:opacity-100 hover:shadow-md"
                        }`}
                        style={{ backgroundColor: cat.color, color: cat.textColor }}>
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 85% 15%, currentColor 1px, transparent 1px)",
                            backgroundSize: "18px 18px"
                          }}
                        />
                        <div className="relative z-10 space-y-3">
                          <Icon className="h-8 w-8 opacity-90" />
                          <div>
                            <p className="text-base leading-tight font-bold">{cat.name}</p>
                            <p className="mt-1 text-xs leading-snug opacity-75">{cat.description}</p>
                          </div>
                          <p className="text-[11px] opacity-60">
                            {t.partner}: {cat.partnerName}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 z-10 rounded-full bg-white/25 p-1 backdrop-blur-sm">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {isSelected && (
                          <div
                            className="absolute inset-0 rounded-xl ring-[3px] ring-white/60"
                            style={{
                              boxShadow: `0 0 0 3px ${cat.textColor === "#FFFFFF" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.25)"}`
                            }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5">
                {selectedCategory && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: selectedCategory.color + "22",
                      borderLeft: `3px solid ${selectedCategory.color}`
                    }}>
                    <span style={{ color: selectedCategory.color }}>
                      <selectedCategory.icon className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="text-sm font-semibold" style={{ color: selectedCategory.color }}>
                      {selectedCategory.name}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t.step2Title}</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      {t.firstName}
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      {t.lastName}
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      className="h-11"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Credentials */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5">
                {selectedCategory && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: selectedCategory.color + "22",
                      borderLeft: `3px solid ${selectedCategory.color}`
                    }}>
                    <span style={{ color: selectedCategory.color }}>
                      <selectedCategory.icon className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="text-sm font-semibold" style={{ color: selectedCategory.color }}>
                      {selectedCategory.name}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t.step3Title}</h2>
                </div>
                {emailError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">{t.emailExists}</p>
                      <p className="mt-0.5 text-xs text-red-700">{t.emailExistsHint}</p>
                    </div>
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t.email}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange("email", e.target.value)
                        setEmailError("")
                      }}
                      placeholder={language === "de" ? "deine@email.ch" : "your@email.com"}
                      className={`h-11 ${emailError ? "border-red-300 focus-visible:ring-red-200" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t.password}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="••••••••••••"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      {t.confirmPassword}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="••••••••••••"
                      className="h-11"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Additional Info */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5">
                {selectedCategory && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: selectedCategory.color + "22",
                      borderLeft: `3px solid ${selectedCategory.color}`
                    }}>
                    <span style={{ color: selectedCategory.color }}>
                      <selectedCategory.icon className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="text-sm font-semibold" style={{ color: selectedCategory.color }}>
                      {selectedCategory.name}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t.step4Title}</h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="university" className="text-sm font-medium">
                      {t.university}
                    </Label>
                    <Input
                      id="university"
                      value={formData.university}
                      onChange={(e) => handleInputChange("university", e.target.value)}
                      placeholder={t.schoolPlaceholder}
                      className="h-11"
                    />
                  </div>

                  {formData.university.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="studyProgram" className="text-sm font-medium">
                          {t.studyProgram} *
                        </Label>
                        <Input
                          id="studyProgram"
                          value={formData.studyProgram}
                          onChange={(e) => handleInputChange("studyProgram", e.target.value)}
                          placeholder={t.studyPlaceholder}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester" className="text-sm font-medium">
                          {t.semester} *
                        </Label>
                        <Input
                          id="semester"
                          type="number"
                          value={formData.semester}
                          onChange={(e) => handleInputChange("semester", e.target.value)}
                          placeholder={language === "de" ? "z.B. 3" : "e.g. 3"}
                          min="1"
                          className="h-11"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="allergies" className="text-sm font-medium">
                      {t.allergies}
                    </Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleInputChange("allergies", e.target.value)}
                      placeholder={
                        language === "de" ? "z.B. Erdnüsse, Meeresfrüchte..." : "e.g. peanuts, shellfish..."
                      }
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intolerances" className="text-sm font-medium">
                      {t.intolerances}
                    </Label>
                    <Textarea
                      id="intolerances"
                      value={formData.intolerances}
                      onChange={(e) => handleInputChange("intolerances", e.target.value)}
                      placeholder={language === "de" ? "z.B. Laktose, Gluten..." : "e.g. lactose, gluten..."}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="bg-muted/40 flex items-start gap-3 rounded-xl border p-4">
                    <Checkbox
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) => handleInputChange("newsletter", checked === true)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="newsletter" className="cursor-pointer text-sm leading-snug font-normal">
                      {t.newsletterOptIn}
                    </Label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 border-t pt-6">
            {step === 1 ? (
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="mr-2 h-4 w-4" />
                  {t.home}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={goBack} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Button>
            )}

            <p className="text-muted-foreground hidden text-sm sm:block">
              {t.hasAccount}{" "}
              <Link href="/auth/login" className="font-semibold text-[#530A5D] hover:underline">
                {t.loginHere}
              </Link>
            </p>

            {step < 4 ? (
              <Button onClick={goNext} disabled={loading} className="bg-[#530A5D] hover:bg-[#530A5D]/90">
                {t.next}
                <ArrowRight className="ml-2 h-4 w-4" />
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

          <p className="text-muted-foreground text-center text-sm sm:hidden">
            {t.hasAccount}{" "}
            <Link href="/auth/login" className="font-semibold text-[#530A5D] hover:underline">
              {t.loginHere}
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="py-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[#530A5D]/10 p-4">
                <Lock className="h-8 w-8 text-[#530A5D]" />
              </div>
            </div>
            <h1 className="text-foreground font-display mb-2 text-2xl font-bold">{t.auth2fa}</h1>
            <p className="text-muted-foreground text-sm">
              {language === "de" ? (
                <>
                  {t.codeSentTo} <strong>{formData.email}</strong> {t.codeSentSuffix}
                </>
              ) : (
                <>
                  <strong>{formData.email}</strong> received the code
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                {t.verificationCode}
              </Label>
              <Input
                id="code"
                type="text"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.toUpperCase())}
                placeholder="AB12CD"
                maxLength={6}
                required
                className="bg-background h-14 text-center font-mono text-2xl tracking-[0.5em]"
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
