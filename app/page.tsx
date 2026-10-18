import { CTA } from "@/components/CTA";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { LineBand } from "@/components/LineBand";
import { Navbar } from "@/components/Navbar";
import { ProblemSection } from "@/components/ProblemSection";
import { RevealController } from "@/components/RevealController";
import { Sessions } from "@/components/Sessions";
import { Testimonials } from "@/components/Testimonials";
import { Ticker } from "@/components/Ticker";
import type { HomeSession } from "@/components/HomeSessionCard";

import { getPublicSessions } from "@/lib/publicSessions";
export const dynamic = "force-dynamic";

export default async function Home() {
  let sessions: HomeSession[] = [];
  let failed = false;
  try {
    sessions = (await getPublicSessions()).map(session => ({
      title: session.title, startsAt: session.starts_at, endsAt: session.ends_at,
      bookedCount: session.booked_count, capacity: session.capacity,
      bookingHref: `/sessions/book?session=${session.id}`
    }));
  } catch { failed = true; }
  return (
    <>
      <RevealController />
      <Navbar />
      <main>
        <Hero upcomingSessions={sessions} loadError={failed} />
        <Ticker />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <Sessions sessions={sessions.slice(0, 6)} loadError={failed} />
        <LineBand />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
