"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Gauge,
  Globe2,
  HelpCircle,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Terminal,
  Upload,
  Users,
  WandSparkles,
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
import { PremiumAdminHome } from "@/components/prototype/PremiumAdminHome";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

type View = "Overview" | "Lead workspace" | "Reports" | "Communications" | "Delivery" | "Settings";

const SITEMAP_ROUTES = [
  { path: "/", label: "Homepage", type: "Core", status: "Approved", words: "1,450 words" },
  { path: "/services", label: "Services Hub", type: "Core", status: "Approved", words: "850 words" },
  { path: "/about", label: "About Us (37y Story)", type: "Core", status: "Approved", words: "920 words" },
  { path: "/contact", label: "Contact & Dispatch", type: "Core", status: "Approved", words: "450 words" },
  { path: "/blog", label: "Blog Library Index", type: "Core", status: "Approved", words: "350 words" },
  { path: "/services/emergency-electrician-queens-ny", label: "24/7 Emergency Dispatch", type: "Service", status: "Approved", words: "1,120 words" },
  { path: "/services/electrical-panel-upgrade-queens-ny", label: "Panel Upgrade (200 Amp)", type: "Service", status: "Approved", words: "1,250 words" },
  { path: "/services/electrical-code-violation-corrections-queens-ny", label: "DOB Violation Corrections", type: "Service", status: "Approved", words: "980 words" },
  { path: "/services/ev-charger-installation-queens-ny", label: "Level 2 EV Charger Install", type: "Service", status: "Approved", words: "1,050 words" },
  { path: "/services/commercial-electrician-queens-ny", label: "Commercial Tenant Fit-Outs", type: "Service", status: "Approved", words: "1,350 words" },
  { path: "/services/circuit-breaker-repair-queens-ny", label: "Circuit Breaker Diagnostics", type: "Service", status: "Approved", words: "890 words" },
  { path: "/services/electrical-rewiring-queens-ny", label: "Complete House Rewiring", type: "Service", status: "Approved", words: "1,400 words" },
  { path: "/blog/signs-you-need-electrical-panel-upgrade", label: "Signs You Need Panel Upgrade", type: "Article", status: "Approved", words: "1,200 words" },
  { path: "/blog/level-2-ev-charger-installation-queens-ny", label: "Level 2 EV Installation Guide", type: "Article", status: "Approved", words: "1,450 words" },
  { path: "/blog/nyc-ecb-electrical-violations-guide", label: "NYC ECB Violations Guide", type: "Article", status: "Approved", words: "1,100 words" },
  { path: "/blog/commercial-led-lighting-retrofit-roi", label: "Commercial LED Retrofit ROI", type: "Article", status: "Approved", words: "1,300 words" },
];

