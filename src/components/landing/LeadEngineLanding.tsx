import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  HelpCircle,
  Laptop,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { Footer } from "@/components/landing/Footer";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { CrispChat } from "@/components/CrispChat";

const REAL_PORTFOLIO_SAMPLES = [
  {
    title: "QSA Self Storage",
    category: "Self Storage & Logistics",
    url: "qsaselfstorage.co.uk",
    headline: "Looking for Belfast's Best Self Storage?",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    theme: "from-amber-500/20 to-stone-900",
  },
  {
    title: "K Neeson Removals",
    category: "Removals & Logistics",
    url: "kneesonremovals.com",
    headline: "Stress-Free Home & Commercial Moving",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    theme: "from-blue-600/20 to-slate-900",
  },
  {
    title: "BME Electrical",
    category: "Electrical & Engineering",
    url: "bmeelectrical.co.uk",
    headline: "Commercial & Industrial Electrical Contractors",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    theme: "from-yellow-500/20 to-slate-950",
  },
  {
    title: "Fitter Finances",
    category: "Financial & Advisory",
    url: "fitterfinances.com",
    headline: "Clear Financial Guidance & Growth Planning",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    theme: "from-emerald-500/20 to-slate-900",
  },
  {
    title: "Canavan Construction",
    category: "Construction & Remodeling",
    url: "canavanconstruction.com",
    headline: "High-End Residential & Commercial Builds",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=800&q=80",
    theme: "from-orange-500/20 to-stone-900",
  },
  {
    title: "Harry Coates Studio",
    category: "Artist & Gallery",
    url: "harrycoates.com",
    headline: "Contemporary Fine Art & Visual Exhibitions",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    theme: "from-purple-500/20 to-zinc-950",
  },
];

const MOBILE_MOCKUPS = [
  {
    title: "Self Storage",
    headline: "Belfast's #1 Self Storage Facility",
    bg: "bg-amber-950/90",
    accent: "bg-amber-400 text-stone-950",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Financial Advisory",
    headline: "Over £6,000 in Debt? Get Help Today",
    bg: "bg-emerald-950/90",
    accent: "bg-emerald-400 text-stone-950",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Electrical Contractors",
    headline: "Commercial Electrical Installations",
    bg: "bg-slate-950",
    accent: "bg-yellow-400 text-stone-950",
    img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Roofing & Exterior",
    headline: "5.0 ★ Rated Roof Replacement",
    bg: "bg-blue-950",
    accent: "bg-blue-400 text-white",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
  },
];

const PROCESS_STEPS = [
  {
    number: "1",
    tag: "Takes 2 Minutes",
    title: "Fill Out the Form",
    body: "Share your current website URL and what you want to improve. Tell us what is frustrating about the current site.",
  },
  {
    number: "2",
    tag: "Within 48 Hours",
    title: "We Design Your Homepage",
    body: "Our team crafts a custom, high-converting redesign concept for your business — complete with desktop and mobile views.",
  },
  {
    number: "3",
    tag: "Straight to Your Inbox",
    title: "Check Your Private Portal",
    body: "You receive an email and SMS with your private link so you can see exactly how it looks, loads, and converts.",
  },
  {
    number: "4",
    tag: "No Strings Attached",
    title: "Decide What's Next",
    body: "Love the design? We can launch the full website for you with custom domain setup. Not ready? Keep the concept 100% free of charge.",
  },
];

