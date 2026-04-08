"use client"

import { FormEvent, useMemo, useState } from "react"

type Language = "de" | "en"

const copy = {
  de: {
    title: "Weekly Updates abmelden",
    helper: "Gib die E-Mail-Adresse ein, mit der du Weekly Updates erhalten hast.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "name@beispiel.ch",
    invalidEmail: "Bitte gib eine gueltige E-Mail-Adresse ein.",
    submit: "Von Weekly Updates abmelden",
    submitting: "Wird abgemeldet...",
    success: "Danke! Du wurdest von Weekly Updates abgemeldet. Andere E-Mail-Kategorien bleiben aktiv.",
    languageLabel: "Sprache"
  },
  en: {
    title: "Unsubscribe from Weekly Updates",
    helper: "Enter the email address that receives Weekly Updates.",
    emailLabel: "Email address",
    emailPlaceholder: "name@example.com",
    invalidEmail: "Please enter a valid email address.",
    submit: "Unsubscribe from Weekly Updates",
    submitting: "Unsubscribing...",
    success: "Done! You have been unsubscribed from Weekly Updates. Other email categories remain active.",
    languageLabel: "Language"
  }
} as const

export default function NewsletterUnsubscribePage() {
  const [language, setLanguage] = useState<Language>("de")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const text = copy[language]

  const isValidEmail = useMemo(() => {
    return /^\S+@\S+\.\S+$/.test(email.trim())
  }, [email])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isValidEmail) {
      setError(text.invalidEmail)
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          category: "weekly_updates"
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Abmeldung fehlgeschlagen")
      }

      setSubmitted(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Abmeldung fehlgeschlagen")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f1f8] px-4 py-10">
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-[#ece7f5] bg-white shadow-sm">
        <div className="bg-[#530A5D] px-6 py-5 text-white">
          <p
            className="text-xl font-extrabold tracking-[0.08em]"
            style={{ fontFamily: "var(--font-display)" }}>
            ZENTRAL <span className="text-[#E6FF17]">HACK</span>
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-2xl font-bold text-[#530A5D]" style={{ fontFamily: "var(--font-display)" }}>
              {text.title}
            </h1>
            <div className="w-40">
              <label htmlFor="language" className="text-muted-foreground mb-1 block text-xs font-medium">
                {text.languageLabel}
              </label>
              <select
                id="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                className="border-input bg-background h-9 w-full cursor-pointer rounded-md border px-2 text-sm">
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {submitted ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {text.success}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">{text.helper}</p>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <label htmlFor="unsubscribe-email" className="text-foreground block text-sm font-medium">
                  {text.emailLabel}
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={text.emailPlaceholder}
                  className="border-input focus:border-ring focus-visible:ring-ring/40 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#530A5D] px-5 text-sm font-semibold text-white transition hover:bg-[#43084b] disabled:cursor-not-allowed disabled:opacity-70">
                  {submitting ? text.submitting : text.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
