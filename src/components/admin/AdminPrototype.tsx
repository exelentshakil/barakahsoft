"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Globe2,
  Layers,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Phone,
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
  Star,
  Target,
  Upload,
  Users,
  Zap,
} from "lucide-react";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const LEADS = [
  {
    id: "LD-2024-893",
    company: "York Electrical Contractors",
    contact: "David Karagounis",
    phone: "(718) 353-7227",
    email: "david@yorkelectrical.com",
    trade: "Electricians",
    location: "Queens, NY",
    status: "Preview Ready",
    statusTone: "purple",
    value: "$797",
  },
  {
    id: "LD-2024-890",
    company: "Summit HVAC & Heat Pumps",
    contact: "Michael Smith",
    phone: "(516) 420-8812",
    email: "mike@summithvac.com",
    trade: "HVAC",
    location: "Nassau County, NY",
    status: "In Conversation",
    statusTone: "blue",
    value: "$797",
  },
  {
    id: "LD-2024-887",
    company: "Brightline 24/7 Plumbing",
    contact: "Tony Rossi",
    phone: "(718) 991-3420",
    email: "tony@brightlineplumbing.com",
    trade: "Plumbing",
    location: "Brooklyn, NY",
    status: "Payment Pending",
    statusTone: "yellow",
    value: "$797",
  },
  {
    id: "LD-2024-884",
    company: "John Roofing & Siding",
    contact: "John Higgins",
    phone: "(631) 552-1920",
    email: "john@johnroofing.com",
    trade: "Roofing",
    location: "Suffolk County, NY",
    status: "Paid — Live",
    statusTone: "green",
    value: "$797",
  },
];

const MAP_GRID = Array.from({ length: 49 }, (_, i) => ({
  id: i + 1,
  rank: i < 10 ? 1 : i < 20 ? 6 : 22,
  status: i < 10 ? "visible" : i < 20 ? "outside" : "missing",
}));

