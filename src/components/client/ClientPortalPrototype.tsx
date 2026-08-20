"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Gauge,
  Globe2,
  HelpCircle,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

// Queens 7x7 Local Grid (49 Measured Checkpoints)
const MAP_POINTS = [
  { id: 1, name: "Astoria North", rank: 14, competitor: "Entech Electrical", status: "missing" },
  { id: 2, name: "Astoria Ditmars", rank: 12, competitor: "Entech Electrical", status: "missing" },
  { id: 3, name: "Long Island City", rank: 18, competitor: "Citywide Power", status: "missing" },
  { id: 4, name: "Sunnyside", rank: 11, competitor: "Brightline Power", status: "missing" },
  { id: 5, name: "Woodside", rank: 8, competitor: "Brightline Power", status: "outside" },
  { id: 6, name: "Jackson Heights", rank: 3, competitor: "York Electrical", status: "visible" },
  { id: 7, name: "East Elmhurst", rank: 15, competitor: "Metro Sparks", status: "missing" },
  { id: 8, name: "Corona Plaza", rank: 2, competitor: "York Electrical", status: "visible" },
  { id: 9, name: "Flushing Main", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 10, name: "Flushing Chinatown", rank: 2, competitor: "York Electrical", status: "visible" },
  { id: 11, name: "Murray Hill", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 12, name: "Broadway Station", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 13, name: "Auburndale", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 14, name: "Bayside West", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 15, name: "Bayside Bell Blvd", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 16, name: "Bay Terrace", rank: 2, competitor: "York Electrical", status: "visible" },
  { id: 17, name: "Whitestone", rank: 1, competitor: "York Electrical", status: "visible" },
  { id: 18, name: "Malba", rank: 5, competitor: "North Shore Electric", status: "outside" },
  { id: 19, name: "College Point", rank: 9, competitor: "Queens Light Co", status: "outside" },
  { id: 20, name: "Rego Park", rank: 16, competitor: "Citywide Power", status: "missing" },
  { id: 21, name: "Forest Hills 71st", rank: 14, competitor: "Citywide Power", status: "missing" },
  { id: 22, name: "Kew Gardens", rank: 19, competitor: "Metro Sparks", status: "missing" },
  { id: 23, name: "Richmond Hill", rank: 22, competitor: "South Queens Wire", status: "missing" },
  { id: 24, name: "Woodhaven", rank: 17, competitor: "South Queens Wire", status: "missing" },
  { id: 25, name: "Ozone Park", rank: 24, competitor: "Crossbay Electric", status: "missing" },
  { id: 26, name: "Howard Beach", rank: 15, competitor: "Crossbay Electric", status: "missing" },
  { id: 27, name: "Middle Village", rank: 11, competitor: "Apex Sparks", status: "missing" },
  { id: 28, name: "Glendale", rank: 13, competitor: "Apex Sparks", status: "missing" },
  { id: 29, name: "Ridgewood", rank: 20, competitor: "Brooklyn Border Pro", status: "missing" },
  { id: 30, name: "Maspeth", rank: 14, competitor: "Industrial Power", status: "missing" },
  { id: 31, name: "Fresh Meadows", rank: 4, competitor: "Northeast Electric", status: "outside" },
  { id: 32, name: "Oakland Gardens", rank: 6, competitor: "Northeast Electric", status: "outside" },
  { id: 33, name: "Little Neck", rank: 7, competitor: "Nassau Border Sparks", status: "outside" },
  { id: 34, name: "Douglaston", rank: 5, competitor: "Nassau Border Sparks", status: "outside" },
  { id: 35, name: "Floral Park", rank: 12, competitor: "Long Island Wire", status: "missing" },
  { id: 36, name: "Bellerose", rank: 14, competitor: "Long Island Wire", status: "missing" },
  { id: 37, name: "Queens Village", rank: 19, competitor: "East Queens Tech", status: "missing" },
  { id: 38, name: "Hollis Hills", rank: 9, competitor: "East Queens Tech", status: "outside" },
  { id: 39, name: "Jamaica Estates", rank: 13, competitor: "Mid-Island Electric", status: "missing" },
  { id: 40, name: "Jamaica Center", rank: 21, competitor: "Metro Sparks", status: "missing" },
  { id: 41, name: "St. Albans", rank: 25, competitor: "Southeast Power", status: "missing" },
  { id: 42, name: "Cambria Heights", rank: 23, competitor: "Southeast Power", status: "missing" },
  { id: 43, name: "Rosedale", rank: 27, competitor: "South Shore Wire", status: "missing" },
  { id: 44, name: "Laurelton", rank: 24, competitor: "South Shore Wire", status: "missing" },
  { id: 45, name: "Springfield Gardens", rank: 26, competitor: "JFK Corridor Elec", status: "missing" },
  { id: 46, name: "Rockaway Beach", rank: 18, competitor: "Seaside Electrical", status: "missing" },
  { id: 47, name: "Belle Harbor", rank: 12, competitor: "Seaside Electrical", status: "missing" },
  { id: 48, name: "Arverne", rank: 20, competitor: "Seaside Electrical", status: "missing" },
  { id: 49, name: "Far Rockaway", rank: 22, competitor: "Atlantic Coast Wire", status: "missing" },
];

