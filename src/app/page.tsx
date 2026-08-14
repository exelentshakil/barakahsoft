import { Hero } from "@/components/landing/Hero";
import { IntakeFlow } from "@/components/landing/IntakeFlow";
import { ProofGallery } from "@/components/landing/ProofGallery";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { CookieConsent } from "@/components/landing/CookieConsent";
import landing from "../../content/landing.json";

export default function LandingPage() {
  return (
    <main>
      <Hero>
        <IntakeFlow ctaLabel={landing.primaryCta} />
      </Hero>

      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {landing.steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </div>
              <p className="mt-3 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ProofGallery />
      <FAQAccordion />
      <CookieConsent />
    </main>
  );
}
