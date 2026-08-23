import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Gauge,
  Globe2,
  HelpCircle,
  Image as ImageIcon,
  Laptop,
  Layers,
  Layout,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { Footer } from "@/components/landing/Footer";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { Nav } from "@/components/landing/Nav";
import { LandingTeamShowcase } from "@/components/landing/LandingTeamShowcase";
import { Marquee } from "@/components/landing/primitives/Marquee";
import { CrispChat } from "@/components/CrispChat";

const SUPABASE_STORAGE_URL = "https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/design-reference";

const ROW_1_CONCEPTS = [
  {
    title: "Spennato Family Roofing",
    trade: "Roofing & Exteriors",
    url: "spennatoroofing.com",
    headline: "40 Years Experience · 5.0 ★ Rated",
    image: `${SUPABASE_STORAGE_URL}/roofers/1.jpg`,
    badge: "Roofers",
  },
  {
    title: "O'Connell Power & Electric",
    trade: "Electrical & Engineering",
    url: "oconnellelectric.com",
    headline: "Commercial & Industrial Electricians",
    image: `${SUPABASE_STORAGE_URL}/electricians/1.jpg`,
    badge: "Electricians",
  },
  {
    title: "Allstate General Contractors",
    trade: "Commercial & Residential",
    url: "allstatecontractors.com",
    headline: "Full-Service Construction & Modern Builds",
    image: `${SUPABASE_STORAGE_URL}/contractors/1.jpg`,
    badge: "Contractors",
  },
  {
    title: "Timberline HVAC & Heat Pumps",
    trade: "HVAC & Climate Systems",
    url: "timberlinehvac.com",
    headline: "24/7 Emergency AC & Heating Installs",
    image: `${SUPABASE_STORAGE_URL}/hvac/1.jpg`,
    badge: "HVAC",
  },
  {
    title: "Southern Roofing & Exteriors",
    trade: "Roofing & Restoration",
    url: "southernroofing.com",
    headline: "GAF Master Elite Certified Roofers",
    image: `${SUPABASE_STORAGE_URL}/roofers/2.jpg`,
    badge: "Roofers",
  },
  {
    title: "Cool Hand Electric",
    trade: "Electrical & EV Charging",
    url: "coolhandelectric.com",
    headline: "Residential Panel Upgrades & EV Chargers",
    image: `${SUPABASE_STORAGE_URL}/electricians/2.jpg`,
    badge: "Electricians",
  },
];

const ROW_2_CONCEPTS = [
  {
    title: "GM Master Plumbing Corp",
    trade: "Plumbing & Mechanical",
    url: "gmplumbingcorp.com",
    headline: "Licensed Master Plumbers · 24/7 Dispatch",
    image: `${SUPABASE_STORAGE_URL}/plumbers/1.jpg`,
    badge: "Plumbing",
  },
  {
    title: "Perfect Moving NYC",
    trade: "Moving & Storage Logistics",
    url: "perfectmoving.com",
    headline: "White-Glove Residential & Office Moving",
    image: `${SUPABASE_STORAGE_URL}/movers/1.jpg`,
    badge: "Movers",
  },
  {
    title: "Scott Simpson Design + Build",
    trade: "Custom Architecture & Builds",
    url: "scottsimpsonbuilders.com",
    headline: "Luxury Custom Homes & Modern Renovations",
    image: `${SUPABASE_STORAGE_URL}/contractors/2.jpg`,
    badge: "Design-Build",
  },
  {
    title: "Janney Roofing Florida",
    trade: "Residential & Commercial Roofs",
    url: "janneyroofing.com",
    headline: "Florida's Highest-Rated Roofing Team",
    image: `${SUPABASE_STORAGE_URL}/roofers/3.jpg`,
    badge: "Roofers",
  },
  {
    title: "Carini Home Services",
    trade: "HVAC & Energy Retrofits",
    url: "carinihomeservices.com",
    headline: "Heat Pump Specialists & LL97 Compliance",
    image: `${SUPABASE_STORAGE_URL}/hvac/2.jpg`,
    badge: "HVAC",
  },
  {
    title: "Piece of Cake Moving",
    trade: "Commercial & Local Relocation",
    url: "mypieceofcakemove.com",
    headline: "Guaranteed Flat-Rate Moving Solutions",
    image: `${SUPABASE_STORAGE_URL}/movers/2.jpg`,
    badge: "Logistics",
  },
];

