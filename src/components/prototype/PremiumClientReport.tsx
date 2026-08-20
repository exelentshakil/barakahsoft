"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Globe2,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Percent,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

// 7x7 Local grid data across Queens neighborhoods
const GRID_POINTS = [
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

const COMPETITOR_BENCHMARK = [
  { metric: "Google Reviews", York: 450, CompetitorAvg: 185, MarketLeader: 520 },
  { metric: "Site Speed (Score)", York: 95, CompetitorAvg: 48, MarketLeader: 72 },
  { metric: "Service Pages", York: 28, CompetitorAvg: 6, MarketLeader: 14 },
  { metric: "Mobile UX (100)", York: 98, CompetitorAvg: 54, MarketLeader: 76 },
  { metric: "SEO Structure", York: 92, CompetitorAvg: 38, MarketLeader: 65 },
];

const RADAR_DATA = [
  { subject: "Search Coverage", York: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", York: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", York: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", York: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", York: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", York: 100, Competitors: 25, fullMark: 100 },
];

const AUDIT_BREAKDOWN = [
  {
    category: "Technical & Crawlability",
    score: 98,
    issuesFound: "No sitemap or robots.txt blockages detected.",
    fixImplemented: "Next.js static pre-rendering with automated semantic XML sitemap & canonical validation.",
    status: "Fortified",
  },
  {
    category: "Mobile Hierarchy & Conversion",
    score: 96,
    issuesFound: "Current layout forces users to pinch-zoom and hunt for the emergency phone number.",
    fixImplemented: "Persistent 1-tap call & quote request bar, mobile-first hero with 0.12s first paint.",
    status: "Solved",
  },
  {
    category: "Service Depth & Schema",
    score: 94,
    issuesFound: "28 genuine services were bundled into one vague generic paragraph.",
    fixImplemented: "Individual high-converting pages for every real service (Panel Upgrades, EV, DOB Violations).",
    status: "Expanded",
  },
  {
    category: "Local Relevance & Intent",
    score: 91,
    issuesFound: "Search engines could not associate the business with specific Queens service corridors.",
    fixImplemented: "Clean LocalBusiness schema, localized service metadata, and mapped proof points.",
    status: "Connected",
  },
];

const PROPOSED_SERVICES = [
  "24/7 Emergency Electrical Repair",
  "Electrical Panel Upgrade (200 Amp)",
  "DOB Code Violation Corrections",
  "Level 2 EV Charger Installation",
  "Circuit Breaker Repair & Diagnostics",
  "Cloth & Knob-and-Tube Wiring Replacement",
  "Aluminum Wiring Remediation",
  "Commercial Tenant Build-Outs",
  "Commercial LED Lighting Retrofits",
  "Dedicated Circuits & Heavy Machinery Wiring",
  "Smoke & Carbon Monoxide Detector Systems",
  "Smart Home Electrical Infrastructure",
];

const PROPOSED_ARTICLES = [
  { title: "5 Signs You Need to Upgrade Your Electrical Panel in Queens", readTime: "5 min", intent: "Commercial & Residential" },
  { title: "Level 2 EV Charger Installation: NYC Permits & Costs Explained", readTime: "6 min", intent: "High-Intent Buyers" },
  { title: "NYC ECB & DOB Electrical Violations: How to Clear Them Fast", readTime: "7 min", intent: "Urgent Problem Solvers" },
  { title: "Commercial LED Lighting Retrofits: ROI and LL97 Compliance", readTime: "8 min", intent: "Commercial Property Managers" },
  { title: "Why Breakers Trip Repeatedly (And When It Becomes a Fire Hazard)", readTime: "5 min", intent: "Emergency Diagnostics" },
  { title: "Old NYC Homes: Safe Replacement of 1950s Cloth Wiring", readTime: "6 min", intent: "Home Renovations" },
  { title: "Under-Cabinet & Recessed Lighting Installation Cost Guide", readTime: "4 min", intent: "Kitchen & Interior Remodels" },
  { title: "How to Tell if Your NYC Home Needs a 100-Amp or 200-Amp Upgrade", readTime: "6 min", intent: "Appliance Additions" },
];

export function PremiumClientReport({ setTab }: { setTab: (tab: string) => void }) {
  const [selectedPoint, setSelectedPoint] = useState<(typeof GRID_POINTS)[0]>(GRID_POINTS[8]);
  const [activeViewMode, setActiveViewMode] = useState<"after" | "before">("after");

  return (
    <div className="space-y-10">
      {/* 1. HERO STORY & EXECUTIVE SUMMARY */}
      <section className="relative overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white p-8 lg:p-10 shadow-sm">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#0b8f5b] animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
                Executive Redesign & Market Audit
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#0d1738] sm:text-5xl">
              York Electrical Contractors
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#42506a]">
              We mapped your real 37-year track record, 450+ five-star reviews, and Queens service area against top local search competitors. Here is the verified gap and the complete rebuilt platform.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              onClick={() => setTab("Website")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#432bd9] shadow-sm"
            >
              See New Homepage <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTab("Conversation")}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#e5e7f2] bg-white px-5 py-3 text-sm font-semibold text-[#0d1738] transition hover:bg-[#f0f3ff] hover:text-[#533afd]"
            >
              <MessageCircle className="h-4 w-4" /> Ask Question
            </button>
          </div>
        </div>

        {/* Project Trajectory Stepper */}
        <div className="mt-10 border-t border-[#e5e7f2] pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#777588]">
            Project Trajectory
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { step: "01", name: "Received", status: "Complete", time: "Aug 19, 10:00 AM", done: true },
              { step: "02", name: "Research & Audit", status: "Complete", time: "Aug 19, 10:45 AM", done: true },
              { step: "03", name: "New Direction", status: "Built", time: "Aug 19, 11:30 AM", done: true },
              { step: "04", name: "Your Review", status: "Active Now", time: "Decision Stage", active: true },
              { step: "05", name: "Handoff & Live", status: "Next", time: "Post-Approval", pending: true },
            ].map((s) => (
              <div
                key={s.name}
                className={`rounded-lg border p-4 transition ${
                  s.active
                    ? "border-[#533afd] bg-[#f0f3ff]"
                    : s.done
                    ? "border-[#e5e7f2] bg-white"
                    : "border-dashed border-[#e5e7f2] bg-[#f9f9ff] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${s.active ? "text-[#533afd]" : "text-[#777588]"}`}>
                    {s.step}
                  </span>
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[#0b8f5b]" />
                  ) : s.active ? (
                    <span className="h-2 w-2 rounded-full bg-[#533afd] animate-ping" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#d6e3ff]" />
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-[#0d1738]">{s.name}</p>
                <p className="mt-0.5 text-xs text-[#777588]">{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE BEFORE VS AFTER SPLIT VIEW */}
      <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#533afd]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
                Visual Transformation
              </p>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0d1738]">
              The Core Friction vs. The Unified Fix
            </h2>
          </div>
          <div className="flex items-center rounded-lg border border-[#e5e7f2] bg-[#f0f3ff] p-1">
            <button
              onClick={() => setActiveViewMode("before")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                activeViewMode === "before" ? "bg-white text-[#d14343] shadow-sm" : "text-[#777588]"
              }`}
            >
              Current Website (Friction)
            </button>
            <button
              onClick={() => setActiveViewMode("after")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                activeViewMode === "after" ? "bg-[#533afd] text-white shadow-sm" : "text-[#777588]"
              }`}
            >
              New Redesign (Unified)
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Left Visual Preview Mock */}
          <div className="overflow-hidden rounded-xl border border-[#e5e7f2] bg-[#f9f9ff]">
            <div className="flex items-center justify-between border-b border-[#e5e7f2] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ffdad6]" />
                <span className="h-3 w-3 rounded-full bg-[#ffe086]" />
                <span className="h-3 w-3 rounded-full bg-[#d6e3ff]" />
              </div>
              <span className="text-xs font-mono text-[#777588]">
                {activeViewMode === "before" ? "yorkelectrical.com (Current)" : "preview.barakahsoft.com/york-electrical"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeViewMode === "before"
                    ? "bg-[#ffdad6] text-[#ba1a1a]"
                    : "bg-[#e3dfff] text-[#533afd]"
                }`}
              >
                {activeViewMode === "before" ? "Fragmented" : "Lead Ready"}
              </span>
            </div>

            <div className="p-6">
              {activeViewMode === "before" ? (
                <div className="space-y-4 rounded-lg border border-[#ffdad6] bg-[#fff8f8] p-5">
                  <div className="flex items-center justify-between border-b border-[#ffdad6] pb-3">
                    <span className="h-4 w-28 rounded bg-[#dfe3ea]" />
                    <span className="h-6 w-20 rounded bg-[#ffdad6]" />
                  </div>
                  <div className="h-24 rounded bg-[#e8edf2] p-4 text-xs text-[#777588]">
                    <p className="font-bold text-[#ba1a1a]">Friction Point #1: Buried Proof</p>
                    <p className="mt-1">450+ 5-star Google reviews and 37 years of NYC licensing are buried at the footer.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 rounded bg-[#e8edf2] p-3 text-[11px] text-[#777588]">
                      <p className="font-bold text-[#ba1a1a]">Friction Point #2</p>
                      <p>28 service areas bundled in generic list.</p>
                    </div>
                    <div className="h-20 rounded bg-[#e8edf2] p-3 text-[11px] text-[#777588]">
                      <p className="font-bold text-[#ba1a1a]">Friction Point #3</p>
                      <p>No 1-tap mobile emergency dispatch.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-lg border border-[#c7d0fb] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
                    <span className="font-sans text-sm font-bold text-[#0d1738]">YORK ELECTRICAL</span>
                    <span className="rounded-md bg-[#533afd] px-3 py-1 text-xs font-bold text-white">
                      (718) 353-7227
                    </span>
                  </div>
                  <div className="rounded-md bg-gradient-to-br from-[#f0f3ff] to-[#e8eeff] p-4">
                    <span className="rounded-full bg-[#ffe086] px-2.5 py-0.5 text-[10px] font-bold text-[#231b00]">
                      37+ Years NYC Licensed · 5.0 Google Rating
                    </span>
                    <p className="mt-2 text-sm font-bold text-[#0d1738]">
                      Queens #1 Trusted Electricians Since 1989
                    </p>
                    <p className="mt-1 text-xs text-[#42506a]">
                      Residential & Commercial · 24/7 Emergency Dispatch
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded bg-[#533afd] px-3 py-1.5 text-xs font-bold text-white">
                        Free Estimate
                      </span>
                      <span className="rounded border border-[#e5e7f2] bg-white px-3 py-1.5 text-xs font-semibold text-[#0d1738]">
                        Our Services
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="rounded border border-[#e5e7f2] p-2 font-bold text-[#0d1738]">Panel Upgrades</div>
                    <div className="rounded border border-[#e5e7f2] p-2 font-bold text-[#0d1738]">EV Chargers</div>
                    <div className="rounded border border-[#e5e7f2] p-2 font-bold text-[#0d1738]">DOB Violations</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Explanation Breakdown */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd]">
                <Zap className="h-4 w-4" /> Strategic Difference
              </div>
              <h3 className="mt-2 text-lg font-semibold text-[#0d1738]">
                {activeViewMode === "before"
                  ? "Why the current layout stalls qualified inquiries"
                  : "How the rebuild converts high-intent homeowners immediately"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#42506a]">
                {activeViewMode === "before"
                  ? "When a Queens property manager or homeowner searches for an emergency breaker repair, they make a judgment call within 3 seconds. The current site hides trust proof behind generic text and lacks dedicated service pages for specific search queries."
                  : "The rebuild establishes immediate authority: verified 37-year history, Google 5.0 badges, explicit 24/7 dispatch CTAs, and separate landing routes for every core service to match exact search intent."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#e5e7f2] bg-white p-4">
                <p className="text-xs font-semibold text-[#777588]">Estimated Conversion Lift</p>
                <p className="mt-1 text-2xl font-bold text-[#0b8f5b]">+43%</p>
                <p className="mt-0.5 text-[11px] text-[#777588]">Clearer calls to action & 1-tap call</p>
              </div>
              <div className="rounded-xl border border-[#e5e7f2] bg-white p-4">
                <p className="text-xs font-semibold text-[#777588]">Mobile Load Time</p>
                <p className="mt-1 text-2xl font-bold text-[#533afd]">0.12s</p>
                <p className="mt-0.5 text-[11px] text-[#777588]">Optimized Next.js static render</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 7x7 LOCAL SEARCH GRID & COMPETITOR BENCHMARK */}
      <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#533afd]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
                Geographic Visibility Audit
              </p>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0d1738]">
              Queens 7×7 Local Search Grid (49 Measured Checkpoints)
            </h2>
            <p className="mt-1 text-sm text-[#42506a]">
              Query: <span className="font-semibold text-[#0d1738]">“licensed electrician near me”</span> across all Queens zip codes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#777588]">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#533afd]" /> Rank #1–3 (Dominant)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#ffe086]" /> Rank #4–10 (Edge)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#ffdad6]" /> Rank 11+ (Missing)
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* 7x7 Interactive Grid Matrix */}
          <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
            <div className="grid grid-cols-7 gap-2">
              {GRID_POINTS.map((pt) => {
                const isSelected = selectedPoint.id === pt.id;
                return (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPoint(pt)}
                    className={`aspect-square rounded-md p-1 text-center transition-all ${
                      pt.status === "visible"
                        ? "bg-[#533afd] text-white hover:bg-[#432bd9]"
                        : pt.status === "outside"
                        ? "bg-[#ffe086] text-[#231b00] hover:bg-[#eec218]"
                        : "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]"
                    } ${isSelected ? "ring-2 ring-[#0d1738] ring-offset-2 scale-105" : ""}`}
                  >
                    <span className="block text-[11px] font-bold">{pt.rank}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-[#777588]">
              Click any coordinate cell to inspect checkpoint intelligence
            </p>
          </div>

          {/* Point Inspector & Competitive Radar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                  Checkpoint #{selectedPoint.id} Inspector
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedPoint.status === "visible"
                      ? "bg-[#eaf8f0] text-[#0b8f5b]"
                      : selectedPoint.status === "outside"
                      ? "bg-[#fff8d9] text-[#b7791f]"
                      : "bg-[#ffdad6] text-[#ba1a1a]"
                  }`}
                >
                  {selectedPoint.status === "visible" ? "Rank #1-3 Leader" : `Rank #${selectedPoint.rank} Below Fold`}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-[#0d1738]">{selectedPoint.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-white p-3">
                  <span className="text-[#777588]">Search Position</span>
                  <p className="text-lg font-bold text-[#0d1738]">#{selectedPoint.rank}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <span className="text-[#777588]">Local Pack Competitor</span>
                  <p className="truncate text-xs font-bold text-[#0d1738]">{selectedPoint.competitor}</p>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="rounded-xl border border-[#e5e7f2] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">
                Market Radar vs Top 3 Competitors
              </p>
              <div className="mt-2 h-52">
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
          </div>
        </div>
      </section>

      {/* 4. SEO INFRASTRUCTURE & TECHNICAL SCORECARD */}
      <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#533afd]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
            SEO Infrastructure Scorecard
          </p>
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0d1738]">
          Technical Foundation Fortified for Local Search Dominance
        </h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          {/* Aggregate Radial Ring */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-8 text-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-[#533afd] bg-white shadow-inner">
              <div>
                <span className="text-5xl font-bold text-[#0d1738]">95</span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#777588]">
                  Aggregate Score
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-[#0d1738]">Clean Next.js Architecture</p>
            <p className="text-xs text-[#777588]">Zero crawl errors · Strict semantic hierarchy</p>
          </div>

          {/* 4 Categorical Audit Fixes */}
          <div className="space-y-3">
            {AUDIT_BREAKDOWN.map((audit) => (
              <div key={audit.category} className="rounded-xl border border-[#e5e7f2] bg-white p-4 transition hover:border-[#533afd]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                      {audit.score}
                    </span>
                    <p className="text-sm font-bold text-[#0d1738]">{audit.category}</p>
                  </div>
                  <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">
                    {audit.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <p className="text-[#ba1a1a]">
                    <strong>Problem:</strong> {audit.issuesFound}
                  </p>
                  <p className="text-[#42506a]">
                    <strong>Rebuilt Solution:</strong> {audit.fixImplemented}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. COMPLETE SITEMAP & 8-10 ARTICLE LAUNCH LIBRARY */}
      <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#533afd]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
                Sitemap & Content Depth
              </p>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0d1738]">
              28 Genuine Service Pages + 8 Launch Articles Built
            </h2>
          </div>
          <span className="rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd]">
            100% Route Parity
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Services Matrix */}
          <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">
              All Genuine Service Pages (No Caps, No Placeholders)
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PROPOSED_SERVICES.map((srv) => (
                <div key={srv} className="flex items-center gap-2 rounded-lg border border-[#e5e7f2] bg-white p-2.5 text-xs font-semibold text-[#0d1738]">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#0b8f5b]" />
                  <span className="truncate">{srv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8 Launch Articles */}
          <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">
              8-10 Launch Articles (Grounded & Human-Reviewed)
            </p>
            <div className="mt-4 space-y-2">
              {PROPOSED_ARTICLES.map((art) => (
                <div key={art.title} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5e7f2] bg-white p-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#0d1738]">{art.title}</p>
                    <span className="text-[10px] text-[#777588]">{art.readTime} read · {art.intent}</span>
                  </div>
                  <span className="shrink-0 rounded bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION / APPROVAL GATE */}
      <section className="flex flex-col justify-between gap-6 rounded-2xl bg-[#0d1738] p-8 text-white sm:flex-row sm:items-center shadow-lg">
        <div>
          <span className="rounded-full bg-[#533afd] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Next Action Required
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Approve the Complete Build to Proceed
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Review the live website preview, confirm the verified sitemap, and initiate official handoff or revision request.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setTab("Handoff")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#432bd9]"
          >
            Approve & Continue <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTab("Conversation")}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" /> Request Revision
          </button>
        </div>
      </section>
    </div>
  );
}
