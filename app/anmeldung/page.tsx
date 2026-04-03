import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { RegistrationForm } from "@/components/registration-form-new"

export const metadata = {
  title: "Anmeldung | Zentral Hack 2026",
  description: "Melde dich jetzt für den grössten Hackathon der Zentralschweiz an!",
}

export default function AnmeldungPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-32 pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              JETZT ANMELDEN
            </h1>
            <p className="text-lg text-muted-foreground">
              Sichere dir deinen Platz am Zentral Hack 2026
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <RegistrationForm />
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