const VISUAL_JOURNEY = [
  {
    step: "01",
    tag: "Instant Ingestion",
    title: "Submit URL & Friction Audit",
    body: "We analyze your site in real time, extract your real branding and reviews, and diagnose why your current site is losing phone calls.",
    badge: "Step 01",
    icon: Globe2,
    highlights: ["Speed baseline test", "5.0 ★ proof audit", "Competitor gap scan"],
  },
  {
    step: "02",
    tag: "48-Hour Rebuild",
    title: "AI Smart Concept & Rebuild",
    body: "Our design team crafts a high-contrast homepage built for speed on a phone, with an AI assistant that answers questions and takes callback requests, and a section for every service you offer.",
    badge: "Step 02 · 100% Free",
    icon: Laptop,
    highlights: ["Built for mobile speed", "AI chat & callback capture", "1-Tap call bar on mobile"],
  },
  {
    step: "03",
    tag: "Private Portal",
    title: "Review Your Interactive X-Ray",
    body: "Open your private portal to see where you appear in local search across your area, how you compare to the businesses beating you, and a live preview of your new homepage.",
    badge: "Step 03 · Zero Risk",
    icon: BarChart3,
    highlights: ["Local search grid", "Competitor comparison", "Live preview link"],
  },
  {
    step: "04",
    tag: "Handoff & Go-Live",
    title: "Launch on Your Domain",
    body: "Love the direction? We connect your domain, set up the full pages, and launch it live in 48 hours. Not ready? Keep the concept free.",
    badge: "Step 04 · Your Terms",
    icon: Rocket,
    highlights: ["Connected to your domain", "100% Client-owned website", "Fast call conversion"],
  },
];

