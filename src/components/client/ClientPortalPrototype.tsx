"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Globe2,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
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
  { name: "York Electrical (Rebuilt)", speed: 98, pages: 28, score: 95 },
  { name: "Entech Electrical", speed: 48, pages: 6, score: 62 },
  { name: "Brightline Power", speed: 65, pages: 4, score: 58 },
  { name: "Citywide Power", speed: 40, pages: 8, score: 45 },
];

const PROPOSED_SERVICES = [
  "24/7 Emergency Electrical Repair",
  "Electrical Panel Upgrade (200 Amp)",
  "DOB Code Violation Corrections",
  "Level 2 EV Charger Installation",
  "Circuit Breaker Repair & Diagnostics",
  "Cloth & Knob-and-Tube Rewiring",
  "Aluminum Wiring Remediation",
  "Commercial Tenant Build-Outs",
  "Commercial LED Lighting Retrofits",
  "Dedicated Heavy Appliance Circuits",
  "Smoke & CO Detector Upgrades",
  "Smart Home Wiring Infrastructure",
];

const PROPOSED_ARTICLES = [
  { title: "5 Signs You Need to Upgrade Your Electrical Panel in Queens", readTime: "5 min", intent: "Residential & Commercial" },
  { title: "Level 2 EV Charger Installation: NYC Permits & Costs Explained", readTime: "6 min", intent: "High-Intent Buyers" },
  { title: "NYC ECB & DOB Electrical Violations: How to Clear Them Fast", readTime: "7 min", intent: "Urgent Compliance" },
  { title: "Commercial LED Lighting Retrofits: ROI and LL97 Compliance", readTime: "8 min", intent: "Property Managers" },
];

