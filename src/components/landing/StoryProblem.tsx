import { Clock, TrendingDown, PhoneOff } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";

const SHAK_PHOTO = "https://barakahsoft.com/wp-content/uploads/2026/07/Shak-Headshot-Medium.jpeg";

const PAIN_POINTS = [
  { icon: Clock, title: "It looks like 2015", body: "A dated site is the first thing a prospect judges you on — before they've even called." },
  { icon: TrendingDown, title: "No leads from Google", body: "If it's not fast, mobile-first, and built to convert, it's not bringing in real calls." },
  { icon: PhoneOff, title: "Agencies are slow and expensive", body: "Weeks of back-and-forth and a five-figure quote for something you could be using this week." },
];

// Pain-point storytelling built around a real, verbatim founder quote —
// the emotional hook before the pitch, not another feature list.
export function StoryProblem() {
  return (
    <section className="relative overflow-hidden border-t border-border py-24">
      <div className="decor-blob -right-32 top-0 h-96 w-96" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow>The problem</SectionEyebrow>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Every hour your site looks broken, a customer calls someone else
          </h2>
        </div>

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-3">
          {PAIN_POINTS.map((point, i) => (
            <RevealItem key={point.title} index={i}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                <IconBadge icon={point.icon} />
                <h3 className="mt-4 font-semibold">{point.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{point.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal variant="fade-up" className="mt-14">
          <blockquote className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-border bg-gradient-primary p-8 text-center text-primary-foreground shadow-glow sm:flex-row sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHAK_PHOTO} alt="Shakil Ahmed, Founder" className="h-16 w-16 shrink-0 rounded-full border-2 border-white/40 object-cover" />
            <div>
              <p className="text-lg font-medium leading-snug">
                "There are a lot of business owners who lose sales every hour their site is down, and no one picks up the phone."
              </p>
              <p className="mt-2 text-sm text-primary-foreground/80">Shakil Ahmed, Founder</p>
            </div>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
