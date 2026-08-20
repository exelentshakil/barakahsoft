"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
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
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Upload,
  Users,
  Zap,
} from "lucide-react";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

type View = "Queue" | "Workspace";

const INBOUND_ORDERS = [
  {
    id: "LD-2024-893",
    company: "York Electrical Contractors",
    contact: "David Karagounis",
    phone: "(718) 353-7227",
    email: "david@yorkelectrical.com",
    trade: "Licensed Electricians",
    location: "Queens, NY",
    status: "Preview Ready",
    statusTone: "purple",
    value: "$797",
    active: true,
  },
  {
    id: "LD-2024-890",
    company: "Summit HVAC & Heat Pumps",
    contact: "Michael Smith",
    phone: "(516) 420-8812",
    email: "mike@summithvac.com",
    trade: "HVAC & Heat Pumps",
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
    trade: "Emergency Plumber",
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
    trade: "Roofing Contractor",
    location: "Suffolk County, NY",
    status: "Paid — In Production",
    statusTone: "green",
    value: "$797",
  },
  {
    id: "LD-2024-881",
    company: "Evergreen Water Restoration",
    contact: "Sarah Miller",
    phone: "(718) 220-4491",
    email: "sarah@evergreenrestoration.com",
    trade: "Water Damage Repair",
    location: "Staten Island, NY",
    status: "New Lead",
    statusTone: "slate",
    value: "$797",
  },
];

const SITEMAP_ROUTES = [
  { path: "/", label: "Homepage (Rebuilt)", type: "Core" },
  { path: "/services", label: "Services Hub", type: "Core" },
  { path: "/about", label: "About Us (37y Story)", type: "Core" },
  { path: "/contact", label: "Contact & Dispatch", type: "Core" },
  { path: "/blog", label: "Blog Index", type: "Core" },
  { path: "/services/emergency-electrician-queens-ny", label: "24/7 Emergency Dispatch", type: "Service" },
  { path: "/services/electrical-panel-upgrade-queens-ny", label: "Panel Upgrade (200 Amp)", type: "Service" },
  { path: "/services/ev-charger-installation-queens-ny", label: "Level 2 EV Charger Install", type: "Service" },
  { path: "/services/electrical-code-violation-corrections-queens-ny", label: "DOB Violations Clearance", type: "Service" },
];

const MAP_GRID = Array.from({ length: 49 }, (_, i) => ({
  id: i + 1,
  rank: i < 10 ? 1 : i < 20 ? 6 : 22,
  status: i < 10 ? "visible" : i < 20 ? "outside" : "missing",
}));

