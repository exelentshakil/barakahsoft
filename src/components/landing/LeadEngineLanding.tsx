import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Eye,
  FileText,
  Megaphone,
  Phone,
  Rocket,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { IntakeFlow } from "@/components/landing/IntakeFlow";
import { Footer } from "@/components/landing/Footer";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { Nav } from "@/components/landing/Nav";
import { IndustryShowcase } from "@/components/landing/IndustryShowcase";
import { LandingTeamShowcase } from "@/components/landing/LandingTeamShowcase";
import landing from "../../../content/landing.json";

const NAVY = "#07284D";
const YELLOW = "#FFD12D";

const SYSTEM = [
  {
    icon: Target,
    number: "01",
    title: "Find the opportunity",
    body: "We research your market, service area, competitors, and the jobs you want more of.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Build the conversion path",
    body: "We create a clear offer, landing page, tracking, and contact path around your real business.",
  },
  {
    icon: Megaphone,
    number: "03",
    title: "Launch the creative",
    body: "We produce the ad copy and short-form creative direction needed to stop the scroll.",
  },
  {
    icon: Workflow,
    number: "04",
    title: "Improve the next cycle",
    body: "We review lead quality, campaign signals, and follow-up so the next week is smarter.",
  },
];

const FAQ = [
  [
    "What am I paying for?",
    "You pay BarakahSoft $500 per week for the people, strategy, landing page, campaign management, creative direction, tracking, lead routing, and weekly improvement. You are not paying per lead.",
  ],
  [
    "What do I pay Meta?",
    "Your advertising budget is paid directly to Meta from your own account. We recommend starting at $25 per day so there is enough room to test responsibly.",
  ],
  [
    "What does 30 leads mean?",
    "It is a target for qualified lead opportunities during the first 30 days. The written agreement defines the service area, lead type, response expectations, exclusions, and the remedy if the target is missed.",
  ],
  [
    "What do I need to do?",
    "Tell us which jobs and areas you want, give us access to your Meta account, approve the campaign direction, and respond quickly when new opportunities arrive.",
  ],
  [
    "Do I need a new website?",
    "We build a complete premium preview around your real business before you commit. It can replace the old site or run alongside it. The website is the conversion asset inside the lead system.",
  ],
  [
    "Is there a contract?",
    "There is no long-term obligation. You can judge the working relationship during the first week. The 30-day target and any guarantee conditions are agreed in writing before launch.",
  ],
  [
    "Is this fully automated?",
    "No. Automation helps us move quickly, but people research the market, shape the offer, edit the creative, monitor the campaign, and decide what should change.",
  ],
];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
      {children}
    </p>
  );
}

