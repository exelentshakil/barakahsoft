import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  HelpCircle,
  Laptop,
  Layers,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { Footer } from "@/components/landing/Footer";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { Nav } from "@/components/landing/Nav";
import { LandingTeamShowcase } from "@/components/landing/LandingTeamShowcase";
import { CrispChat } from "@/components/CrispChat";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const REAL_PORTFOLIO_SAMPLES = [
  {
    title: "QSA Self Storage",
    category: "Storage & Logistics",
    url: "qsaselfstorage.co.uk",
    headline: "Looking for Belfast's Best Self Storage?",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    badge: "Storage",
  },
  {
    title: "K Neeson Removals",
    category: "Removals & Logistics",
    url: "kneesonremovals.com",
    headline: "Stress-Free Home & Commercial Moving",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    badge: "Logistics",
  },
  {
    title: "BME Electrical",
    category: "Electrical & Engineering",
    url: "bmeelectrical.co.uk",
    headline: "Commercial & Industrial Electrical Contractors",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    badge: "Contractors",
  },
  {
    title: "Fitter Finances",
    category: "Financial & Advisory",
    url: "fitterfinances.com",
    headline: "Clear Financial Guidance & Debt Recovery",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    badge: "Financial",
  },
  {
    title: "Canavan Construction",
    category: "Construction & Remodeling",
    url: "canavanconstruction.com",
    headline: "High-End Residential & Commercial Builds",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
    badge: "Construction",
  },
  {
    title: "Harry Coates Studio",
    category: "Artist & Gallery",
    url: "harrycoates.com",
    headline: "Contemporary Fine Art & Visual Exhibitions",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    badge: "Ecommerce / Studio",
  },
];

const MOBILE_MOCKUPS = [
  {
    title: "Self Storage",
    headline: "Belfast's #1 Secure Storage Facility",
    bg: "bg-slate-900",
    accent: "bg-[#ffd12d] text-[#07284d]",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Financial Advisory",
    headline: "Over £6,000 in Debt? Get Help Today",
    bg: "bg-[#07284d]",
    accent: "bg-[#ffd12d] text-[#07284d]",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Electrical & HVAC",
    headline: "Commercial Installations & EV Charging",
    bg: "bg-slate-950",
    accent: "bg-[#ffd12d] text-[#07284d]",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Roofing & Exterior",
    headline: "5.0 ★ Rated Roof Replacement",
    bg: "bg-[#07284d]",
    accent: "bg-white text-[#07284d]",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    tag: "Takes 2 Minutes",
    title: "Fill Out the Form",
    body: "Share your current website URL and what you want to fix. Tell us where your current site is leaking calls or looking outdated.",
  },
  {
    number: "02",
    tag: "Within 48 Hours",
    title: "We Audit & Rebuild Your Homepage",
    body: "We extract your genuine branding, run local speed diagnostics, and design a custom high-converting concept for desktop and mobile.",
  },
  {
    number: "03",
    tag: "Straight to Your Inbox",
    title: "Review in Your Private Portal",
    body: "You receive a private magic link to inspect your interactive Digital X-Ray audit, competitor benchmarks, and live website preview.",
  },
  {
    number: "04",
    tag: "No Strings Attached",
    title: "Decide What's Next",
    body: "Love the direction? We can connect your domain and launch the full platform. Not ready? Keep the redesign concept 100% free of charge.",
  },
];

