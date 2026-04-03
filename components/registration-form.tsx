"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2,
  Sparkles,
  Bot,
  GraduationCap,
  MapPin
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  bot: <Bot className="w-6 h-6" />,
  "graduation-cap": <GraduationCap className="w-6 h-6" />,
  "map-pin": <MapPin className="w-6 h-6" />,
}

export function RegistrationForm() {
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    categoryId: "",
    university: "",
    studyProgram: "",
    semester: "",
    linkedinUrl: "",
    dietaryRestrictions: "",
    allergies: "",
    foodIntolerances: "",
    wantsEmails: true,
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name")
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [supabase])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
            `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      })

      if (authError) throw authError

      // Create registration record (using service role in API route for RLS bypass)
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user?.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.password.length >= 6
      case 2:
        return formData.categoryId
      case 3:
        return true // Optional fields
      case 4:
        return true
      default:
        return false
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-[#E6FF17] rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-10 h-10 text-[#530A5D]" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground mb-4">Anmeldung erfolgreich!</h3>
        <p className="text-muted-foreground">
          Bitte überprüfe deine E-Mails und bestätige deine Anmeldung.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <motion.div
            key={s}
            className={`h-2 rounded-full ${
              s <= step ? "bg-[#E6FF17]" : "bg-muted"
            }`}
            initial={{ width: 40 }}
            animate={{ width: s === step ? 60 : 40 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Persönliche Daten</h3>
              <p className="text-muted-foreground">Erzähl uns ein bisschen über dich</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Max"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Mustermann"
                  className="bg-background"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="max@beispiel.ch"
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Passwort * (min. 6 Zeichen)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Wähle deine Kategorie</h3>
              <p className="text-muted-foreground">In welcher Challenge möchtest du teilnehmen?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() => handleInputChange("categoryId", category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    formData.categoryId === category.id
                      ? "border-[#E6FF17] bg-[#E6FF17]/10"
                      : "border-border hover:border-[#D5C2F7]"
                  }`}
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: category.color + "20", color: category.color }}
                  >
                    {iconMap[category.icon]}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{category.name}</h4>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Education Info */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Studium & Profil</h3>
              <p className="text-muted-foreground">Optional: Falls du studierst</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="university">Hochschule / Universität</Label>
              <Input
                id="university"
                value={formData.university}
                onChange={(e) => handleInputChange("university", e.target.value)}
                placeholder="z.B. HSLU, ETH, Uni Luzern"
                className="bg-background"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studyProgram">Studiengang</Label>
                <Input
                  id="studyProgram"
                  value={formData.studyProgram}
                  onChange={(e) => handleInputChange("studyProgram", e.target.value)}
                  placeholder="z.B. Informatik"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => handleInputChange("semester", value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        {sem}. Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profil</Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="bg-background"
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Diet & Preferences */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Verpflegung & Präferenzen</h3>
              <p className="text-muted-foreground">Damit wir für dein Wohl sorgen können</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dietaryRestrictions">Ernährungsweise</Label>
              <Select
                value={formData.dietaryRestrictions}
                onValueChange={(value) => handleInputChange("dietaryRestrictions", value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Einschränkungen</SelectItem>
                  <SelectItem value="vegetarian">Vegetarisch</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Koscher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergien</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange("allergies", e.target.value)}
                placeholder="z.B. Nussallergie, Glutenunverträglichkeit..."
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="foodIntolerances">Unverträglichkeiten</Label>
              <Textarea
                id="foodIntolerances"
                value={formData.foodIntolerances}
                onChange={(e) => handleInputChange("foodIntolerances", e.target.value)}
                placeholder="z.B. Laktoseintoleranz..."
                className="bg-background"
              />
            </div>
            
            <div className="flex items-center space-x-3 pt-4">
              <Checkbox
                id="wantsEmails"
                checked={formData.wantsEmails}
                onCheckedChange={(checked) => handleInputChange("wantsEmails", checked as boolean)}
              />
              <Label htmlFor="wantsEmails" className="text-sm text-muted-foreground cursor-pointer">
                Ich möchte Updates und Neuigkeiten zum Hackathon per E-Mail erhalten
              </Label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-500 text-sm text-center mt-4"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        
        {step < 4 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid()}
            className="gap-2 bg-[#530A5D] hover:bg-[#530A5D]/90 text-white"
          >
            Weiter
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="gap-2 bg-[#E6FF17] hover:bg-[#E6FF17]/90 text-[#530A5D] font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                Anmelden
                <Check className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
