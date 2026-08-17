import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { IntakeFlow } from "@/components/landing/IntakeFlow";
import { TrustLogos } from "@/components/landing/TrustLogos";
import { StoryProblem } from "@/components/landing/StoryProblem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IndustryShowcase } from "@/components/landing/IndustryShowcase";
import { Team } from "@/components/landing/Team";
import { PricingPilot } from "@/components/landing/PricingPilot";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { CookieConsent } from "@/components/landing/CookieConsent";
import landing from "../../content/landing.json";

// Real BarakahSoft brand color (from the actual logo -- purple + gold),
// scoped to just this page via the same inline-CSS-var mechanism
// shell-style.ts uses for per-lead sites, rather than changing the shared
// root --primary in globals.css (which the admin dashboard also reads).
const BRAND_STYLE = {
  "--primary": "271 70% 45%",
  "--ring": "271 70% 45%",
  "--primary-h": "271",
  "--primary-s": "70%",
  "--primary-l": "45%",
  "--brand-gold": "43 96% 56%",
} as React.CSSProperties;

export default function LandingPage() {
  return (
    <main id="top" style={BRAND_STYLE}>
      <Nav />
      <Hero>
        <IntakeFlow ctaLabel={landing.primaryCta} />
      </Hero>
      <TrustLogos />
      <StoryProblem />
      <HowItWorks />
      <IndustryShowcase />
      <Team />
      <PricingPilot />
      <FAQAccordion />
      <FinalCta />
      <Footer />
      <CookieConsent />
    </main>
  );
}