export function AdminPrototype() {
  const [selectedLead, setSelectedLead] = useState(LEADS[0]);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedMapNode, setSelectedMapNode] = useState(8);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="rounded-full bg-[#f0f3ff] px-3 py-0.5 text-xs font-semibold text-[#533afd]">
              Lead Fulfillment Command Center
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/client-portal-prototype"
              className="hidden items-center gap-1.5 rounded-md border border-[#e5e7f2] px-3.5 py-1.5 text-xs font-semibold text-[#0d1738] transition hover:bg-[#f0f3ff] sm:inline-flex"
            >
              <Globe2 className="h-3.5 w-3.5 text-[#533afd]" /> Open Customer Proposal View
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-xs font-bold text-white">
              SA
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* 2. LEFT COLUMN: INBOUND LEADS QUEUE */}
          <aside className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777588]">
                Inbound Lead Orders
              </span>
              <span className="rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                4 Active
              </span>
            </div>

            <div className="space-y-3">
              {LEADS.map((lead) => {
                const isSelected = selectedLead.id === lead.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#533afd] bg-white shadow-sm ring-1 ring-[#533afd]"
                        : "border-[#e5e7f2] bg-white hover:border-[#c7d0fb]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                        {lead.trade}
                      </span>
                      <span className="text-xs font-bold text-[#0b8f5b]">{lead.value}</span>
                    </div>
                    <p className="mt-2.5 font-bold text-[#0d1738] text-sm truncate">{lead.company}</p>
                    <p className="text-xs text-[#777588] mt-0.5">{lead.contact} · {lead.location}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#e5e7f2] pt-2.5">
                      <span className="text-xs font-semibold text-[#533afd]">{lead.status}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#777588]" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Metrics */}
            <div className="rounded-xl border border-[#e5e7f2] bg-white p-5 space-y-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Weekly Pulse</span>
              <div className="flex justify-between items-center">
                <span className="text-[#777588]">Collected This Week:</span>
                <span className="font-bold text-sm text-[#0d1738]">$3,188.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#777588]">Pending Close:</span>
                <span className="font-bold text-sm text-[#533afd]">$2,391.00</span>
              </div>
            </div>
          </aside>

          {/* 3. RIGHT COLUMN: LINEAR LEAD FULFILLMENT COMPOSITION */}
          <div className="space-y-8">
            {/* Top Overview Banner */}
            <div className="rounded-2xl border border-[#c7d0fb] bg-white p-7 shadow-sm flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                    Active Pipeline Lead
                  </span>
                  <span className="text-xs font-mono text-[#777588]">#{selectedLead.id}</span>
                </div>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
                  {selectedLead.company}
                </h1>
                <p className="text-xs text-[#777588] mt-0.5">
                  {selectedLead.contact} · {selectedLead.phone} · {selectedLead.email}
                </p>
              </div>

              {/* 3 Direct Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setEmailSent(true)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-bold text-white transition ${
                    emailSent ? "bg-[#0b8f5b]" : "bg-[#533afd] hover:bg-[#432bd9]"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {emailSent ? "Brevo Email Sent ✓" : "Send Brevo Magic Link"}
                </button>
                <a
                  href={`tel:${selectedLead.phone.replace(/\D/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0b8f5b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#09744a]"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Click-to-Call
                </a>
                <button
                  onClick={() => alert(`Stripe $797 payment link generated for ${selectedLead.company}!`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#533afd] bg-white px-4 py-2.5 text-xs font-bold text-[#533afd] hover:bg-[#f0f3ff]"
                >
                  <CircleDollarSign className="h-3.5 w-3.5" /> Send $797 Invoice
                </button>
              </div>
            </div>

            {/* LINEAR STEP 1: INBOUND INTAKE & EXTRACTED DATA */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    1
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Inbound Lead & Verified Facts</h3>
                </div>
                <span className="rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b]">
                  Verified via Firecrawl
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
                <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Selected Intake Pains</span>
                  <p className="font-bold text-[#0d1738]">• Nobody finds us on Google</p>
                  <p className="font-bold text-[#0d1738]">• Mobile looks outdated & slow</p>
                  <p className="font-bold text-[#0d1738]">• Visitors leave without calling</p>
                </div>

                <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Verified Credentials</span>
                  <p className="font-bold text-[#0d1738]">• Lic. #11288 Master Electrician</p>
                  <p className="font-bold text-[#0d1738]">• 37+ Years serving Queens NYC</p>
                  <p className="font-bold text-[#0d1738]">• 450+ 5-Star Google Reviews</p>
                </div>

                <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Extracted Brand Tokens</span>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                      <span className="h-3 w-3 rounded-full bg-[#F9DB15] border" /> #F9DB15
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                      <span className="h-3 w-3 rounded-full bg-[#2B303B] border" /> #2B303B
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777588] pt-1">Logo: york-logo.png extracted</p>
                </div>
              </div>
            </div>

            {/* LINEAR STEP 2: VISUAL AUDIT & 7×7 LOCAL MAP GRID */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    2
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Automated Visual Audit & Queens Search Matrix</h3>
                </div>
                <span className="text-xs font-bold text-[#533afd]">Speed Lift: 29 $\to$ 98 / 100</span>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                {/* 7x7 Grid */}
                <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588] block mb-2.5">
                    Queens 7×7 Search Grid (49 Scan Nodes)
                  </span>
                  <div className="grid grid-cols-7 gap-2">
                    {MAP_GRID.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => setSelectedMapNode(pt.id)}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold transition ${
                          pt.status === "visible"
                            ? "bg-[#533afd] text-white"
                            : pt.status === "outside"
                            ? "bg-[#ffe086] text-[#231b00]"
                            : "bg-[#ffdad6] text-[#ba1a1a]"
                        } ${selectedMapNode === pt.id ? "ring-2 ring-[#0d1738] scale-110" : ""}`}
                      >
                        {pt.rank}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-[#777588]">
                    <span>Rank #1-3 (10 Nodes)</span>
                    <span className="text-[#ba1a1a] font-semibold">Missing (39 Nodes)</span>
                  </div>
                </div>

                {/* Audit Key Metrics */}
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="rounded-xl bg-[#f0f3ff] p-4 border border-[#c7d0fb]">
                    <p className="font-bold text-[#533afd]">Audit Discovery for Closing Call:</p>
                    <p className="text-[#42506a] mt-1">
                      York Electrical dominates Flushing/Bayside, but is completely invisible in Astoria, LIC, and Forest Hills.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl border border-[#e5e7f2] p-3 bg-[#f9f9ff]">
                      <span className="text-[10px] font-semibold text-[#777588]">Mobile Load Time</span>
                      <p className="text-xl font-bold text-[#0b8f5b] mt-0.5">0.12s</p>
                    </div>
                    <div className="rounded-xl border border-[#e5e7f2] p-3 bg-[#f9f9ff]">
                      <span className="text-[10px] font-semibold text-[#777588]">AI Schema Markup</span>
                      <p className="text-xl font-bold text-[#533afd] mt-0.5">LocalBusiness</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LINEAR STEP 3: REBUILT 28-PAGE SITEMAP & ARTICLES */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    3
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Rebuilt Platform (28 Service Routes + 8 Articles)</h3>
                </div>
                <a
                  href="/s/york-electrical"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#533afd] hover:underline"
                >
                  Inspect Live Preview <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                {[
                  { name: "Homepage (0.12s First Paint)", path: "/" },
                  { name: "24/7 Emergency Dispatch", path: "/services/emergency-electrician-queens-ny" },
                  { name: "200-Amp Panel Upgrade", path: "/services/electrical-panel-upgrade-queens-ny" },
                  { name: "Level 2 EV Charger Install", path: "/services/ev-charger-installation-queens-ny" },
                  { name: "DOB Code Violations Clearance", path: "/services/electrical-code-violation-corrections" },
                  { name: "Commercial Tenant Fit-Outs", path: "/services/commercial-electrician-queens-ny" },
                  { name: "Signs You Need Panel Upgrade", path: "/blog/signs-you-need-electrical-panel-upgrade" },
                  { name: "NYC EV Charger Permit Guide", path: "/blog/level-2-ev-charger-installation-queens-ny" },
                ].map((r) => (
                  <div key={r.path} className="flex justify-between items-center rounded-lg border border-[#e5e7f2] p-3 bg-[#f9f9ff]">
                    <span className="font-medium text-[#0d1738]">{r.name}</span>
                    <span className="rounded bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b]">Pre-rendered</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LINEAR STEP 4: 1-CLICK BREVO DELIVERY & LIVE TRACKING */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    4
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Automated Brevo Delivery & Live Proposal Link</h3>
                </div>
                <span className="text-xs font-mono text-[#777588]">magic_983 token</span>
              </div>

              <div className="rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs space-y-3.5">
                <div className="flex justify-between items-center border-b border-[#c7d0fb] pb-2.5 text-[11px]">
                  <span><strong>To:</strong> david@yorkelectrical.com</span>
                  <span><strong>Private URL:</strong> https://home.barakahsoft.com/client-portal-prototype?auth=magic_983</span>
                </div>
                <p className="font-bold text-[#0d1738] text-sm">
                  Subject: Your Rebuilt Homepage & Queens Market Audit (York Electrical)
                </p>
                <p className="text-[#42506a] leading-relaxed">
                  "Hi David, we mapped your real 37-year history, Google 5.0 rating, and Queens 7×7 search grid. Your rebuilt homepage and 28 service pages are ready for review."
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-[#777588]">1-Click Delivery via Brevo API</span>
                  <button
                    onClick={() => setEmailSent(true)}
                    className="rounded-md bg-[#533afd] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#432bd9]"
                  >
                    {emailSent ? "Delivered via Brevo ✓" : "Send Delivery Email Now"}
                  </button>
                </div>
              </div>
            </div>

            {/* LINEAR STEP 5: CLOSE & STRIPE $797 CHECKOUT */}
            <div className="rounded-2xl bg-[#0d1738] p-7 text-white shadow-md flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#533afd] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Final Step
                  </span>
                  <span className="text-xs text-white/70">Payment & Go-Live SLA</span>
                </div>
                <h3 className="mt-2 text-xl font-bold">Collect $797 & Launch yorkelectrical.com</h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  Client receives 100% standalone Next.js code + DNS CNAME setup with 48h SLA.
                </p>
              </div>

              <button
                onClick={() => alert("Dispatched $797 Stripe Checkout to david@yorkelectrical.com!")}
                className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#432bd9] shrink-0"
              >
                <CircleDollarSign className="h-4 w-4" /> Send $797 Payment Link
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
