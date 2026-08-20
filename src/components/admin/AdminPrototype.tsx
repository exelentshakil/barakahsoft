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
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  FileCode2,
  FileText,
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
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Upload,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { PremiumAdminHome } from "@/components/prototype/PremiumAdminHome";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

type View = "Overview" | "Lead workspace" | "Reports" | "Communications" | "Delivery" | "Settings";

const SITEMAP_ROUTES = [
  { path: "/", label: "Homepage", type: "Core", status: "Approved" },
  { path: "/services", label: "Services Hub", type: "Core", status: "Approved" },
  { path: "/about", label: "About Us (37y Story)", type: "Core", status: "Approved" },
  { path: "/contact", label: "Contact & Dispatch", type: "Core", status: "Approved" },
  { path: "/blog", label: "Blog Library Index", type: "Core", status: "Approved" },
  { path: "/services/emergency-electrician-queens-ny", label: "24/7 Emergency Dispatch", type: "Service", status: "Approved" },
  { path: "/services/electrical-panel-upgrade-queens-ny", label: "Panel Upgrade (200 Amp)", type: "Service", status: "Approved" },
  { path: "/services/electrical-code-violation-corrections-queens-ny", label: "DOB Violation Corrections", type: "Service", status: "Approved" },
  { path: "/services/ev-charger-installation-queens-ny", label: "Level 2 EV Charger Install", type: "Service", status: "Approved" },
  { path: "/services/commercial-electrician-queens-ny", label: "Commercial Tenant Fit-Outs", type: "Service", status: "Approved" },
  { path: "/services/circuit-breaker-repair-queens-ny", label: "Circuit Breaker Diagnostics", type: "Service", status: "Approved" },
  { path: "/services/electrical-rewiring-queens-ny", label: "Complete House Rewiring", type: "Service", status: "Approved" },
  { path: "/blog/signs-you-need-electrical-panel-upgrade", label: "Signs You Need Panel Upgrade", type: "Article", status: "Approved" },
  { path: "/blog/level-2-ev-charger-installation-queens-ny", label: "Level 2 EV Installation Guide", type: "Article", status: "Approved" },
  { path: "/blog/nyc-ecb-electrical-violations-guide", label: "NYC ECB Violations Guide", type: "Article", status: "Approved" },
  { path: "/blog/commercial-led-lighting-retrofit-roi", label: "Commercial LED Retrofit ROI", type: "Article", status: "Approved" },
];

const ISSUES_FIXES = [
  {
    issue: "Buried Trust Proof",
    evidence: "450+ 5-star reviews and 37 years of licensed NYC service are buried below the fold.",
    fix: "High-authority hero with Google review badges, license #11288, and instant dispatch CTAs.",
  },
  {
    issue: "Generic Service Packaging",
    evidence: "28 genuine services were bundled into one vague generic text paragraph.",
    fix: "Individual high-converting pages for every real service with localized Queens schema.",
  },
  {
    issue: "Disconnected Content",
    evidence: "Helpful articles exist but have zero internal links to related commercial service offerings.",
    fix: "Automated related services cards, quote triggers, and search-intent internal cross-links.",
  },
  {
    issue: "Mobile Friction",
    evidence: "Mobile users must pinch-zoom and hunt through navigation for the emergency phone number.",
    fix: "Persistent 1-tap call bar, mobile-first typography, and 0.12s first paint.",
  },
];

const MAP_GRID = Array.from({ length: 49 }, (_, i) => ({
  id: i + 1,
  rank: i % 7 === 0 ? 15 : i % 5 === 0 ? 6 : i < 18 ? 1 : 22,
  status: i < 18 ? "visible" : i % 5 === 0 ? "outside" : "missing",
}));

