'use client';

import { FormEvent, useMemo, useState } from 'react';

export default function NewsletterUnsubscribePage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = useMemo(() => {
    return /^\S+@\S+\.\S+$/.test(email.trim());
  }, [email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail) {
      setError('Bitte gib eine gueltige E-Mail-Adresse ein.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          category: 'weekly_updates',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Abmeldung fehlgeschlagen');
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Abmeldung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f1f8] px-4 py-10">
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-[#ece7f5] bg-white shadow-sm">
        <div className="bg-[#530A5D] px-6 py-5 text-white">
          <p className="text-xl font-extrabold tracking-[0.08em]" style={{ fontFamily: 'var(--font-display)' }}>
            ZENTRAL <span className="text-[#E6FF17]">HACK</span>
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <h1 className="text-2xl font-bold text-[#530A5D]" style={{ fontFamily: 'var(--font-display)' }}>
            Weekly Updates abmelden
          </h1>

          {submitted ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Danke! Du wurdest von Weekly Updates abgemeldet. Andere E-Mail-Kategorien bleiben aktiv.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Gib die E-Mail-Adresse ein, mit der du Weekly Updates erhalten hast.
              </p>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <label htmlFor="unsubscribe-email" className="block text-sm font-medium text-foreground">
                  E-Mail-Adresse
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@beispiel.ch"
                  className="h-11 w-full rounded-md border border-input px-3 text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#530A5D] px-5 text-sm font-semibold text-white transition hover:bg-[#43084b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Wird abgemeldet...' : 'Von Weekly Updates abmelden'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