export function LeadEngineLanding() {
  const brandStyle = {
    "--primary": "213 83% 16%",
    "--ring": "213 83% 16%",
    "--primary-h": "213",
    "--primary-s": "83%",
    "--primary-l": "16%",
    "--brand-gold": "47 100% 59%",
  } as React.CSSProperties;

  return (
    <main id="top" style={brandStyle} className="bg-white text-[#1e212b]">
      <Nav />

      <section className="relative overflow-hidden border-b border-[#d9e8f4] bg-white">
        <div
          className="absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#e5f4ff] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto mb-6 w-fit rounded-full bg-[#e8f4ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075da8]">
              Managed lead generation for US home-service businesses
            </p>
            <h1 className="font-sans text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#07284d] sm:text-7xl">
              Get 30 qualified lead opportunities in 30 days.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#5c7186]">
              We build and manage the page, ads, creative, tracking, and
              follow-up system. You run your business. We create more
              opportunities for the work your team already provides.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <IntakeFlow ctaLabel={landing.primaryCta} />
              <a
                href="tel:+13075336678"
                className="inline-flex items-center gap-2 rounded-lg border border-[#8fc6ff] bg-white px-6 py-3 text-sm font-bold text-[#07284d] transition hover:bg-[#f0f7ff]"
              >
                <Phone className="h-4 w-4" /> Talk to BarakahSoft
              </a>
            </div>
            <p className="mx-auto mt-4 max-w-xl text-xs text-[#7890a5]">
              No setup fee for founding clients. No per-lead fee. Your
              advertising budget stays in your own Meta account.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-[#c8ddec] bg-[#f6fbff] shadow-[0_20px_60px_rgba(7,40,77,0.12)]">
            <div className="relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="aspect-[2/1] w-full object-cover"
              >
                <source
                  src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4"
                  type="video/mp4"
                />
              </video>
              <span className="absolute left-5 top-5 rounded-md bg-[#07284d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                The industries we serve
              </span>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#c8ddec] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#07284d]">
                  A short introduction to BarakahSoft
                </p>
                <p className="mt-1 text-sm text-[#71869a]">
                  The campaign strategy, research, editing, and optimization are
                  handled by our team.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
                Research · Build · Manage
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] bg-[#07284d] py-7 text-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 sm:grid-cols-3">
          <div className="border-white/20 sm:border-r sm:pr-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              The target
            </p>
            <p className="mt-2 font-semibold">
              30 qualified opportunities in 30 days
            </p>
          </div>
          <div className="border-white/20 sm:border-r sm:pr-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              The model
            </p>
            <p className="mt-2 font-semibold">
              $500/week management, no per-lead charge
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              The ownership
            </p>
            <p className="mt-2 font-semibold">
              Your Meta account, budget, data, and leads
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <Kicker>The problem with most marketing</Kicker>
              <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
                You should not have to become a marketing expert to get more
                work.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#60778d]">
              Most owners are forced to coordinate a website person, an ad
              person, a designer, and a lead provider. We bring the core work
              into one hands-on weekly program.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              [
                "The old website",
                "Looks fine to you, but gives a new visitor no clear reason to call.",
              ],
              [
                "The scattered marketing",
                "Ads, pages, and follow-up are disconnected, so nobody knows what is working.",
              ],
              [
                "The missed opportunity",
                "A real inquiry arrives, but slow response and weak routing lose the job.",
              ],
            ].map(([title, body], index) => (
              <div
                key={title}
                className="rounded-xl border border-[#c8ddec] bg-[#f8fbfe] p-6"
              >
                <p className="text-4xl font-semibold tracking-tight text-[#b8d8ef]">
                  0{index + 1}
                </p>
                <h3 className="mt-8 text-lg font-bold text-[#07284d]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#657c90]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b border-[#d9e8f4] bg-[#eef7ff] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Kicker>What we actually do</Kicker>
            <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
              A complete system, managed by people who look at the details.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#60778d]">
              Automation helps us move faster. Research, judgment, editing, and
              optimization are still handled by our team.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {SYSTEM.map(({ icon: Icon, number, title, body }) => (
              <div
                key={number}
                className="group rounded-2xl border border-[#c8ddec] bg-white p-7 shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,40,77,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7c7] text-[#07284d]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-[#0c68c8]">
                    {number}
                  </span>
                </div>
                <h3 className="mt-9 text-xl font-bold text-[#07284d]">
                  {title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#657c90]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] py-24 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Kicker>What you see</Kicker>
            <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
              Clear reporting without marketing jargon.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#60778d]">
              You see what is running, what inquiries came in, what they asked
              for, and what we are changing next. The example below is a visual
              preview, not a claim about existing results.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Your ad account and lead data stay yours.",
                "No per-lead charge.",
                "Weekly review of quality and next actions.",
              ].map((line) => (
                <p
                  key={line}
                  className="flex items-center gap-3 text-sm font-semibold text-[#07284d]"
                >
                  <Check className="h-5 w-5 text-[#0c68c8]" />
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#c8ddec] bg-white p-5 shadow-[0_20px_60px_rgba(7,40,77,0.1)]">
            <div className="flex items-center justify-between border-b border-[#e2edf5] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
                  Illustrative program view
                </p>
                <p className="mt-1 font-bold text-[#07284d]">
                  Your weekly review
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-[#0c68c8]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Lead target", "30", Target],
                ["Ad budget", "$25/day", CircleDollarSign],
                ["Review", "Weekly", Eye],
              ].map(([label, value, Icon]) => (
                <div
                  key={label as string}
                  className="rounded-xl bg-[#eef7ff] p-4"
                >
                  <Icon className="h-5 w-5 text-[#0c68c8]" />
                  <p className="mt-5 text-xl font-bold text-[#07284d]">
                    {value as string}
                  </p>
                  <p className="mt-1 text-xs text-[#657c90]">
                    {label as string}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#e2edf5] p-4">
              <div className="flex items-center justify-between border-b border-[#e2edf5] pb-3 text-xs font-bold uppercase tracking-wider text-[#71869a]">
                <span>What we watch</span>
                <span>Status</span>
              </div>
              {[
                "Campaign activity",
                "Landing page conversion",
                "Lead quality",
                "Follow-up response",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between border-b border-[#eef3f7] py-3 text-sm"
                >
                  <span className="font-semibold text-[#07284d]">{item}</span>
                  <span className="text-xs font-bold text-emerald-700">
                    Reviewing
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#71869a]">
              Illustrative preview of a BarakahSoft lead-engine program. Actual
              reporting reflects your campaign, channels, ad budget, lead
              sources, and connected data.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] bg-[#07284d] py-12 text-white lg:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <Kicker>Simple responsibilities</Kicker>
              <h2 className="max-w-lg font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                You run the business. We run the marketing work.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "You provide",
                  "The jobs you want, your service area, access to your Meta account, and quick responses to new inquiries.",
                ],
                [
                  "We provide",
                  "The offer, page, creative, campaign, tracking, lead routing, research, and weekly improvement.",
                ],
                [
                  "You pay",
                  "$500/week management · no per-lead charge",
                ],
                [
                  "You decide",
                  "Try the relationship for one week. Continue only if the work is useful to your business.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/15 bg-white/5 p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
                    {title}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-200">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-200">Want to know if your market and service are a fit?</p><a href="#top" className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#ffd12d] px-5 py-3 text-sm font-bold text-[#111] transition hover:bg-[#f5c400]">Start with a qualification review <ArrowRight className="h-4 w-4" /></a></div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 border-b border-[#d9e8f4] py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Kicker>One clear offer</Kicker>
          <h2 className="font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d] sm:text-5xl">
            Start with one week. Judge the work.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#60778d]">
            No setup fee for founding clients. No per-lead fees. No long-term
            obligation. We agree the qualified-opportunity target and conditions
            before the 30-day campaign begins.
          </p>
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#8fc6ff] bg-[#f0f7ff] p-8 text-left shadow-[0_18px_45px_rgba(7,40,77,0.08)]">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#c8ddec] pb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
                  30-Day Lead Engine Pilot
                </p>
                <p className="mt-2 text-sm text-[#60778d]">
                  Management, creative, page, tracking, routing, and weekly
                  improvement.
                </p>
              </div>
              <p className="font-sans text-5xl font-semibold text-[#07284d]">
                $500
                <span className="text-lg font-normal text-[#60778d]">
                  /week
                </span>
              </p>
            </div>
            <div className="grid gap-4 py-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                  You pay us
                </p>
                <p className="mt-2 font-bold text-[#07284d]">$500/week</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                  You pay Meta
                </p>
                <p className="mt-2 font-bold text-[#07284d]">Your ad budget</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                  No charge
                </p>
                <p className="mt-2 font-bold text-[#07284d]">Per lead</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs leading-5 text-[#60778d]">
                30 qualified opportunities is the campaign KPI. The written
                agreement defines what qualifies.
              </p>
              <a
                href="#top"
                className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-5 py-3 text-sm font-bold text-[#111] transition hover:bg-[#f5c400]"
              >
                See if I qualify <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <LandingTeamShowcase />
      <IndustryShowcase />
      <FAQAccordion />
      <section className="border-t border-[#d9e8f4] bg-[#eef7ff] py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <Kicker>Ready to see what we can do?</Kicker>
          <h2 className="font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d] sm:text-6xl">
            Let&apos;s find out if your business is a fit.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#60778d]">
            Start with your website and trade. We&apos;ll review the opportunity
            and show you the next step.
          </p>
          <div className="mt-8 flex justify-center">
            <IntakeFlow ctaLabel="See if my business qualifies" />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