function Sidebar({ view, setView }: { view: View; setView: (view: View) => void }) {
  const links: [typeof LayoutDashboard, string, View][] = [
    [LayoutDashboard, "Command Center", "Overview"],
    [Users, "Lead Workspace", "Lead workspace"],
    [FileCheck2, "Reports & Audits", "Reports"],
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

      {/* Workspace Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[#e5e7f2] bg-white p-1.5">
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

      {/* Tab Content */}
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

function GenerationBriefTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        {/* Verified Facts & Prohibited Claims */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#533afd]" />
              <h3 className="font-bold text-[#0d1738]">Verified Company Facts</h3>
            </div>
            <span className="rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
              Source: Firecrawl + GBP
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-[#777588]">Legal Name</span>
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
            </div>

            {/* Prohibited Claims Box */}
            <div className="rounded-xl border border-[#ffdad6] bg-[#fff8f8] p-4 text-xs">
              <p className="font-bold uppercase tracking-wider text-[#ba1a1a]">Prohibited Claims (Never Invent)</p>
              <ul className="mt-2 space-y-1.5 text-[#42506a]">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ba1a1a]">✕</span> Never claim "cheapest price in NYC".
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ba1a1a]">✕</span> Never invent fake customer testimonials.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#ba1a1a]">✕</span> Service area strictly within Queens & Greater NYC.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Services & Sitemap Hierarchy */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#533afd]" />
              <h3 className="font-bold text-[#0d1738]">Approved Page Hierarchy</h3>
            </div>
            <span className="text-xs font-semibold text-[#777588]">28 Services · 8 Launch Articles</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs font-mono">
            <div className="rounded-lg bg-[#f9f9ff] p-4 space-y-1 text-[#42506a]">
              <p className="font-bold text-[#0d1738]">├── / (Homepage)</p>
              <p className="pl-4">├── /services (Services Hub)</p>
              <p className="pl-8">├── /emergency-electrician-queens-ny</p>
              <p className="pl-8">├── /electrical-panel-upgrade-queens-ny</p>
              <p className="pl-8">├── /ev-charger-installation-queens-ny</p>
              <p className="pl-8">├── /electrical-code-violation-corrections</p>
              <p className="pl-8">└── + 24 more verified services...</p>
            </div>
            <div className="rounded-lg bg-[#f9f9ff] p-4 space-y-1 text-[#42506a]">
              <p className="font-bold text-[#0d1738]">├── /about (37y Story)</p>
              <p className="font-bold text-[#0d1738]">├── /contact (Quote & Dispatch)</p>
              <p className="font-bold text-[#0d1738]">└── /blog (Content Library)</p>
              <p className="pl-8">├── /signs-you-need-electrical-panel-upgrade</p>
              <p className="pl-8">├── /level-2-ev-charger-installation-guide</p>
              <p className="pl-8">└── + 6 more high-intent launch articles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Brand System Tokens */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
          <h3 className="font-bold text-[#0d1738]">Brand Tokens (Firecrawl)</h3>
          <p className="mt-1 text-xs text-[#777588]">Isolated per-lead styling tokens.</p>

          <div className="mt-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
              <span className="font-semibold text-[#42506a]">Primary Accent</span>
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
              <span className="font-semibold text-[#42506a]">Font Family</span>
              <span className="font-bold text-[#0d1738]">Inter / Sohne Fallback</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#42506a]">Verified Logo</span>
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

function SeoAuditTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">SEO Infrastructure Audit (Score 95/100)</h3>
          <p className="text-xs text-[#777588]">Objective baseline findings from PageSpeed and DOM analysis.</p>
        </div>
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
          Production Ready
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Aggregate Health", score: "95/100", tone: "green" },
          { label: "Critical Fixes", score: "10 Resolved", tone: "green" },
          { label: "Warnings Checked", score: "19 Clean", tone: "blue" },
          { label: "Core Web Vitals", score: "0.12s LCP", tone: "green" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-4">
            <span className="text-xs font-semibold text-[#777588]">{s.label}</span>
            <p className="mt-2 text-2xl font-bold text-[#0d1738]">{s.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapGridTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">7×7 Local Search Visibility Matrix</h3>
          <p className="text-xs text-[#777588]">49 measured scan coordinates across Queens.</p>
        </div>
        <span className="text-xs font-bold text-[#533afd]">18 Top-3 Checkpoints</span>
      </div>

      <div className="grid grid-cols-7 gap-2 max-w-xl">
        {MAP_GRID.map((pt) => (
          <div
            key={pt.id}
            className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold ${
              pt.status === "visible"
                ? "bg-[#533afd] text-white"
                : pt.status === "outside"
                ? "bg-[#ffe086] text-[#231b00]"
                : "bg-[#ffdad6] text-[#ba1a1a]"
            }`}
          >
            {pt.rank}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorsTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-[#0d1738]">Market Competitor Benchmark</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#e5e7f2] uppercase text-[#777588]">
            <tr>
              <th className="py-3">Competitor</th>
              <th className="py-3">Reviews</th>
              <th className="py-3">Rating</th>
              <th className="py-3">Speed</th>
              <th className="py-3">Service Pages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7f2]">
            <tr className="bg-[#f0f3ff] font-bold text-[#533afd]">
              <td className="py-3">York Electrical (Rebuilt)</td>
              <td className="py-3">450+</td>
              <td className="py-3">5.0 ★</td>
              <td className="py-3">0.12s</td>
              <td className="py-3">28 Pages</td>
            </tr>
            <tr>
              <td className="py-3 font-semibold text-[#0d1738]">Entech Electrical</td>
              <td className="py-3">168</td>
              <td className="py-3">4.9 ★</td>
              <td className="py-3">0.82s</td>
              <td className="py-3">6 Pages</td>
            </tr>
            <tr>
              <td className="py-3 font-semibold text-[#0d1738]">Brightline Power Co</td>
              <td className="py-3">155</td>
              <td className="py-3">5.0 ★</td>
              <td className="py-3">0.47s</td>
              <td className="py-3">4 Pages</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IssueFixTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Evidence-Grounded Issue vs Fix Matrix</h3>
          <p className="text-xs text-[#777588]">Every problem directly paired with its architectural fix.</p>
        </div>
      </div>

      <div className="space-y-4">
        {ISSUES_FIXES.map((item, idx) => (
          <div key={item.issue} className="grid gap-4 rounded-xl border border-[#e5e7f2] p-5 lg:grid-cols-[0.8fr_1fr_1fr]">
            <div>
              <span className="text-xs font-bold text-[#533afd]">0{idx + 1}</span>
              <h4 className="mt-1 font-bold text-[#0d1738]">{item.issue}</h4>
            </div>
            <div className="rounded-lg border border-[#ffdad6] bg-[#fff8f8] p-3 text-xs">
              <p className="font-bold text-[#ba1a1a]">Evidence Found</p>
              <p className="mt-1 text-[#42506a]">{item.evidence}</p>
            </div>
            <div className="rounded-lg border border-[#c7d0fb] bg-[#f0f3ff] p-3 text-xs">
              <p className="font-bold text-[#533afd]">Implemented Solution</p>
              <p className="mt-1 text-[#0d1738]">{item.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SitemapTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Sitemap Route Parity (38 of 38 Generated)</h3>
          <p className="text-xs text-[#777588]">Zero dead navigation or placeholder links.</p>
        </div>
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
          100% Parity
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SITEMAP_ROUTES.map((route) => (
          <div key={route.path} className="flex items-center justify-between rounded-lg border border-[#e5e7f2] p-3 text-xs">
            <div>
              <p className="font-semibold text-[#0d1738]">{route.label}</p>
              <span className="font-mono text-[10px] text-[#777588]">{route.path}</span>
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

function QaReleaseTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-5">
        <div>
          <h3 className="text-xl font-bold text-[#0d1738]">Human QA Release Gate</h3>
          <p className="text-xs text-[#777588]">Must pass all 6 gates before client magic link delivery.</p>
        </div>
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b]">
          6 / 6 Passed
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {[
          "Verified Company Facts & Prohibited Claims adhere to source data.",
          "Mobile viewport tested at 375px with 0.12s first contentful paint.",
          "All 28 genuine service pages have unique content and valid structured data.",
          "All 8 blog launch articles pass human usefulness & non-duplication review.",
          "Call & estimate request form verified with instant lead routing.",
          "Standalone Next.js project builds with zero TypeScript errors.",
        ].map((gate) => (
          <div key={gate} className="flex items-center gap-3 rounded-lg border border-[#e5e7f2] p-3.5 bg-[#f9f9ff]">
            <CheckCircle2 className="h-4 w-4 text-[#0b8f5b] shrink-0" />
            <span className="font-medium text-[#0d1738]">{gate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowToCloseTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-[#0d1738]">Closing Sequence</h3>
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[#533afd] bg-[#f0f3ff] p-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#533afd]">Step 1: Send Free Concept (Due Today)</span>
              <span className="rounded bg-[#533afd] text-white px-2 py-0.5 text-[10px] font-bold">Immediate</span>
            </div>
            <p className="mt-2 text-[#42506a]">
              "Hi David, sent over the rebuilt homepage and Queens map audit for York Electrical. Take a look with no pressure."
            </p>
          </div>
          <div className="rounded-xl border border-[#e5e7f2] p-4 text-[#777588]">
            <p className="font-bold text-[#0d1738]">Step 2: Walkthrough Call (Due Tomorrow)</p>
            <p className="mt-1">Review the 10/49 map grid and ask if missing areas match current customer calls.</p>
          </div>
          <div className="rounded-xl border border-[#e5e7f2] p-4 text-[#777588]">
            <p className="font-bold text-[#0d1738]">Step 3: Collect $797 Full Build</p>
            <p className="mt-1">Send Stripe checkout link. Production begins upon receipt.</p>
          </div>
        </div>
      </div>

      {/* Stripe Payment Generator */}
      <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
        <h3 className="font-bold text-[#0d1738]">Payment Trigger</h3>
        <p className="text-xs text-[#777588]">One-click Stripe invoice or payment link generator.</p>
        <div className="rounded-lg bg-[#f0f3ff] p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-[#777588]">Offer</span>
            <span className="font-bold text-[#0d1738]">Full Website Build</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-[#777588]">Amount</span>
            <span className="font-bold text-[#533afd]">$797.00 USD</span>
          </div>
        </div>
        <button className="w-full rounded-md bg-[#533afd] py-2.5 text-xs font-bold text-white hover:bg-[#432bd9]">
          Generate Stripe Checkout Link
        </button>
      </div>
    </div>
  );
}

function DeliveryTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-[#0d1738]">Handoff & Standalone Export</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e5e7f2] p-5 space-y-3">
          <Globe2 className="h-6 w-6 text-[#533afd]" />
          <h4 className="font-bold text-[#0d1738]">Custom Domain Connection</h4>
          <p className="text-xs text-[#777588]">Attach client-owned domain: yorkelectrical.com via DNS CNAME.</p>
          <button className="rounded-md bg-[#533afd] px-3 py-1.5 text-xs font-bold text-white">
            Verify DNS
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e7f2] p-5 space-y-3">
          <PackageCheck className="h-6 w-6 text-[#0b8f5b]" />
          <h4 className="font-bold text-[#0d1738]">Next.js Project Packager</h4>
          <p className="text-xs text-[#777588]">Standalone clean export: york-electrical-v1.zip (no platform secrets).</p>
          <button className="rounded-md border border-[#e5e7f2] bg-white px-3 py-1.5 text-xs font-bold text-[#0d1738]">
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
