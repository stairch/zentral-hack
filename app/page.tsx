import { Suspense } from "react"
import { headers } from "next/headers"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Categories } from "@/components/categories"
import { Schedule } from "@/components/schedule"
import { Partners, CoOrganisers } from "@/components/partners"
import { FAQ } from "@/components/faq"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"
import { PostEventHero } from "@/components/post-event-hero"
import { LeaderboardSection } from "@/components/leaderboard-section"
import { EventGallerySection } from "@/components/event-gallery-section"
import { PostEventCTA } from "@/components/post-event-cta"
import { EVENT_PHASE_HEADER } from "@/lib/event-phase"
import { getEventPhaseConfig, getPostEventData } from "@/lib/event-phase-server"

export default async function Home() {
  // Same phase as Navigation and Footer, which read it from the layout
  if ((await headers()).get(EVENT_PHASE_HEADER) === "post") {
    const config = await getEventPhaseConfig()
    const data = await getPostEventData(config)

    return (
      <main className="relative">
        <Navigation />
        <PostEventHero hero={config.hero} stats={data.stats} />
        {config.leaderboard.enabled && (
          <LeaderboardSection content={config.leaderboard} categories={data.categories} />
        )}
        {config.gallery.enabled && <EventGallerySection content={config.gallery} photos={data.photos} />}
        <CoOrganisers />
        <Partners />
        <PostEventCTA content={config.cta} />
        <Footer />
      </main>
    )
  }

  return (
    <main className="relative">
      <Navigation showBanners />
      <Hero />
      <About />
      <CoOrganisers />
      <Suspense>
        <Categories />
      </Suspense>
      <Schedule />
      <Partners />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
