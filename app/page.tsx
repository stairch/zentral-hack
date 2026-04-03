import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Categories } from "@/components/categories"
import { Schedule } from "@/components/schedule"
import { Partners } from "@/components/partners"
import { FAQ } from "@/components/faq"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative">
      <Navigation />
      <Hero />
      <About />
      <Categories />
      <Schedule />
      <Partners />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