const COMPETITOR_BARS = [
  { name: "York Electrical (Rebuilt)", speed: 98, pages: 28 },
  { name: "Entech Electrical", speed: 48, pages: 6 },
  { name: "Brightline Power", speed: 65, pages: 4 },
  { name: "Citywide Power", speed: 40, pages: 8 },
];

const RADAR_DATA = [
  { subject: "Search Coverage", York: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", York: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", York: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", York: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", York: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", York: 100, Competitors: 25, fullMark: 100 },
];

const GOOGLE_PAA_QUESTIONS = [
  {
    q: "Do I need a NYC DOB permit for a 200-amp electrical panel upgrade in Queens?",
    a: "Yes. All panel upgrades in NYC require an electrical permit from the NYC DOB and an official Con Edison meter disconnect inspection. York Electrical handles the entire filing end-to-end.",
    article: "Covered by Launch Article #1",
  },
  {
    q: "How much does a commercial Level 2 EV charger installation cost in NYC?",
    a: "Commercial Level 2 installations typically range from $1,500 to $4,500 depending on conduit run distance, panel capacity, and dedicated 240V breaker needs.",
    article: "Covered by Launch Article #2",
  },
  {
    q: "How fast can an NYC ECB electrical violation be cleared before property sale?",
    a: "A licensed NYC Master Electrician can perform the correction, file a Certificate of Correction with DOB, and clear the violation in 24 to 72 hours.",
    article: "Covered by Launch Article #3",
  },
  {
    q: "What is the ROI of commercial LED lighting retrofits under NYC Local Law 97?",
    a: "Commercial properties reduce lighting energy usage by up to 65%, avoiding LL97 carbon penalties and achieving full payback within 14 to 22 months.",
    article: "Covered by Launch Article #4",
  },
];

export function ClientPortalPrototype() {
  const [selectedPoint, setSelectedPoint] = useState<(typeof MAP_POINTS)[0]>(MAP_POINTS[8]);
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="hidden text-xs font-medium text-[#777588] sm:inline">
              · York Electrical Proposal & X-Ray Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#0b8f5b] inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Proposal Ready
            </span>
            <a
              href="tel:+13075336678"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d1738] transition hover:text-[#533afd]"
            >
              <Phone className="h-3.5 w-3.5 text-[#533afd]" />
              <span>(307) 533-6678</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-16">
        {/* 2. HERO STORY & X-RAY SUMMARY */}
        <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Digital X-Ray & Proposal Ready
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl leading-tight">
            York Electrical Contractors
          </h1>
          
          <p className="max-w-3xl text-base leading-relaxed text-[#42506a] sm:text-lg">
            We performed a deep technical X-Ray of your website, Queens Google search rankings, and local competitors. Your business has an incredible 37-year reputation and 450+ 5-star reviews — but your old website was hiding that proof and leaking customer calls. Here is the verified breakdown and the complete rebuilt platform.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <a
              href="/s/york-electrical"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              Open Live Homepage Preview <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => setShowCheckout(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09744a]"
            >
              Launch Complete Website ($797) <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="border-t border-[#e5e7f2] pt-8">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="rounded-xl bg-[#f0f3ff] p-4 border border-[#e5e7f2]">
                <span className="font-bold text-[#533afd]">Step 1: Done ✓</span>
                <p className="mt-1 text-[#0d1738] font-semibold text-sm">Website X-Ray & Audit</p>
              </div>
              <div className="rounded-xl border-2 border-[#533afd] bg-white p-4 shadow-sm">
                <span className="font-bold text-[#533afd]">Step 2: Current</span>
                <p className="mt-1 text-[#0d1738] font-semibold text-sm">You Review the Solution</p>
              </div>
              <div className="rounded-xl bg-[#f9f9ff] p-4 text-[#777588] border border-[#e5e7f2]">
                <span className="font-bold">Step 3: Next</span>
                <p className="mt-1 font-semibold text-sm">Go-Live in 48 Hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THE WEBSITE X-RAY: 6 VERIFIED FRICTION POINTS VS RESOLUTIONS */}
        <section className="space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Complete Architectural Audit
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
                6 Critical Friction Points Found on Your Old Site & How We Solved Them
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Zap className="h-3.5 w-3.5" /> Direct Solution Mapping
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* PAIN 1 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-base text-[#0d1738]">1. Outdated Mobile Design & Slow Speed</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Target className="h-3 w-3" /> Selected Focus
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Took 8.4s to load on 4G cellular. Users had to pinch-zoom and hunt through menus just to find your emergency phone number.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">0.12s mobile load time with a persistent 1-tap "Call (718) 353-7227" emergency bar fixed to the mobile screen.</p>
                </div>
              </div>
            </div>

            {/* PAIN 2 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <Star className="h-5 w-5 fill-[#ffd12d] text-[#ffd12d]" />
                  <h3 className="font-bold text-base text-[#0d1738]">2. Buried 450+ Google Reviews & NYC License</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Target className="h-3 w-3" /> Selected Focus
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Your strongest trust proof (450+ 5-star reviews & 37-year master license) was hidden at the very bottom of the page where 70% of visitors never scroll.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">Google 5.0 Rating verified badge & Master Lic. #11288 headline proof placed front-and-center before customers bounce.</p>
                </div>
              </div>
            </div>

            {/* PAIN 3 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-base text-[#0d1738]">3. Invisible on Google Across Most of Queens</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Target className="h-3 w-3" /> Selected Focus
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Our 49-point Queens scan showed you rank #1 in Flushing, but are completely missing from Astoria, LIC, Forest Hills, and Jamaica.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">28 localized Queens service landing pages establishing direct geographic search relevance across all target zip codes.</p>
                </div>
              </div>
            </div>

            {/* PAIN 4 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-base text-[#0d1738]">4. Invisible in AI Search (ChatGPT & Gemini)</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Sparkles className="h-3 w-3" /> Audit Discovery
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Zero structured schema. When users ask ChatGPT or Google AI for the best Queens electrician, AI engines cannot verify your license or services.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">Complete LocalBusiness JSON-LD schema & Entity FAQ markup so AI search models verify and cite York Electrical as #1.</p>
                </div>
              </div>
            </div>

            {/* PAIN 5 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <CircleDollarSign className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-base text-[#0d1738]">5. Big Jobs Bundled in 1 Generic Paragraph</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Sparkles className="h-3 w-3" /> Audit Discovery
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">$3,500 panel upgrades and $2,000 EV charger installs were lumped in one single bulleted list, losing all long-tail keyword search volume.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">Dedicated high-ticket landing routes with NYC permit guidance, panel sizing details, and instant quote forms.</p>
                </div>
              </div>
            </div>

            {/* PAIN 6 */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-base text-[#0d1738]">6. Thin Content & Empty Pages</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Sparkles className="h-3 w-3" /> Audit Discovery
                </span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Zero helpful articles explaining NYC electrical codes, DOB violations, or LED retrofit ROI, signaling to search engines that the site was inactive.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-medium">8 original, human-reviewed launch articles so your website has authoritative depth and answers real customer questions from day one.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. GOOGLE AI OVERVIEW & GENERATIVE SEARCH READINESS (GEO) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#533afd]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                  Google AI Overview & Generative Search Readiness (GEO)
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                How Your 8 Launch Articles Answer What Queens Customers Ask Google & ChatGPT
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" /> FAQ Schema Fortified
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {GOOGLE_PAA_QUESTIONS.map((item, idx) => (
              <div key={item.q} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#533afd] uppercase tracking-wider">
                    {item.article}
                  </span>
                  <span className="rounded bg-[#e3dfff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                    Google AI Q&A
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#0d1738]">
                  "{item.q}"
                </h4>
                <div className="rounded-lg bg-white border border-[#e5e7f2] p-3 text-xs text-[#42506a] leading-relaxed">
                  <strong className="text-[#0b8f5b] block mb-1">✓ Rebuilt Direct Answer Snippet:</strong>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. SEO INFRASTRUCTURE & TECHNICAL AUDIT GAUGE */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#533afd]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              SEO & Technical Infrastructure Audit
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0d1738]">
            Full Diagnostic Scorecard: 29/100 Baseline → 95/100 Rebuilt Platform
          </h2>

          <div className="grid gap-6 sm:grid-cols-4 pt-2">
            {[
              { label: "Mobile Speed Score", before: "29/100", after: "98/100", lift: "70× Faster" },
              { label: "Largest Contentful Paint", before: "8.4s (Slow)", after: "0.12s (Instant)", lift: "Top Tier" },
              { label: "Layout Shift (CLS)", before: "0.42 (Jumping)", after: "0.00 (Zero Shift)", lift: "Pixel Stable" },
              { label: "Local Schema Types", before: "0 Schemas", after: "4 Types Active", lift: "AI-Ready" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
                <span className="text-xs font-semibold text-[#777588]">{m.label}</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xs font-mono text-[#ba1a1a] line-through">{m.before}</span>
                  <span className="text-2xl font-bold text-[#0b8f5b]">{m.after}</span>
                </div>
                <span className="mt-1 inline-block rounded bg-[#eaf8f0] px-2 py-0.5 text-[11px] font-bold text-[#0b8f5b]">
                  {m.lift}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. VISUAL SEARCH GRID (QUEENS MAP) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Geographic Visibility Audit
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                Queens 7×7 Local Search Matrix (49 Checkpoints)
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                Query: <span className="font-semibold text-[#0d1738]">"licensed electrician near me"</span>. Click any cell to inspect ranking.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#533afd]">
                <span className="h-3 w-3 rounded-sm bg-[#533afd]" /> Rank #1–3 (Dominant)
              </span>
              <span className="flex items-center gap-1.5 text-[#ba1a1a]">
                <span className="h-3 w-3 rounded-sm bg-[#ffdad6]" /> Rank 11+ (Missing)
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center pt-2">
            {/* Matrix */}
            <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
              <div className="grid grid-cols-7 gap-2">
                {MAP_POINTS.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPoint(pt)}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition ${
                      pt.status === "visible"
                        ? "bg-[#533afd] text-white hover:bg-[#432bd9]"
                        : pt.status === "outside"
                        ? "bg-[#ffe086] text-[#231b00] hover:bg-[#eec218]"
                        : "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]"
                    } ${selectedPoint.id === pt.id ? "ring-2 ring-[#0d1738] scale-105" : ""}`}
                  >
                    {pt.rank}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-[#777588]">
                Coordinates across Flushing, Bayside, Astoria, LIC, Forest Hills, Jamaica
              </p>
            </div>

            {/* Checkpoint Detail */}
            <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-6 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#533afd] uppercase text-xs">Checkpoint #{selectedPoint.id} Inspector</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedPoint.status === "visible" ? "bg-[#eaf8f0] text-[#0b8f5b]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                  Rank #{selectedPoint.rank}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0d1738]">{selectedPoint.name}</h3>
              <p className="text-[#42506a] leading-relaxed">
                {selectedPoint.status === "visible"
                  ? "You dominate this neighborhood in the top 3. Customers find your number immediately."
                  : `Competitor (${selectedPoint.competitor}) takes the calls here. The rebuilt website adds localized pages for ${selectedPoint.name} to capture this volume.`}
              </p>
            </div>
          </div>
        </section>

        {/* 7. COMPETITOR BENCHMARK & RADAR */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Market Competitor Benchmark
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                York Electrical vs. Top 3 Local Competitors
              </h2>
              <p className="text-sm text-[#42506a]">
                How the rebuilt platform puts you ahead in speed, conversion UX, and service route depth.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COMPETITOR_BARS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7f2" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="speed" name="Speed Score (100)" fill="#533afd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pages" name="Service Routes" fill="#0b8f5b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
                  <PolarGrid stroke="#e5e7f2" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#777588", fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="York Electrical (Rebuilt)" dataKey="York" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
                  <Radar name="Competitor Avg" dataKey="Competitors" stroke="#777588" fill="#777588" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 8. TRANSPARENT PRICING & VALUE ANCHORING */}
        <section className="rounded-2xl border-2 border-[#533afd] bg-white p-8 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#e5e7f2] pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Tag className="h-3 w-3" /> Proposal & Launch Pricing
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
                  <Sparkles className="h-3 w-3" /> Save $800 Today
                </span>
              </div>
              <h2 className="mt-2 text-3xl font-bold text-[#0d1738]">
                Complete Website Build & Queens Launch
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                Standard agency value anchored at $1,597 — discounted to $797 for new client onboarding.
              </p>
            </div>

            {/* Price Tag Box */}
            <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
              <span className="text-xs text-[#777588] line-through font-semibold">
                Standard Value: $1,597
              </span>
              <div className="mt-0.5 flex items-baseline gap-1 sm:justify-end">
                <span className="text-4xl font-bold text-[#0d1738]">$797</span>
                <span className="text-xs font-semibold text-[#777588]">USD flat</span>
              </div>
              <span className="text-[11px] font-bold text-[#0b8f5b] block mt-1">
                ✓ 100% Client-Owned · Zero Monthly Lock-in
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {[
              { item: "Rebuilt Modern Homepage built around your real logo, photos, and colors", val: "$400 Value" },
              { item: "28 Dedicated Service Landing Pages (Panel Upgrades, EV Chargers, DOB)", val: "$600 Value" },
              { item: "8 Original Launch Articles written for Queens homeowners (never blank)", val: "$300 Value" },
              { item: "AI Search & LocalBusiness JSON-LD Schema (ChatGPT & Gemini ready)", val: "$150 Value" },
              { item: "0.12s Mobile Load Time with sticky 1-tap emergency call buttons", val: "$100 Value" },
              { item: "Connected to your domain (yorkelectrical.com) with SSL security", val: "Included Free" },
            ].map((d) => (
              <div key={d.item} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b8f5b] mt-0.5" />
                  <span className="font-medium text-[#0d1738] text-xs sm:text-sm">{d.item}</span>
                </div>
                <span className="text-[11px] font-bold text-[#533afd] shrink-0">{d.val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 9. BIG DECISION BOX */}
        <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-12 text-white shadow-lg text-center space-y-6">
          <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Ready to Launch?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Launch Your New Website in 48 Hours
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            No long contracts, no monthly hostage fees. We connect your domain, set up the full 28 pages, and make sure your phone starts ringing.
          </p>

          <div className="pt-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#432bd9]"
            >
              Approve & Launch My Website ($797) <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="tel:+13075336678"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <PhoneCall className="h-4 w-4" /> Call Us with Questions
            </a>
          </div>

          <p className="text-xs text-white/50">
            Backed by our satisfaction review. You only launch if you love the build.
          </p>
        </section>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-[#0d1738] border border-[#e5e7f2]">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0d1738]">Launch York Electrical Website</h3>
                  <p className="text-xs text-[#777588]">One-time flat build payment · Save $800 Today</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="rounded-md p-1.5 text-sm font-bold text-[#777588] hover:bg-[#f0f3ff] hover:text-[#0d1738]"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl bg-[#f0f3ff] p-5 text-xs space-y-3 border border-[#c7d0fb]">
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Scope of Work</span>
                  <span className="font-bold text-[#0d1738]">28 Service Pages + 8 Launch Articles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">AI Search Setup</span>
                  <span className="font-bold text-[#0d1738]">ChatGPT & Gemini Local Schema</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Domain Setup</span>
                  <span className="font-bold text-[#0d1738]">yorkelectrical.com (SSL & DNS Included)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Delivery Time</span>
                  <span className="font-bold text-[#0b8f5b]">48 Hours to Official Go-Live</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Ownership</span>
                  <span className="font-bold text-[#0d1738]">100% You Own All Files</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#c7d0fb] pt-3 text-sm">
                  <div>
                    <span className="font-bold text-[#0d1738] block">Total Due Today</span>
                    <span className="text-[10px] text-[#777588] line-through">Standard Value: $1,597</span>
                  </div>
                  <span className="text-xl font-bold text-[#533afd]">$797.00 USD</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => alert("Directing to secure Stripe Checkout for York Electrical ($797.00 USD)...")}
                  className="w-full rounded-md bg-[#533afd] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#432bd9]"
                >
                  Pay $797 via Card / Apple Pay
                </button>
                <p className="text-center text-[11px] text-[#777588]">
                  🔒 256-bit encrypted checkout via Stripe · Verified BarakahSoft LLC
                </p>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
                >
                  Cancel and review website preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7f2] bg-white py-8 text-center text-xs text-[#777588]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p>© 2026 BarakahSoft LLC · Verified Client Proposal Portal (portal.barakahsoft.com)</p>
          <div className="flex items-center gap-6">
            <a href="tel:+13075336678" className="hover:text-[#533afd] transition font-medium">
              Direct line: +1 (307) 533-6678
            </a>
            <a href="mailto:hello@barakahsoft.com" className="hover:text-[#533afd] transition font-medium">
              hello@barakahsoft.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