export function ClientPortalPrototype() {
  const [selectedPoint, setSelectedPoint] = useState<(typeof MAP_POINTS)[0]>(MAP_POINTS[8]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"after" | "before">("after");

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="hidden text-xs font-semibold text-[#777588] sm:inline">
              · York Electrical Proposal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Concept Ready
            </span>
            <a
              href="tel:+13075336678"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d1738] hover:text-[#533afd]"
            >
              <Phone className="h-3.5 w-3.5 text-[#533afd]" />
              <span>(307) 533-6678</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 space-y-12">
        {/* 2. HERO STORY */}
        <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Your Free Redesign Is Ready
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl">
            York Electrical Contractors
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#42506a] sm:text-lg">
            We mapped your real 37-year history, NYC license #11288, and 450+ 5-star Google reviews against top local competitors. Here is the verified gap and the rebuilt platform that fixes it.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/s/york-electrical"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              Open Live Homepage Preview <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => setShowCheckout(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#09744a]"
            >
              Launch Complete Website ($797) <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="mt-10 border-t border-[#e5e7f2] pt-6">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-[#f0f3ff] p-3">
                <span className="font-bold text-[#533afd]">Step 1: Complete ✓</span>
                <p className="mt-1 text-[#0d1738] font-semibold">Free Redesign & Audit</p>
              </div>
              <div className="rounded-lg border-2 border-[#533afd] bg-white p-3 shadow-sm">
                <span className="font-bold text-[#533afd]">Step 2: Current</span>
                <p className="mt-1 text-[#0d1738] font-semibold">Review the Solution</p>
              </div>
              <div className="rounded-lg bg-[#f9f9ff] p-3 text-[#777588]">
                <span className="font-bold">Step 3: Next</span>
                <p className="mt-1 font-semibold">Launch & Capture Calls</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SOLVING ALL 6 INTAKE PAIN POINTS DIRECTLY */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Direct Problem-to-Solution Mapping
            </span>
            <h2 className="mt-1 text-2xl font-bold text-[#0d1738] sm:text-3xl">
              How the Rebuilt Platform Solves Your 6 Core Pains
            </h2>
            <p className="mt-1 text-sm text-[#42506a]">
              Every issue selected during intake paired directly with its architectural resolution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* PAIN 1: Outdated Design / Looks Wrong on Phones */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-[#0d1738]">1. Outdated Design & Mobile Friction</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> Old site took 8.4s to load on 4G. Users had to pinch-zoom and hunt through menus for the emergency phone number.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> 0.12s mobile load time with a persistent 1-tap "Call (718) 353-7227" emergency bar on every screen.
                </p>
              </div>
            </div>

            {/* PAIN 2: Visitors Don't Convert into Calls */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-[#ffd12d] text-[#ffd12d]" />
                  <h3 className="font-bold text-[#0d1738]">2. Visitors Leaving Without Calling</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> 450+ 5-star Google reviews and 37 years of NYC licensing were hidden at the very bottom of the page.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> Google 5.0 Verified badge & Master Lic. #11288 headline proof placed where customers decide to call.
                </p>
              </div>
            </div>

            {/* PAIN 3: Nobody Finds Us on Google */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-[#0d1738]">3. Nobody Finds Us on Google Search</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> 49 Queens scan checkpoints showed rank #1 in Flushing, but missing from Astoria, LIC, and Forest Hills.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> 28 localized Queens service pages establishing direct geographic relevance across all target zip codes.
                </p>
              </div>
            </div>

            {/* PAIN 4: Invisible in AI Search (ChatGPT / Gemini) */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-[#0d1738]">4. Invisible in AI Search (ChatGPT & Gemini)</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> Zero structured schema. AI chatbots could not verify services, license numbers, or service areas.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> Complete LocalBusiness JSON-LD schema & Entity FAQ markup so AI search models cite York Electrical as #1.
                </p>
              </div>
            </div>

            {/* PAIN 5: Not Enough Leads or Big Jobs */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-[#0d1738]">5. Not Enough High-Ticket Inquiries</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> $3,500 panel upgrades and $2,000 EV charger installs were bundled in one generic bullet list.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> Dedicated landing routes with permit details, pricing guidance, and commercial quote forms.
                </p>
              </div>
            </div>

            {/* PAIN 6: Content Depth & Blank Site */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#533afd]" />
                  <h3 className="font-bold text-[#0d1738]">6. Thin Content & Empty Pages</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">Solved</span>
              </div>
              <div className="space-y-2 text-xs">
                <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-3 text-[#ba1a1a]">
                  <strong>Before (Friction):</strong> Zero blog articles explaining NYC electrical codes, DOB violations, or LED retrofit ROI.
                </p>
                <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-3 text-[#0b8f5b]">
                  <strong>Rebuilt Solution:</strong> 8 original, human-reviewed launch articles so your website has authoritative depth from day one.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. VISUAL SEARCH GRID (QUEENS MAP) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
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
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#533afd]">
                <span className="h-3 w-3 rounded-sm bg-[#533afd]" /> Rank #1–3 (Dominant)
              </span>
              <span className="flex items-center gap-1.5 text-[#ba1a1a]">
                <span className="h-3 w-3 rounded-sm bg-[#ffdad6]" /> Rank 11+ (Missing)
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
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
              <p className="mt-3 text-center text-xs text-[#777588]">
                Coordinates across Flushing, Bayside, Astoria, LIC, Forest Hills, Jamaica
              </p>
            </div>

            {/* Checkpoint Detail */}
            <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-6 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#533afd] uppercase text-xs">Checkpoint #{selectedPoint.id} Inspector</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${selectedPoint.status === "visible" ? "bg-[#eaf8f0] text-[#0b8f5b]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                  Rank #{selectedPoint.rank}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#0d1738]">{selectedPoint.name}</h3>
              <p className="text-[#42506a] leading-relaxed">
                {selectedPoint.status === "visible"
                  ? "You dominate this neighborhood in the top 3. Customers find your number immediately."
                  : `Competitor (${selectedPoint.competitor}) takes the calls here. The rebuilt website adds localized pages for ${selectedPoint.name} to capture this volume.`}
              </p>
            </div>
          </div>
        </section>

        {/* 5. COMPETITOR BENCHMARK */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Market Benchmark
          </span>
          <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
            York Electrical vs. Top 3 Local Competitors
          </h2>
          <p className="mt-1 text-sm text-[#42506a]">
            How the rebuilt platform puts you ahead in speed, UX, and service route depth.
          </p>

          <div className="mt-6 h-60 w-full">
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
        </section>

        {/* 6. COMPLETE PACKAGE CHECKLIST */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end border-b border-[#e5e7f2] pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Complete Scope of Work
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                Everything Included in Your New Website
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl font-bold text-[#0d1738]">$797</span>
              <span className="text-xs text-[#777588] block">Flat one-time price · 100% You Own All Files</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            {[
              "Rebuilt Modern Homepage built around your real logo, photos, and colors",
              "28 Dedicated Pages for all your real services (Panel Upgrades, EV Chargers, DOB)",
              "8 Original Launch Articles written for Queens homeowners (never blank)",
              "AI Search & LocalBusiness JSON-LD Schema (ChatGPT & Gemini ready)",
              "0.12s Mobile Load Time with sticky 1-tap emergency call buttons",
              "Connected to your domain (yorkelectrical.com) with SSL security",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0b8f5b] mt-0.5" />
                <span className="font-semibold text-[#0d1738]">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. BIG DECISION BOX */}
        <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-10 text-white shadow-lg text-center space-y-6">
          <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Ready to Launch?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Launch Your New Website in 48 Hours
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            No long contracts, no monthly hostage fees. We connect your domain, set up the full 28 pages, and make sure your phone starts ringing.
          </p>

          <div className="pt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                  <p className="text-xs text-[#777588]">One-time flat build payment · Zero recurring lock-in</p>
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
                  <span className="font-bold text-[#0d1738]">Total Due Today</span>
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
        <p>© 2026 BarakahSoft LLC · Direct line: +1 (307) 533-6678 · hello@barakahsoft.com</p>
      </footer>
    </div>
  );
}