export function LeadEngineLanding() {
  return (
    <div className="min-h-screen bg-[#070913] text-white font-sans antialiased selection:bg-[#ff1744] selection:text-white">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070913]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#ff1744] to-[#ff5252] text-white font-black text-lg shadow-md">
              B
            </span>
            <span className="font-bold text-lg tracking-tight text-white">
              Barakah<span className="text-[#ff1744]">Soft</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <a href="#examples" className="hover:text-white transition">Examples</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#what-you-get" className="hover:text-white transition">What You Get</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <a href="tel:+13075336678" className="hover:text-[#ff1744] transition flex items-center gap-1.5 normal-case font-bold text-sm">
              <Phone className="h-3.5 w-3.5 text-[#ff1744]" /> +1 (307) 533-6678
            </a>
          </nav>

          <a
            href="#top"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ff1744] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#d50000] hover:scale-105"
          >
            Get My Free Redesign
          </a>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="top" className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Glow Gradients */}
        <div className="pointer-events-none absolute left-1/2 -top-40 -translate-x-1/2 h-[32rem] w-[50rem] rounded-full bg-gradient-to-b from-[#ff1744]/20 via-[#ff1744]/5 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff1744]/40 bg-[#ff1744]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#ff5252]">
            <span className="flex h-2 w-2 rounded-full bg-[#ff1744] animate-ping" />
            Free Homepage Redesign
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.08]">
            GET YOUR HOMEPAGE <br />
            REDESIGNED <span className="bg-gradient-to-r from-[#ff1744] via-[#ff5252] to-[#ff7979] bg-clip-text text-transparent underline decoration-[#ff1744]/40 underline-offset-8">FOR FREE</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
            See exactly how your homepage could look. We&apos;ll create a custom concept around your real business and deliver it in 48 hours — optimized for Google and AI chatbots to boost your calls and leads. Free, no strings attached.
          </p>

          <div className="pt-4">
            <RedesignIntakeFlow />
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Check className="h-4 w-4 text-[#ff1744]" /> No payment · No obligation
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Check className="h-4 w-4 text-[#ff1744]" /> Google & AI Chatbot Ready
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Check className="h-4 w-4 text-[#ff1744]" /> Limited daily spots available
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Check className="h-4 w-4 text-[#ff1744]" /> Yours to keep forever
            </span>
          </div>
        </div>
      </section>

      {/* 3. "SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE" (GALLERY) */}
      <section id="examples" className="border-t border-white/10 bg-[#0b0e1b] py-24">
        <div className="mx-auto max-w-6xl px-6 space-y-14">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ff1744]">Real Redesigns</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              SEE WHAT YOUR NEW WEBSITE COULD LOOK LIKE
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-400">
              Real homepages we built for real businesses across trades, services, financial, and ecommerce.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REAL_PORTFOLIO_SAMPLES.map((sample) => (
              <div
                key={sample.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#12162a] shadow-xl transition duration-300 hover:-translate-y-1.5 hover:border-[#ff1744]/50"
              >
                {/* Browser Window Header */}
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#171c35] px-4 py-2.5 text-[11px] text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
                  <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 truncate font-mono text-[10px] text-slate-400">{sample.url}</span>
                </div>

                {/* Screenshot Area */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={sample.image}
                    alt={sample.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12162a] via-transparent to-transparent" />
                </div>

                <div className="p-5 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff5252]">
                    {sample.category}
                  </span>
                  <h3 className="font-bold text-base text-white">{sample.title}</h3>
                  <p className="text-xs text-slate-400 truncate">{sample.headline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. "LOOKS GREAT ON MOBILE, TOO" */}
      <section className="border-t border-white/10 bg-[#070913] py-24 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 space-y-14">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ff1744]">Mobile-First Experience</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              LOOKS GREAT ON MOBILE, TOO
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-400">
              Every redesign is built mobile-first. 0.12s first paint with sticky 1-tap call bars so visitors turn into paying customers on their phones.
            </p>
          </div>

          {/* 4 Mobile Handsets */}
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto">
            {MOBILE_MOCKUPS.map((m) => (
              <div
                key={m.title}
                className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-700 bg-slate-950 p-2 shadow-2xl transition duration-300 hover:border-[#ff1744] hover:-translate-y-2"
              >
                {/* Speaker Notch */}
                <div className="mx-auto h-3.5 w-20 rounded-full bg-slate-800 mb-2" />

                <div className="aspect-[9/16] overflow-hidden rounded-[2rem] bg-[#12162a] flex flex-col justify-between p-4 relative">
                  <img
                    src={m.img}
                    alt={m.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                  <div className="relative z-10 space-y-2">
                    <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${m.accent}`}>
                      {m.title}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {m.headline}
                    </h4>
                  </div>

                  <div className="relative z-10 pt-4">
                    <div className="rounded-lg bg-[#ff1744] py-2 text-center text-[10px] font-bold text-white shadow-md">
                      📞 Call Now (1-Tap)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. "FROM FORM TO FRESH DESIGN — IN 48 HOURS" */}
      <section id="how-it-works" className="border-t border-white/10 bg-[#0b0e1b] py-24">
        <div className="mx-auto max-w-5xl px-6 space-y-16">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ff1744]">How It Works</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              FROM FORM TO FRESH DESIGN — IN 48 HOURS
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-400">
              A simple process. No payment, no obligation. Just a professional redesign concept delivered to your inbox.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PROCESS_STEPS.map((s) => (
              <div
                key={s.number}
                className="relative rounded-2xl border border-white/10 bg-[#12162a] p-7 shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff1744]/20 border border-[#ff1744]/40 font-black text-[#ff5252]">
                      {s.number}
                    </span>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-bold text-slate-300">
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff1744] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d50000] hover:scale-105"
            >
              Get My Free Redesign <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 6. "EVERYTHING YOU GET, FREE" */}
      <section id="what-you-get" className="border-t border-white/10 bg-[#070913] py-24">
        <div className="mx-auto max-w-3xl px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              EVERYTHING YOU GET, FREE
            </h2>
            <p className="text-sm text-slate-400">
              We show our work before asking for anything. Love it and want the full site build? Great. Not now? The concept is yours to keep, no strings.
            </p>
          </div>

          <div className="rounded-3xl border border-[#ff1744]/30 bg-gradient-to-b from-[#161a33] to-[#0d1022] p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-bold text-base text-white">Full Free Deliverables</span>
              <span className="rounded-full bg-[#ff1744] px-3 py-1 text-xs font-black text-white uppercase">
                100% Free
              </span>
            </div>

            <div className="space-y-4 text-sm">
              {[
                "Homepage redesign mockup tailored to your real brand & logo",
                "Desktop and mobile-first responsive layout",
                "Conversion-written copy for your services and offers",
                "Delivered to your private tracking portal in 48 hours",
                "Yours to keep forever with zero obligation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-slate-200">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff1744]/20 text-[#ff5252] mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="#top"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff1744] py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-[#d50000]"
              >
                Get My Free Redesign <ArrowRight className="h-4 w-4" />
              </a>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                48h delivery · No credit card · Yours to keep forever
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <FAQAccordion />

      {/* 8. BOTTOM CALL-TO-ACTION BANNER */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#0e1226] to-[#070913] py-20 text-center">
        <div className="mx-auto max-w-3xl px-6 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            READY TO TRANSFORM <br />
            YOUR HOMEPAGE?
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-300">
            Get a professional redesign concept that turns visitors into paying customers. Delivered in 48 hours. Completely free.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#top"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff1744] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-[#d50000] hover:scale-105"
            >
              Get My Free Redesign <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+13075336678"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-[#ff1744]" /> Call +1 (307) 533-6678
            </a>
          </div>
        </div>
      </section>

      <Footer />
      <CrispChat />
    </div>
  );
}