export function LeadEngineLanding() {
  return (
    <main className="min-h-screen bg-white text-[#07284d] font-sans antialiased">
      {/* 1. TOP NAVBAR (Real BarakahSoft Branding) */}
      <Nav />

      {/* 2. HERO SECTION */}
      <section id="top" className="relative overflow-hidden border-b border-[#d9e8f4] bg-gradient-to-b from-[#f4f9fd] via-[#f8fbfe] to-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle Brand Glows */}
        <div className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#e5f4ff] blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-60 h-[32rem] w-[32rem] rounded-full bg-[#fff7c7]/50 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center space-y-6">
          {/* Highlighted FREE Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f1c400] bg-[#fff7c7] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#07284d] shadow-sm">
            <Sparkles className="h-4 w-4 text-[#07284d]" />
            Free 48-Hour Homepage Redesign
          </div>

          <h1 className="font-sans text-5xl font-extrabold tracking-[-0.04em] text-[#07284d] sm:text-6xl lg:text-7xl leading-[1.05]">
            GET YOUR HOMEPAGE <br />
            REDESIGNED <span className="bg-gradient-to-r from-[#0c68c8] to-[#07284d] bg-clip-text text-transparent underline decoration-[#ffd12d] decoration-4 underline-offset-8">FOR FREE</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#5c7186] sm:text-lg">
            See exactly how your homepage could look. We&apos;ll create a custom concept around your real business and deliver it in 48 hours — optimized for Google and AI chatbots to boost your calls and leads. Free, no strings attached.
          </p>

          <div className="pt-3">
            <RedesignIntakeFlow />
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#60778d]">
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> No payment · No obligation
            </span>
            <span className="flex items-center gap-1.5 text-[#07284d] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#0c68c8]" /> Google & AI Search Ready
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

      {/* 3. 3-STEP EVIDENCE VALUE BANNER */}
      <section className="border-b border-[#d9e8f4] bg-[#07284d] py-9 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
          <div className="flex items-start gap-4 sm:border-r sm:border-white/15 sm:pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ffd12d]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd12d]">Step 01</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">100% Free</span>
              </div>
              <p className="mt-1 font-bold text-base text-white">Custom Homepage Concept</p>
              <p className="mt-0.5 text-xs text-white/70">Tailored to your genuine branding, real proof, and services.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:border-r sm:border-white/15 sm:pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ffd12d]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffd12d]">Step 02</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">Included</span>
              </div>
              <p className="mt-1 font-bold text-base text-white">Digital X-Ray & Speed Audit</p>
              <p className="mt-0.5 text-xs text-white/70">Mobile speed test, local search matrix, and competitor benchmarks.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#ffd12d]">
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

      {/* 4. "SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE" (GALLERY) */}
      <section id="examples" className="border-b border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Real Website Concepts</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#60778d] sm:text-base">
              Real homepages we build for businesses across trades, logistics, professional services, finance, and ecommerce.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REAL_PORTFOLIO_SAMPLES.map((sample) => (
              <div
                key={sample.title}
                className="group relative overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.06)] transition duration-300 hover:-translate-y-1.5 hover:border-[#0c68c8] hover:shadow-[0_18px_40px_rgba(7,40,77,0.12)]"
              >
                {/* Browser Window Header */}
                <div className="flex items-center gap-1.5 border-b border-[#e5e7f2] bg-[#f4f7fb] px-4 py-2.5 text-[11px] text-[#777588]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 truncate font-mono text-[10px] text-[#42506a]">{sample.url}</span>
                </div>

                {/* Screenshot Area */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07284d]/40 via-transparent to-transparent" />
                </div>

                <div className="p-5 space-y-1">
                  <span className="inline-block rounded bg-[#e8f4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0c68c8]">
                    {sample.badge}
                  </span>
                  <h3 className="font-bold text-base text-[#07284d]">{sample.title}</h3>
                  <p className="text-xs text-[#60778d] truncate">{sample.headline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. "LOOKS GREAT ON MOBILE, TOO" */}
      <section className="border-b border-[#d9e8f4] bg-white py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 space-y-14">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Mobile-First Conversion</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              LOOKS GREAT ON MOBILE, TOO
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#60778d] sm:text-base">
              Every concept is built mobile-first. 0.12s first paint speed with sticky 1-tap call buttons and fast quote dispatch so mobile visitors turn into booked conversations.
            </p>
          </div>

          {/* 4 Mobile Handsets */}
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto">
            {MOBILE_MOCKUPS.map((m) => (
              <div
                key={m.title}
                className="relative overflow-hidden rounded-[2.5rem] border-4 border-[#07284d] bg-[#07284d] p-2 shadow-2xl transition duration-300 hover:scale-105 hover:border-[#0c68c8]"
              >
                {/* Speaker Notch */}
                <div className="mx-auto h-3.5 w-16 rounded-full bg-slate-800 mb-2" />

                <div className="aspect-[9/16] overflow-hidden rounded-[2rem] bg-slate-900 flex flex-col justify-between p-4 relative">
                  <img
                    src={m.img}
                    alt={m.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                  <div className="relative z-10 space-y-1.5">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-black uppercase ${m.accent}`}>
                      {m.title}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {m.headline}
                    </h4>
                  </div>

                  <div className="relative z-10 pt-3">
                    <div className="rounded-lg bg-[#ffd12d] py-2 text-center text-[10px] font-bold text-[#07284d] shadow-md">
                      📞 Call Now (1-Tap)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. "FROM FORM TO FRESH DESIGN — IN 48 HOURS" */}
      <section id="how-it-works" className="border-b border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-6 space-y-14">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Our Process</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              FROM FORM TO FRESH DESIGN — IN 48 HOURS
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#60778d]">
              A simple process. No payment, no obligation. Just a professional redesign concept delivered straight to your private tracking portal.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PROCESS_STEPS.map((s) => (
              <div
                key={s.number}
                className="relative rounded-2xl border border-[#c8ddec] bg-white p-7 shadow-[0_8px_24px_rgba(7,40,77,0.05)] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4ff] font-black text-[#0c68c8] text-base">
                      {s.number}
                    </span>
                    <span className="rounded-full bg-[#f4f7fb] border border-[#c8ddec] px-3 py-1 text-[11px] font-bold text-[#07284d]">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#07284d]">{s.title}</h3>
                  <p className="text-xs text-[#60778d] leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-8 py-4 text-sm font-bold text-[#07284d] shadow-md transition hover:bg-[#f5c400] hover:scale-105"
            >
              Get My Free Redesign <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 7. "EVERYTHING YOU GET, FREE" (Navy + Gold High Value Box) */}
      <section id="what-you-get" className="border-b border-[#d9e8f4] bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Full Free Deliverables</p>
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-5xl">
              EVERYTHING YOU GET, FREE
            </h2>
            <p className="text-sm text-[#60778d]">
              We show our work before asking for anything. Love it and want the full site build? Great. Not now? The concept is yours to keep, no strings.
            </p>
          </div>

          <div className="rounded-3xl border border-[#c8ddec] bg-[#07284d] p-8 sm:p-10 shadow-2xl text-white space-y-6">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className="font-bold text-base text-white">48-Hour Free Package</span>
              <span className="rounded-full bg-[#ffd12d] px-3.5 py-1 text-xs font-black text-[#07284d] uppercase">
                100% Free
              </span>
            </div>

            <div className="space-y-4 text-sm">
              {[
                "Homepage redesign concept tailored to your real brand, colors & logo",
                "Desktop and mobile-first responsive layout (0.12s first paint)",
                "Evidence-based Digital X-Ray audit & Core Web Vitals speed test",
                "Conversion-written copy for your services and high-margin offers",
                "Delivered to your private tracking portal in 48 hours",
                "Yours to keep forever with zero obligation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-slate-200">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffd12d] text-[#07284d] mt-0.5 font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="#top"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffd12d] py-4 text-sm font-bold text-[#07284d] shadow-lg transition hover:bg-[#f5c400]"
              >
                Get My Free Redesign <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-center text-xs text-white/60 mt-2.5">
                48h delivery · No credit card · Yours to keep forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TEAM & PROOF SHOWCASE */}
      <LandingTeamShowcase />

      {/* 9. FAQ ACCORDION */}
      <FAQAccordion />

      {/* 10. BOTTOM CALL-TO-ACTION BANNER */}
      <section className="border-t border-[#d9e8f4] bg-[#07284d] py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#ffd12d]">
            <Sparkles className="h-3.5 w-3.5" /> Start with the first impression
          </div>

          <h2 className="font-sans text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
            READY TO TRANSFORM <br />
            YOUR HOMEPAGE?
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-300">
            Get a professional redesign concept that turns visitors into paying customers. Delivered in 48 hours. Completely free.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-8 py-4 text-sm font-bold text-[#07284d] shadow-xl transition hover:bg-[#f5c400] hover:scale-105"
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

      {/* 11. FOOTER (With Wyoming Address & Legal Links) */}
      <Footer />
      <CrispChat />
    </main>
  );
}