export function AdminPrototype() {
  const [view, setView] = useState<View>("Queue");
  const [activeTab, setActiveTab] = useState("Brief");
  const [emailSent, setEmailSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
              Lead Engine Orders
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/client-portal-prototype"
              className="hidden items-center gap-1.5 rounded-md border border-[#e5e7f2] px-3 py-1.5 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff] sm:inline-flex"
            >
              <Globe2 className="h-3.5 w-3.5 text-[#533afd]" /> Open Customer View
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-xs font-bold text-white">
              SA
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 space-y-8">
        {/* 2. ORDER STATS PULSE */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "New Leads", val: "12", sub: "3 need review today", color: "#533afd" },
            { label: "Previews Ready", val: "3", sub: "Send emails", color: "#0b8f5b" },
            { label: "In Conversation", val: "4", sub: "Follow up today", color: "#b7791f" },
            { label: "Collected This Week", val: "$3,188", sub: "4 paid website builds", color: "#0d1738" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#e5e7f2] bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777588]">{s.label}</span>
              <p className="mt-2 text-2xl sm:text-3xl font-bold" style={{ color: s.color }}>
                {s.val}
              </p>
              <p className="mt-1 text-xs text-[#777588]">{s.sub}</p>
            </div>
          ))}
        </section>

        {view === "Queue" ? (
          <>
            {/* 3. PRIORITY ACTION SPOTLIGHT (YORK ELECTRICAL) */}
            <section className="rounded-2xl border border-[#c7d0fb] bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[#e5e7f2] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#533afd] animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                      Next Order to Process
                    </span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                    York Electrical Contractors
                  </h2>
                  <p className="text-xs text-[#777588]">
                    David Karagounis · (718) 353-7227 · david@yorkelectrical.com · Queens, NY
                  </p>
                </div>
                <button
                  onClick={() => setView("Workspace")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7f2] px-3.5 py-2 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff]"
                >
                  Open Deep Workspace <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 3 Action Buttons */}
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Send Brevo Email */}
                <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">Step 1: Deliver</span>
                    <p className="font-bold text-[#0d1738] mt-1">Send Preview Email</p>
                    <p className="text-xs text-[#777588] mt-0.5">Sends Brevo email with private magic link</p>
                  </div>
                  <button
                    onClick={() => setEmailSent(true)}
                    className={`w-full rounded-md py-2.5 text-xs font-bold text-white transition ${
                      emailSent ? "bg-[#0b8f5b]" : "bg-[#533afd] hover:bg-[#432bd9]"
                    }`}
                  >
                    {emailSent ? "Email Sent via Brevo ✓" : "1-Click Send Brevo Email"}
                  </button>
                </div>

                {/* Call Phone */}
                <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0b8f5b]">Step 2: Connect</span>
                    <p className="font-bold text-[#0d1738] mt-1">Call David on Phone</p>
                    <p className="text-xs text-[#777588] mt-0.5">Direct phone click-to-call</p>
                  </div>
                  <a
                    href="tel:+17183537227"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0b8f5b] py-2.5 text-xs font-bold text-white hover:bg-[#09744a]"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Call (718) 353-7227
                  </a>
                </div>

                {/* Send Invoice */}
                <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-4 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0d1738]">Step 3: Collect</span>
                    <p className="font-bold text-[#0d1738] mt-1">$797 Payment Link</p>
                    <p className="text-xs text-[#777588] mt-0.5">Dispatches Stripe checkout</p>
                  </div>
                  <button
                    onClick={() => alert("Stripe checkout link sent to david@yorkelectrical.com via SMS and email!")}
                    className="w-full rounded-md border border-[#533afd] bg-white py-2.5 text-xs font-bold text-[#533afd] hover:bg-[#f0f3ff]"
                  >
                    Send $797 Invoice Link
                  </button>
                </div>
              </div>
            </section>

            {/* 4. ORDERS QUEUE TABLE */}
            <section className="overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white shadow-sm">
              <div className="border-b border-[#e5e7f2] p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[#0d1738]">All Inbound Orders (27 Active)</h3>
                  <p className="text-xs text-[#777588]">Click any lead to inspect details or trigger actions.</p>
                </div>
              </div>

              <div className="divide-y divide-[#e5e7f2]">
                {INBOUND_ORDERS.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center hover:bg-[#f9f9ff] transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0d1738]">{order.company}</p>
                        <span className="rounded bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                          {order.trade}
                        </span>
                      </div>
                      <p className="text-xs text-[#777588]">
                        {order.contact} · {order.phone} · {order.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          order.statusTone === "green"
                            ? "bg-[#eaf8f0] text-[#0b8f5b]"
                            : order.statusTone === "purple"
                            ? "bg-[#e3dfff] text-[#533afd]"
                            : order.statusTone === "blue"
                            ? "bg-[#f0f3ff] text-[#533afd]"
                            : "bg-[#fff8d9] text-[#b7791f]"
                        }`}
                      >
                        {order.status}
                      </span>
                      <button
                        onClick={() => setView("Workspace")}
                        className="rounded-md border border-[#e5e7f2] px-3 py-1.5 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff]"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* 5. DEEP WORKSPACE VIEW (WHEN OPENED) */
          <section className="space-y-6">
            <button
              onClick={() => setView("Queue")}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Order Queue
            </button>

            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-[#e5e7f2] pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0d1738]">York Electrical Workspace</h2>
                  <p className="text-xs text-[#777588]">Inspection of research, audit, and generation assets.</p>
                </div>
                <span className="rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd]">
                  Status: Preview Ready
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-[#e5e7f2] pb-3 text-xs font-bold">
                {["Brief & Facts", "Queens Map Grid", "Sitemap (28 Pages)", "QA Checks"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-md px-3 py-1.5 transition ${
                      activeTab === t ? "bg-[#533afd] text-white" : "text-[#42506a] hover:bg-[#f0f3ff]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === "Brief & Facts" && (
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="space-y-2 rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2]">
                    <p className="font-bold text-[#0d1738]">Verified Facts</p>
                    <p>• Lic. #11288 NYC Master Electrician</p>
                    <p>• 37+ Years serving Flushing, Bayside, Astoria</p>
                    <p>• 450+ 5-Star Reviews on Google</p>
                  </div>
                  <div className="space-y-2 rounded-xl bg-[#fff8f8] p-4 border border-[#ffdad6]">
                    <p className="font-bold text-[#ba1a1a]">Prohibited Claims</p>
                    <p>• Never claim cheapest prices in NYC</p>
                    <p>• Never claim 24/7 non-emergency service</p>
                  </div>
                </div>
              )}

              {activeTab === "Queens Map Grid" && (
                <div className="space-y-4">
                  <p className="text-xs text-[#777588]">49 Scan checkpoints across Queens zip codes:</p>
                  <div className="grid grid-cols-7 gap-2 max-w-md">
                    {MAP_GRID.map((pt) => (
                      <div
                        key={pt.id}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold ${
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
              )}

              {activeTab === "Sitemap (28 Pages)" && (
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {SITEMAP_ROUTES.slice(0, 8).map((r) => (
                    <div key={r.path} className="flex justify-between border border-[#e5e7f2] p-2.5 rounded-lg">
                      <span className="font-semibold text-[#0d1738]">{r.label}</span>
                      <span className="font-mono text-[#777588]">{r.path}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "QA Checks" && (
                <div className="space-y-2 text-xs">
                  {[
                    "Verified facts match Firecrawl extraction",
                    "Mobile 0.12s speed verified",
                    "All 28 services have valid schema",
                    "8 launch articles reviewed",
                  ].map((c) => (
                    <div key={c} className="flex items-center gap-2 p-2 rounded bg-[#f0fcf4] text-[#0b8f5b] font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