function ConceptBrowserCard({ concept }: { concept: typeof ROW_1_CONCEPTS[0] }) {
  return (
    <div className="group w-[360px] sm:w-[420px] overflow-hidden rounded-2xl border border-[#c8ddec] bg-white/90 backdrop-blur-sm shadow-[0_12px_36px_rgba(7,40,77,0.08)] transition duration-300 hover:-translate-y-2 hover:border-[#0c68c8] hover:shadow-[0_24px_60px_rgba(7,40,77,0.16)]">
      {/* Browser Window Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7f2] bg-[#f4f7fb]/90 px-4 py-2.5 text-[11px] text-[#777588]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 truncate font-mono text-[10px] text-[#42506a]">{concept.url}</span>
        </div>
        <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#0c68c8] border border-[#d9e8f4]">
          {concept.badge}
        </span>
      </div>

      {/* Screenshot Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={concept.image}
          alt={concept.title}
          className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07284d]/60 via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-4 space-y-0.5">
        <h3 className="font-bold text-sm text-[#07284d]">{concept.title}</h3>
        <p className="text-xs text-[#60778d] truncate">{concept.headline}</p>
      </div>
    </div>
  );
}

export function LeadEngineLanding() {
  return (
    <main className="min-h-screen bg-white text-[#07284d] font-sans antialiased selection:bg-[#0c68c8] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <Nav />

      {/* 2. HERO SECTION (High-Tech SaaS Grid & Ambient Sparkles) */}
      <section id="top" className="relative overflow-hidden border-b border-[#d9e8f4] bg-gradient-to-b from-[#f0f6fc] via-[#f8fbfe] to-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* SaaS Background Grid Pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(12,104,200,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,104,200,0.06)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)]"
          aria-hidden="true"
        />

        {/* Ambient Sparkles & Glowing Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-[#dff0ff] blur-3xl opacity-80" />
        <div className="pointer-events-none absolute -left-24 top-48 h-[32rem] w-[32rem] rounded-full bg-[#fff5c0]/60 blur-3xl opacity-70" />
        
        {/* Floating Sparkle Micro-Accents */}
        <div className="pointer-events-none absolute left-[12%] top-28 hidden h-2.5 w-2.5 rounded-full bg-[#ffd12d] shadow-[0_0_0_8px_rgba(255,209,45,0.18)] lg:block animate-pulse" />
        <div className="pointer-events-none absolute right-[15%] top-40 hidden h-2 w-2 rounded-full bg-[#0c68c8] shadow-[0_0_0_8px_rgba(12,104,200,0.15)] lg:block" />
        <div className="pointer-events-none absolute bottom-16 left-[20%] hidden h-2 w-2 rounded-full bg-[#07284d] shadow-[0_0_0_6px_rgba(7,40,77,0.12)] lg:block" />

        <div className="relative mx-auto max-w-4xl px-6 text-center space-y-6">
          {/* Highlighted FREE Pill with Glow Ring */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd12d] bg-[#fff7c7] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#07284d] shadow-[0_4px_20px_rgba(255,209,45,0.25)]">
            <Sparkles className="h-4 w-4 text-[#07284d]" />
            Free 48-Hour Homepage Redesign & AI Audit
          </div>

          <h1 className="font-sans text-5xl font-extrabold tracking-[-0.045em] text-[#07284d] sm:text-6xl lg:text-7xl leading-[1.04]">
            GET YOUR HOMEPAGE <br />
            REDESIGNED <span className="bg-gradient-to-r from-[#0c68c8] via-[#07284d] to-[#0c68c8] bg-clip-text text-transparent underline decoration-[#ffd12d] decoration-4 underline-offset-8">FOR FREE</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#5c7186] sm:text-lg">
            See exactly how your homepage could look. We&apos;ll create a custom concept around your real business and deliver it in 48 hours — with AI chat, lead capture, and callback features built in from day one. Free, no strings attached.
          </p>

          <div className="pt-3">
            <RedesignIntakeFlow />
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#60778d]">
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> No payment · No obligation
            </span>
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> AI Chat & Callback Ready
            </span>
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> Limited daily spots available
            </span>
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> Yours to keep forever
            </span>
          </div>
        </div>
      </section>

      {/* 3. 3-STEP EVIDENCE VALUE BANNER (High-Contrast Navy & Gold) */}
      <section className="relative overflow-hidden border-b border-[#d9e8f4] bg-[#07284d] py-10 text-white shadow-inner">
        {/* Subtle grid on dark */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
          <div className="flex items-start gap-4 sm:border-r sm:border-white/15 sm:pr-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#ffd12d] shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd12d]">Step 01</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">100% Free</span>
              </div>
              <p className="mt-1 font-bold text-base text-white">AI Smart Homepage Concept</p>
              <p className="mt-0.5 text-xs text-white/70">Custom design with AI chat & instant callback capture.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:border-r sm:border-white/15 sm:pr-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#ffd12d] shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd12d]">Step 02</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">Included</span>
              </div>
              <p className="mt-1 font-bold text-base text-white">Digital X-Ray & Search Audit</p>
              <p className="mt-0.5 text-xs text-white/70">Real mobile speed test, a local search grid across your area, and how your competitors compare.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#ffd12d] shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd12d]">Step 03</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">Zero Risk</span>
              </div>
              <p className="mt-1 font-bold text-base text-white">Your Decision, No Pressure</p>
              <p className="mt-0.5 text-xs text-white/70">The concept is yours to keep. Continue only if you love the build.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. "SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE" (Smooth Multi-Row Marquee Showcase with Grid Backdrop) */}
      <section id="design-quality" className="relative scroll-mt-24 border-b border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28 overflow-hidden space-y-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(12,104,200,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,104,200,0.05)_1px,transparent_1px)] [background-size:48px_48px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Design Quality Bar</p>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
            SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#60778d] sm:text-base">
            Hover to pause and inspect. Every design is custom-crafted with high-contrast typography, trust badges, and instant quote dispatch.
          </p>
        </div>

        {/* Row 1: Scrolling Left */}
        <div className="relative space-y-6">
          <Marquee gap="gap-6" durationSeconds={35}>
            {ROW_1_CONCEPTS.map((concept) => (
              <ConceptBrowserCard key={concept.title} concept={concept} />
            ))}
          </Marquee>

          {/* Row 2: Scrolling Right */}
          <Marquee gap="gap-6" durationSeconds={38} reverse>
            {ROW_2_CONCEPTS.map((concept) => (
              <ConceptBrowserCard key={concept.title} concept={concept} />
            ))}
          </Marquee>
        </div>
      </section>

      {/* 5. VISUAL STEP 0 TO DELIVERY JOURNEY (Modern SaaS Interactive Timeline) */}
      <section id="how-it-works" className="relative border-b border-[#d9e8f4] bg-white py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(12,104,200,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,104,200,0.04)_1px,transparent_1px)] [background-size:36px_36px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-6 space-y-16">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">From First Touch to Live Launch</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              HOW YOUR 48-HOUR REDESIGN WORKS
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#60778d] sm:text-base">
              A transparent, zero-risk progression. From your initial website submission to private X-Ray diagnosis and official domain launch.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VISUAL_JOURNEY.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#c8ddec] bg-white/90 backdrop-blur-sm p-6 shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition duration-300 hover:-translate-y-2 hover:border-[#0c68c8] hover:shadow-[0_20px_45px_rgba(7,40,77,0.12)]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4ff] text-[#0c68c8]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-[#f8fbfe] border border-[#c8ddec] px-2.5 py-0.5 text-[10px] font-bold text-[#0c68c8]">
                        {item.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[11px] font-bold text-[#777588] uppercase tracking-wider">
                        {item.tag}
                      </span>
                      <h3 className="font-bold text-lg text-[#07284d] leading-tight">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs leading-relaxed text-[#60778d]">
                      {item.body}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[#e2edf5] pt-4 space-y-2">
                    {item.highlights.map((hl) => (
                      <div key={hl} className="flex items-center gap-2 text-[11px] font-semibold text-[#07284d]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#0c68c8] shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-8 py-4 text-sm font-bold text-[#07284d] shadow-[0_6px_25px_rgba(255,209,45,0.3)] transition hover:bg-[#f5c400] hover:scale-105"
            >
              Get My Free Redesign <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. "EVERYTHING YOU GET, FREE" (Navy + Gold Luxury Card) */}
      <section id="what-you-get" className="relative border-b border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28">
        <div className="relative mx-auto max-w-3xl px-6 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Full Free Deliverables</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              EVERYTHING YOU GET, FREE
            </h2>
            <p className="text-sm text-[#60778d]">
              We show our work before asking for anything. Love the design and want to launch it? Great. Not now? The concept is yours to keep, no strings.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-[#0a325e] to-[#07284d] p-8 sm:p-10 shadow-[0_24px_60px_rgba(7,40,77,0.25)] text-white space-y-6">
            {/* Ambient gold glow in card corner */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffd12d]/15 blur-2xl" />

            <div className="relative flex items-center justify-between border-b border-white/15 pb-4">
              <span className="font-bold text-base text-white">48-Hour Free Deliverable Scope</span>
              <span className="rounded-full bg-[#ffd12d] px-3.5 py-1 text-xs font-black text-[#07284d] uppercase shadow-sm">
                100% Free
              </span>
            </div>

            <div className="relative space-y-4 text-sm">
              {[
                "Homepage redesign concept tailored to your real brand, colors & logo",
                "Desktop and mobile-first responsive layout, built for speed on a phone",
                "Interactive AI lead assistant & instant callback request capture",
                "Evidence-based Digital X-Ray audit & Core Web Vitals speed test",
                "Google AI Overview & ChatGPT entity schema markup",
                "Delivered to your private tracking portal in 48 hours",
                "Yours to keep forever with zero obligation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-slate-100">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffd12d] text-[#07284d] mt-0.5 font-bold shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="relative pt-4">
              <a
                href="#top"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffd12d] py-4 text-sm font-bold text-[#07284d] shadow-[0_6px_25px_rgba(255,209,45,0.35)] transition hover:bg-[#f5c400]"
              >
                Get My Free Redesign <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-center text-xs text-white/70 mt-2.5">
                48h delivery · No credit card · Yours to keep forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TEAM SHOWCASE */}
      <LandingTeamShowcase />

      {/* 8. FAQ ACCORDION */}
      <FAQAccordion />

      {/* 9. BOTTOM CALL-TO-ACTION BANNER (High-Tech Navy Glow) */}
      <section className="relative overflow-hidden border-t border-[#d9e8f4] bg-[#07284d] py-24 text-center text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl px-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#ffd12d] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Start with the first impression
          </div>

          <h2 className="font-sans text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
            READY TO TRANSFORM <br />
            YOUR HOMEPAGE?
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-200">
            Get a professional redesign concept that turns visitors into paying customers. Delivered in 48 hours. Completely free.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-8 py-4 text-sm font-bold text-[#07284d] shadow-[0_6px_25px_rgba(255,209,45,0.3)] transition hover:bg-[#f5c400] hover:scale-105"
            >
              Get My Free Redesign <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+13075336678"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-[#ffd12d]" /> Call +1 (307) 533-6678
            </a>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <Footer />
      <CrispChat />
    </main>
  );
}
