import { PostEventHero } from "@/components/post-event-hero"
import { LeaderboardSection } from "@/components/leaderboard-section"
import { EventGallerySection } from "@/components/event-gallery-section"
import { Partners, CoOrganisers } from "@/components/partners"
import { PostEventCTA } from "@/components/post-event-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative">
      <PostEventHero />
      <LeaderboardSection />
      <EventGallerySection />
      <CoOrganisers />
      <Partners />
      <PostEventCTA />
      <Footer />
    </main>
  )
}