const MAP_GRID = [
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

const COMPETITOR_BAR_DATA = [
  { name: "York (Rebuilt)", speed: 95, ux: 98, pages: 28 },
  { name: "Entech Electrical", speed: 48, ux: 54, pages: 6 },
  { name: "Brightline Power", speed: 65, ux: 60, pages: 4 },
  { name: "Citywide Power", speed: 40, ux: 45, pages: 8 },
];

const RADAR_DATA = [
  { subject: "Search Coverage", York: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", York: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", York: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", York: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", York: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", York: 100, Competitors: 25, fullMark: 100 },
];

const ISSUES_FIXES = [
  {
    title: "Buried Trust & Licensing Proof",
    beforeIssue: "450+ 5-star reviews and NYC license #11288 are buried at the bottom of the page.",
    revenueImpact: "Commercial buyers bounce within 3s assuming it's an unvetted handyman service.",
    afterSolution: "Authority hero featuring verified 37-year history, Google 5.0 badges, and license #11288.",
  },
  {
    title: "Generic Single-Paragraph Services",
    beforeIssue: "28 genuine services (Panel Upgrades, EV, DOB Violations) are bundled in 1 bulleted list.",
    revenueImpact: "Zero search rank for high-intent long-tail keywords ($3,500 panel upgrade jobs lost).",
    afterSolution: "Individual high-converting pages for every real service with localized Queens schema.",
  },
  {
    title: "Disconnected Content & Zero Cross-Links",
    beforeIssue: "Helpful blog articles exist but have zero internal links or CTAs to booking forms.",
    revenueImpact: "Blog visitors read and leave without taking a commercial action.",
    afterSolution: "Automated related services cards, quote triggers, and search-intent internal cross-links.",
  },
  {
    title: "Mobile Friction on Phone Links",
    beforeIssue: "Mobile users must pinch-zoom and hunt through navigation for the emergency phone number.",
    revenueImpact: "Emergency 24/7 call inquiries lost to nearby competitors on mobile search.",
    afterSolution: "Persistent 1-tap call bar, mobile-first typography, and 0.12s first contentful paint.",
  },
];

function Sidebar({ view, setView }: { view: View; setView: (view: View) => void }) {
  const links: [typeof LayoutDashboard, string, View][] = [
    [LayoutDashboard, "Command Center", "Overview"],
    [Users, "Lead Workspace", "Lead workspace"],
    [BarChart3, "Reports & Audits", "Reports"],
    [Send, "Communications", "Communications"],
    [PackageCheck, "Delivery & Exports", "Delivery"],
    [Settings2, "Settings", "Settings"],
  ];

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#e5e7f2] bg-white text-[#0d1738] lg:block">
      <div className="flex h-16 items-center border-b border-[#e5e7f2] px-6">
        <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
      </div>

      <div className="p-4 border-b border-[#e5e7f2] bg-[#f9f9ff]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">Current Lead</span>
        <div className="mt-1 flex items-center justify-between">
          <p className="font-bold text-[#0d1738]">York Electrical</p>
          <span className="rounded-full bg-[#e3dfff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
            Priority
          </span>
        </div>
      </div>

      <nav className="space-y-1 px-4 py-6">
        {links.map(([Icon, label, target]) => (
          <button
            key={label}
            onClick={() => setView(target)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
              view === target
                ? "bg-[#e3dfff] text-[#533afd]"
                : "text-[#42506a] hover:bg-[#f0f3ff] hover:text-[#533afd]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}

        <Link
          href="/client-portal-prototype"
          className="mt-6 flex w-full items-center gap-3 rounded-lg border border-[#e5e7f2] px-3 py-2.5 text-sm font-semibold text-[#42506a] transition hover:bg-[#f0f3ff] hover:text-[#533afd]"
        >
          <Globe2 className="h-4 w-4" />
          Open Client Portal
        </Link>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-[#e5e7f2] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-[#f0f3ff] p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-xs font-bold text-white">
            SA
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0d1738]">Shakil Ahmed</p>
            <p className="text-xs text-[#777588]">Owner Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header({ view }: { view: View }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5e7f2] bg-white px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <Menu className="h-5 w-5 lg:hidden text-[#0d1738]" />
        <div>
          <p className="text-sm font-bold text-[#0d1738]">{view}</p>
          <p className="text-xs text-[#777588]">York Electrical · Verified Lead Record #LD-2024-893</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-[#e5e7f2] bg-[#f9f9ff] px-3 py-2 text-xs text-[#777588] sm:flex">
          <Search className="h-4 w-4" />
          Search lead assets & routes...
        </div>
        <div className="h-8 w-8 rounded-full bg-[#e3dfff] text-center text-xs font-bold leading-8 text-[#533afd]">
          SA
        </div>
      </div>
    </header>
  );
}

function Workspace() {
  const [section, setSection] = useState("Generation brief");
  const sections = [
    "Generation brief",
    "SEO audit",
    "Map grid",
    "Competitors",
    "Issue vs fix",
    "Sitemap",
    "QA release",
    "How to close",
    "Delivery",
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">
              Warm Lead
            </span>
            <span className="text-xs font-semibold text-[#777588]">Est. Value: $797 Flat</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0d1738]">
            York Electrical — Lead Production Workspace
          </h1>
          <p className="mt-1 text-sm text-[#777588]">
            Complete internal record: verified facts, competitor intelligence, generation brief, sitemap, and closing sequence.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-[#e5e7f2] bg-white px-4 py-2 text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff]">
            Edit Record
          </button>
          <button className="rounded-md bg-[#533afd] px-4 py-2 text-xs font-semibold text-white hover:bg-[#432bd9]">
            Approve for Client
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[#e5e7f2] bg-white p-1.5 shadow-sm">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
              section === s
                ? "bg-[#533afd] text-white"
                : "text-[#42506a] hover:bg-[#f0f3ff] hover:text-[#533afd]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 9 Workspaces Tabs */}
      {section === "Generation brief" && <GenerationBriefTab />}
      {section === "SEO audit" && <SeoAuditTab />}
      {section === "Map grid" && <MapGridTab />}
      {section === "Competitors" && <CompetitorsTab />}
      {section === "Issue vs fix" && <IssueFixTab />}
      {section === "Sitemap" && <SitemapTab />}
      {section === "QA release" && <QaReleaseTab />}
      {section === "How to close" && <HowToCloseTab />}
      {section === "Delivery" && <DeliveryTab />}
    </div>
  );
}

// 1. GENERATION BRIEF TAB
function GenerationBriefTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        {/* Verified Facts & Prohibited Claims */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#533afd]" />
              <h3 className="font-bold text-[#0d1738]">Verified Company Facts</h3>
            </div>
            <span className="rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
              Source: Firecrawl + GBP Verified
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-[#777588]">Legal Business Name</span>
                <p className="font-semibold text-[#0d1738]">York Electrical Contractors Inc.</p>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[#777588]">Core Service Area</span>
                <p className="font-semibold text-[#0d1738]">Queens, NY (Flushing, Bayside, Astoria, LIC)</p>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[#777588]">License & Proof</span>
                <p className="font-semibold text-[#0d1738]">NYC Master Electrician Lic. #11288 · 37+ Years</p>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[#777588]">Target Personas</span>
                <p className="font-semibold text-[#0d1738]">Commercial Property Managers (70%) / High-End Residential (30%)</p>
              </div>
            </div>

            {/* Prohibited Claims Box */}
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f8] p-4 text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#ba1a1a]">
                <ShieldAlert className="h-4 w-4" /> Prohibited Claims (Do Not Use)
              </div>
              <ul className="mt-3 space-y-2 text-[#42506a]">
                <li className="flex items-start gap-2">
                  <span className="text-[#ba1a1a] font-bold">✕</span> Never claim "cheapest prices in NYC".
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ba1a1a] font-bold">✕</span> Never claim 24/7 non-emergency availability.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ba1a1a] font-bold">✕</span> Do not invent unverified statistics.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Content Strategy & Roadmap */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-[#533afd]" />
              <h3 className="font-bold text-[#0d1738]">Content Strategy Plan (8 Launch Articles)</h3>
            </div>
            <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">
              Phase 1 Approved
            </span>
          </div>

          <div className="mt-5 space-y-2 text-xs">
            {[
              { num: "01", title: "When to Upgrade Your Commercial Electrical Panel in NYC", intent: "Bottom Funnel", status: "Drafted" },
              { num: "02", title: "LL97 Compliance: Electrical Retrofits for Manhattan & Queens Buildings", intent: "Informational", status: "Drafted" },
              { num: "03", title: "The ROI of LED Commercial Lighting Upgrades in 2026", intent: "High-Intent", status: "Drafted" },
              { num: "04", title: "Commercial EV Charger Installation: NYC DOB Code Guidelines", intent: "Commercial", status: "Reviewed" },
            ].map((art) => (
              <div key={art.num} className="flex items-center justify-between rounded-lg border border-[#e5e7f2] p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#777588]">{art.num}</span>
                  <span className="font-semibold text-[#0d1738]">{art.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">{art.intent}</span>
                  <span className="rounded bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b]">{art.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Brand Design System */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
          <h3 className="font-bold text-[#0d1738]">Brand Tokens (Firecrawl)</h3>
          <p className="mt-1 text-xs text-[#777588]">Automated design system extraction.</p>

          <div className="mt-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
              <span className="font-semibold text-[#42506a]">Primary Brand Color</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#0d1738]">#F9DB15</span>
                <span className="h-5 w-5 rounded-full border border-black/10 bg-[#F9DB15]" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
              <span className="font-semibold text-[#42506a]">Secondary Dark</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#0d1738]">#2B303B</span>
                <span className="h-5 w-5 rounded-full border border-black/10 bg-[#2B303B]" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
              <span className="font-semibold text-[#42506a]">Typography Stack</span>
              <span className="font-bold text-[#0d1738]">Hanken Grotesk + Inter</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#42506a]">Logo Vector</span>
              <span className="rounded bg-[#f0f3ff] px-2 py-0.5 font-semibold text-[#533afd]">
                york-logo.png
              </span>
            </div>
          </div>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#533afd] bg-[#f0f3ff] p-3 text-xs font-bold text-[#533afd]">
            <Upload className="h-4 w-4" /> Replace branding.json
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. SEO AUDIT TAB
function SeoAuditTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#0d1738]">SEO & Technical Performance Diagnostics</h3>
            <p className="text-xs text-[#777588]">Comparing Current Website baseline vs Rebuilt Next.js platform.</p>
          </div>
          <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
            95/100 Aggregate Health
          </span>
        </div>

        {/* Before vs After Metric Gauges */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Mobile Speed Score", before: "29/100", after: "98/100", lift: "+69 pts" },
            { label: "Largest Contentful Paint", before: "8.4s", after: "0.12s", lift: "70× faster" },
            { label: "Cumulative Layout Shift", before: "0.42", after: "0.00", lift: "Zero shift" },
            { label: "Structured Schema", before: "0 Types", after: "4 Types", lift: "LocalBusiness" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-4">
              <span className="text-xs font-semibold text-[#777588]">{m.label}</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xs font-mono text-[#ba1a1a] line-through">{m.before}</span>
                <span className="text-2xl font-bold text-[#0b8f5b]">{m.after}</span>
              </div>
              <span className="mt-1 inline-block rounded bg-[#eaf8f0] px-1.5 py-0.5 text-[10px] font-bold text-[#0b8f5b]">
                {m.lift}
              </span>
            </div>
          ))}
        </div>

        {/* 10 Critical Fixes Breakdown */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">
            10 Automated Critical Fixes Implemented
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
            {[
              "Added valid LocalBusiness + Electrician JSON-LD schema markup",
              "Pre-rendered 28 separate service routes for targeted search crawling",
              "Implemented webp image compression with fixed dimensions (0 CLS)",
              "Resolved missing canonical tags and XML sitemap auto-generation",
              "Added 1-tap call action for mobile emergency electrical searches",
              "Fortified internal linking between articles and relevant service quotes",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 rounded-lg border border-[#e5e7f2] p-3 bg-white">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b8f5b]" />
                <span className="font-medium text-[#0d1738]">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. MAP GRID TAB
function MapGridTab() {
  const [activePt, setActivePt] = useState(MAP_GRID[8]);

  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Queens 7×7 Local Search Visibility Matrix</h3>
          <p className="text-xs text-[#777588]">
            49 scan checkpoints for "licensed electrician near me". Click any node to inspect rank & competitor.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-[#777588]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#533afd]" /> Top 3 (Dominant)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#ffe086]" /> Rank 4–10</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-[#ffdad6]" /> Rank 11+ (Missing)</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Interactive Grid */}
        <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
          <div className="grid grid-cols-7 gap-2">
            {MAP_GRID.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setActivePt(pt)}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold transition ${
                  pt.status === "visible"
                    ? "bg-[#533afd] text-white"
                    : pt.status === "outside"
                    ? "bg-[#ffe086] text-[#231b00]"
                    : "bg-[#ffdad6] text-[#ba1a1a]"
                } ${activePt.id === pt.id ? "ring-2 ring-[#0d1738] scale-105" : ""}`}
              >
                {pt.rank}
              </button>
            ))}
          </div>
        </div>

        {/* Node Detail Inspector */}
        <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Checkpoint #{activePt.id} Inspector
            </span>
            <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">
              Rank #{activePt.rank}
            </span>
          </div>
          <h4 className="text-lg font-bold text-[#0d1738]">{activePt.name}</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white p-3">
              <span className="text-[#777588]">Search Status</span>
              <p className="font-bold text-[#0d1738]">
                {activePt.status === "visible" ? "Dominant Local Pack" : "Lost to Competitor"}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <span className="text-[#777588]">Top Competitor</span>
              <p className="truncate font-bold text-[#0d1738]">{activePt.competitor}</p>
            </div>
          </div>
          <p className="text-[11px] text-[#42506a]">
            The rebuilt website's dedicated service area pages establish localized relevance to reclaim this search corridor.
          </p>
        </div>
      </div>
    </div>
  );
}

// 4. COMPETITORS TAB
function CompetitorsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
        <h3 className="text-xl font-bold text-[#0d1738]">Competitive Benchmark & Market Positioning</h3>
        <p className="mt-1 text-xs text-[#777588]">Side-by-side comparison across Google Reviews, Speed, and Route Depth.</p>

        <div className="mt-6 h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COMPETITOR_BAR_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e5e7f2" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#777588", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="speed" name="Speed Score" fill="#533afd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pages" name="Service Routes" fill="#0b8f5b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// 5. ISSUE VS FIX TAB
function IssueFixTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Issue vs Fix Architecture</h3>
          <p className="text-xs text-[#777588]">Every problem mapped to revenue consequence and architectural resolution.</p>
        </div>
      </div>

      <div className="space-y-4">
        {ISSUES_FIXES.map((item, idx) => (
          <div key={item.title} className="rounded-xl border border-[#e5e7f2] p-5 transition hover:border-[#533afd]">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                0{idx + 1}
              </span>
              <h4 className="font-bold text-[#0d1738]">{item.title}</h4>
            </div>

            <div className="mt-4 grid gap-4 text-xs sm:grid-cols-3">
              <div className="rounded-lg border border-[#ffdad6] bg-[#fff8f8] p-3">
                <span className="font-bold uppercase tracking-wider text-[#ba1a1a]">Friction</span>
                <p className="mt-1 text-[#42506a]">{item.beforeIssue}</p>
              </div>
              <div className="rounded-lg border border-[#ffe086] bg-[#fffbf0] p-3">
                <span className="font-bold uppercase tracking-wider text-[#735c00]">Revenue Consequence</span>
                <p className="mt-1 text-[#42506a]">{item.revenueImpact}</p>
              </div>
              <div className="rounded-lg border border-[#c7d0fb] bg-[#f0f3ff] p-3">
                <span className="font-bold uppercase tracking-wider text-[#533afd]">Implemented Solution</span>
                <p className="mt-1 text-[#0d1738]">{item.afterSolution}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. SITEMAP TAB
function SitemapTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Sitemap Parity (38 of 38 Generated)</h3>
          <p className="text-xs text-[#777588]">Zero dead navigation or placeholder links.</p>
        </div>
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
          100% Route Parity
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SITEMAP_ROUTES.map((route) => (
          <div key={route.path} className="flex items-center justify-between rounded-lg border border-[#e5e7f2] p-3 text-xs">
            <div>
              <p className="font-semibold text-[#0d1738]">{route.label}</p>
              <span className="font-mono text-[10px] text-[#777588]">{route.path} · {route.words}</span>
            </div>
            <span className="rounded bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
              {route.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. QA RELEASE TAB
function QaReleaseTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">6-Gate Human QA Release Gate</h3>
          <p className="text-xs text-[#777588]">Automated test validation + operator sign-off before client delivery.</p>
        </div>
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
          6 / 6 Passed
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {[
          { name: "Verified Company Facts & Claims", detail: "Checked against Firecrawl extraction & GBP records. Zero hallucinated claims.", status: "Passed" },
          { name: "Mobile Viewport (375px) Test", detail: "0.12s LCP, zero CLS shift, sticky 1-tap emergency call bar verified.", status: "Passed" },
          { name: "28 Service Routes Pre-rendered", detail: "Unique title, meta description, and valid LocalBusiness schema on all routes.", status: "Passed" },
          { name: "8 Launch Articles Reviewed", detail: "100% human-reviewed for local NYC electrical accuracy and helpfulness.", status: "Passed" },
          { name: "Lead & Estimate Routing Test", detail: "Quote forms and phone click tracking verified with instant alerts.", status: "Passed" },
          { name: "Next.js 15 Standalone Build", detail: "Clean compilation with zero TypeScript errors or broken imports.", status: "Passed" },
        ].map((gate) => (
          <div key={gate.name} className="flex items-center justify-between rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-[#0b8f5b] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0d1738]">{gate.name}</p>
                <p className="mt-0.5 text-xs text-[#777588]">{gate.detail}</p>
              </div>
            </div>
            <span className="rounded bg-[#eaf8f0] px-2.5 py-1 text-[11px] font-bold text-[#0b8f5b]">
              {gate.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 8. HOW TO CLOSE TAB
function HowToCloseTab() {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        {/* Timed Closing Sequence */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div>
              <h3 className="text-xl font-bold text-[#0d1738]">Deterministic Closing Sequence</h3>
              <p className="text-xs text-[#777588]">Zero email client switching — send Brevo transactional emails & click-to-call directly.</p>
            </div>
            <span className="rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
              Lead: David (York Electrical)
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1: Brevo Instant Send */}
            <div className="rounded-xl border border-[#533afd] bg-[#f0f3ff] p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#533afd]" />
                  <span className="font-bold text-[#533afd]">Step 1: Instant Brevo Magic Link Delivery</span>
                </div>
                <span className="rounded bg-[#533afd] text-white px-2 py-0.5 text-[10px] font-bold">
                  {emailSent ? "Sent via Brevo ✓" : "Due Today · Immediate"}
                </span>
              </div>

              {/* Live Brevo Email Preview */}
              <div className="rounded-lg border border-[#c7d0fb] bg-white p-4 space-y-2">
                <div className="flex justify-between text-[11px] text-[#777588] border-b border-[#e5e7f2] pb-2">
                  <span><strong>To:</strong> david@yorkelectrical.com</span>
                  <span><strong>Sender:</strong> BarakahSoft &lt;noreply@barakahsoft.com&gt;</span>
                </div>
                <p className="font-semibold text-[#0d1738]">
                  Subject: Your Rebuilt Homepage & Queens Market Audit (York Electrical)
                </p>
                <p className="text-[#42506a] leading-relaxed">
                  "Hi David, we completed the research, 7×7 Queens local search grid, and rebuilt homepage for York Electrical. Access your secure interactive portal below:"
                </p>
                <div className="pt-2">
                  <span className="inline-block rounded bg-[#533afd] px-3 py-1.5 font-mono text-[11px] font-bold text-white">
                    https://preview.barakahsoft.com/s/york-electrical?auth=magic_983
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-[#777588]">Automated via Brevo API</span>
                <button
                  onClick={() => setEmailSent(true)}
                  disabled={emailSent}
                  className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold text-white transition ${
                    emailSent ? "bg-[#0b8f5b]" : "bg-[#533afd] hover:bg-[#432bd9]"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  {emailSent ? "Email Sent via Brevo ✓" : "1-Click Send Brevo Email Now"}
                </button>
              </div>
            </div>

            {/* Step 2: Click-to-Call on Phone */}
            <div className="rounded-xl border border-[#e5e7f2] bg-white p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#0b8f5b]" />
                  <span className="font-bold text-[#0d1738]">Step 2: Walkthrough Call (Click-to-Call)</span>
                </div>
                <span className="rounded bg-[#f9f9ff] border border-[#e5e7f2] px-2 py-0.5 text-[10px] font-semibold text-[#777588]">
                  Due Tomorrow
                </span>
              </div>
              <p className="text-[#42506a]">
                Review the 10/49 map grid and ask if the 39 missing areas align with where they want more high-value jobs.
              </p>
              <div className="pt-1">
                <a
                  href="tel:+17183537227"
                  className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#09744a]"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Call Lead on Phone: +1 (718) 353-7227
                </a>
              </div>
            </div>

            {/* Step 3: Automated Follow-Up Sequences */}
            <div className="rounded-xl border border-[#e5e7f2] bg-white p-4 text-[#777588] flex justify-between items-center">
              <div>
                <p className="font-bold text-[#0d1738]">Step 3: Automated Follow-Up #2</p>
                <p className="text-[11px]">Triggers automatically via Brevo if unopened within 24 hours.</p>
              </div>
              <span className="rounded bg-[#f9f9ff] border border-[#e5e7f2] px-2 py-0.5 text-[10px] font-bold text-[#777588]">
                Auto-Scheduled
              </span>
            </div>
          </div>

          {/* Objection Handling Cheat Sheet */}
          <div className="border-t border-[#e5e7f2] pt-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">
              Objection Handling Scripts
            </p>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="rounded-lg bg-[#f9f9ff] border border-[#e5e7f2] p-3">
                <p className="font-bold text-[#0d1738]">"We get all business by word of mouth."</p>
                <p className="mt-1 text-[#42506a]">
                  "When people hear about you, they look you up on mobile. The new site ensures they call you instead of checking the next guy."
                </p>
              </div>
              <div className="rounded-lg bg-[#f9f9ff] border border-[#e5e7f2] p-3">
                <p className="font-bold text-[#0d1738]">"I already have a web designer."</p>
                <p className="mt-1 text-[#42506a]">
                  "Show them the 10/49 map grid and 0.12s speed benchmark — if they can match this route depth and schema, stick with them."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Payment Trigger */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <h3 className="font-bold text-[#0d1738]">Stripe One-Click Checkout</h3>
            <CircleDollarSign className="h-5 w-5 text-[#533afd]" />
          </div>
          <p className="text-xs text-[#777588]">
            Generate and dispatch secure checkout link via SMS and email.
          </p>

          <div className="rounded-xl bg-[#f0f3ff] p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#777588]">Product</span>
              <span className="font-bold text-[#0d1738]">Full Website Build</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#777588]">Scope</span>
              <span className="font-bold text-[#0d1738]">28 Services + 8 Posts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#777588]">Delivery SLA</span>
              <span className="font-bold text-[#0b8f5b]">48 Hours Post-Payment</span>
            </div>
            <div className="flex justify-between border-t border-[#c7d0fb] pt-2">
              <span className="font-bold text-[#0d1738]">Amount Due</span>
              <span className="text-base font-bold text-[#533afd]">$797.00 USD</span>
            </div>
          </div>

          <button className="w-full rounded-md bg-[#533afd] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#432bd9]">
            Send $797 Stripe Payment Link
          </button>
        </div>
      </div>
    </div>
  );
}

// 9. DELIVERY TAB
function DeliveryTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-[#0d1738]">Handoff & Standalone Next.js Export</h3>
      
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e5e7f2] p-5 space-y-3">
          <Globe2 className="h-6 w-6 text-[#533afd]" />
          <h4 className="font-bold text-[#0d1738]">Custom Domain DNS Connection</h4>
          <p className="text-xs text-[#777588]">Point CNAME record to cname.vercel-dns.com for instant SSL setup.</p>
          <div className="rounded bg-[#f9f9ff] p-2 text-[11px] font-mono text-[#0d1738]">
            CNAME @ cname.vercel-dns.com
          </div>
          <button className="rounded-md bg-[#533afd] px-3 py-1.5 text-xs font-bold text-white">
            Check DNS Status
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e7f2] p-5 space-y-3">
          <PackageCheck className="h-6 w-6 text-[#0b8f5b]" />
          <h4 className="font-bold text-[#0d1738]">Standalone Next.js Project Zip</h4>
          <p className="text-xs text-[#777588]">Clean isolated export with zero agency lock-in (york-electrical-v1.zip).</p>
          <div className="rounded bg-[#f9f9ff] p-2 text-[11px] font-mono text-[#0d1738]">
            package.json · app/ · components/ · public/
          </div>
          <button className="rounded-md border border-[#e5e7f2] bg-white px-3 py-1.5 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff]">
            Download Project Zip
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPrototype() {
  const [view, setView] = useState<View>("Overview");

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      <Sidebar view={view} setView={setView} />
      <main className="lg:pl-72">
        <Header view={view} />
        <div className="mx-auto max-w-[1280px] p-5 lg:p-10">
          {view === "Overview" ? (
            <PremiumAdminHome setView={setView} />
          ) : view === "Lead workspace" ? (
            <Workspace />
          ) : (
            <Workspace />
          )}
          <p className="mt-10 text-center text-xs text-[#777588]">
            BarakahSoft Lead Engine V1 · Enterprise Precision Simulation
          </p>
        </div>
      </main>
    </div>
  );
}
