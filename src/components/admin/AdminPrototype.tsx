"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
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

// Complete 49 Queens Scan Checkpoints with Real Neighborhoods & Competitors
const MAP_GRID = [
  { id: 1, name: "Astoria North", rank: 14, competitor: "Entech Electrical (168 Reviews)", status: "missing", lostJobs: "$4,500" },
  { id: 2, name: "Astoria Ditmars", rank: 12, competitor: "Entech Electrical (168 Reviews)", status: "missing", lostJobs: "$3,500" },
  { id: 3, name: "Long Island City", rank: 18, competitor: "Citywide Power (140 Reviews)", status: "missing", lostJobs: "$8,000" },
  { id: 4, name: "Sunnyside", rank: 11, competitor: "Brightline Power (155 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 5, name: "Woodside", rank: 8, competitor: "Brightline Power (155 Reviews)", status: "outside", lostJobs: "$2,000" },
  { id: 6, name: "Jackson Heights", rank: 3, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 7, name: "East Elmhurst", rank: 15, competitor: "Metro Sparks (89 Reviews)", status: "missing", lostJobs: "$3,000" },
  { id: 8, name: "Corona Plaza", rank: 2, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 9, name: "Flushing Main", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 10, name: "Flushing Chinatown", rank: 2, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 11, name: "Murray Hill", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 12, name: "Broadway Station", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 13, name: "Auburndale", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 14, name: "Bayside West", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 15, name: "Bayside Bell Blvd", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 16, name: "Bay Terrace", rank: 2, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 17, name: "Whitestone", rank: 1, competitor: "York Electrical (450+ Reviews)", status: "visible", lostJobs: "$0 (Dominating)" },
  { id: 18, name: "Malba", rank: 5, competitor: "North Shore Electric (62 Reviews)", status: "outside", lostJobs: "$1,500" },
  { id: 19, name: "College Point", rank: 9, competitor: "Queens Light Co (45 Reviews)", status: "outside", lostJobs: "$2,000" },
  { id: 20, name: "Rego Park", rank: 16, competitor: "Citywide Power (140 Reviews)", status: "missing", lostJobs: "$4,000" },
  { id: 21, name: "Forest Hills 71st", rank: 14, competitor: "Citywide Power (140 Reviews)", status: "missing", lostJobs: "$6,500" },
  { id: 22, name: "Kew Gardens", rank: 19, competitor: "Metro Sparks (89 Reviews)", status: "missing", lostJobs: "$3,500" },
  { id: 23, name: "Richmond Hill", rank: 22, competitor: "South Queens Wire (55 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 24, name: "Woodhaven", rank: 17, competitor: "South Queens Wire (55 Reviews)", status: "missing", lostJobs: "$2,000" },
  { id: 25, name: "Ozone Park", rank: 24, competitor: "Crossbay Electric (38 Reviews)", status: "missing", lostJobs: "$3,000" },
  { id: 26, name: "Howard Beach", rank: 15, competitor: "Crossbay Electric (38 Reviews)", status: "missing", lostJobs: "$4,500" },
  { id: 27, name: "Middle Village", rank: 11, competitor: "Apex Sparks (72 Reviews)", status: "missing", lostJobs: "$3,500" },
  { id: 28, name: "Glendale", rank: 13, competitor: "Apex Sparks (72 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 29, name: "Ridgewood", rank: 20, competitor: "Brooklyn Border Pro (110 Reviews)", status: "missing", lostJobs: "$5,000" },
  { id: 30, name: "Maspeth", rank: 14, competitor: "Industrial Power (68 Reviews)", status: "missing", lostJobs: "$4,000" },
  { id: 31, name: "Fresh Meadows", rank: 4, competitor: "Northeast Electric (54 Reviews)", status: "outside", lostJobs: "$1,500" },
  { id: 32, name: "Oakland Gardens", rank: 6, competitor: "Northeast Electric (54 Reviews)", status: "outside", lostJobs: "$1,500" },
  { id: 33, name: "Little Neck", rank: 7, competitor: "Nassau Border Sparks (48 Reviews)", status: "outside", lostJobs: "$2,000" },
  { id: 34, name: "Douglaston", rank: 5, competitor: "Nassau Border Sparks (48 Reviews)", status: "outside", lostJobs: "$2,500" },
  { id: 35, name: "Floral Park", rank: 12, competitor: "Long Island Wire (36 Reviews)", status: "missing", lostJobs: "$2,000" },
  { id: 36, name: "Bellerose", rank: 14, competitor: "Long Island Wire (36 Reviews)", status: "missing", lostJobs: "$1,500" },
  { id: 37, name: "Queens Village", rank: 19, competitor: "East Queens Tech (51 Reviews)", status: "missing", lostJobs: "$3,000" },
  { id: 38, name: "Hollis Hills", rank: 9, competitor: "East Queens Tech (51 Reviews)", status: "outside", lostJobs: "$1,500" },
  { id: 39, name: "Jamaica Estates", rank: 13, competitor: "Mid-Island Electric (65 Reviews)", status: "missing", lostJobs: "$4,000" },
  { id: 40, name: "Jamaica Center", rank: 21, competitor: "Metro Sparks (89 Reviews)", status: "missing", lostJobs: "$5,000" },
  { id: 41, name: "St. Albans", rank: 25, competitor: "Southeast Power (42 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 42, name: "Cambria Heights", rank: 23, competitor: "Southeast Power (42 Reviews)", status: "missing", lostJobs: "$2,000" },
  { id: 43, name: "Rosedale", rank: 27, competitor: "South Shore Wire (33 Reviews)", status: "missing", lostJobs: "$2,000" },
  { id: 44, name: "Laurelton", rank: 24, competitor: "South Shore Wire (33 Reviews)", status: "missing", lostJobs: "$2,000" },
  { id: 45, name: "Springfield Gardens", rank: 26, competitor: "JFK Corridor Elec (74 Reviews)", status: "missing", lostJobs: "$3,000" },
  { id: 46, name: "Rockaway Beach", rank: 18, competitor: "Seaside Electrical (58 Reviews)", status: "missing", lostJobs: "$3,500" },
  { id: 47, name: "Belle Harbor", rank: 12, competitor: "Seaside Electrical (58 Reviews)", status: "missing", lostJobs: "$4,000" },
  { id: 48, name: "Arverne", rank: 20, competitor: "Seaside Electrical (58 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 49, name: "Far Rockaway", rank: 22, competitor: "Atlantic Coast Wire (61 Reviews)", status: "missing", lostJobs: "$3,000" },
];

const COMPETITOR_BENCHMARKS = [
  { name: "York Electrical (Rebuilt)", reviews: "450+ ★ 5.0", speed: "0.12s (98/100)", routes: "28 Pages", territory: "All 49 Queens Zones", status: "Leader" },
  { name: "Entech Electrical", reviews: "168 ★ 4.9", speed: "0.82s (48/100)", routes: "6 Pages", territory: "Astoria Only", status: "Competitor" },
  { name: "Brightline Power Co", reviews: "155 ★ 5.0", speed: "0.47s (65/100)", routes: "4 Pages", territory: "Sunnyside Only", status: "Competitor" },
  { name: "Citywide Power NYC", reviews: "140 ★ 4.8", speed: "0.95s (40/100)", routes: "8 Pages", territory: "LIC / Forest Hills", status: "Competitor" },
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
    a: "Yes. All panel upgrades in NYC require a DOB permit & ConEd inspection. York Electrical handles the filing.",
    article: "Article #1",
  },
  {
    q: "How much does a commercial Level 2 EV charger installation cost in NYC?",
    a: "Commercial Level 2 installations typically range from $1,500 to $4,500 depending on conduit run distance.",
    article: "Article #2",
  },
  {
    q: "How fast can an NYC ECB electrical violation be cleared before property sale?",
    a: "A licensed NYC Master Electrician can file a Certificate of Correction with DOB in 24 to 72 hours.",
    article: "Article #3",
  },
  {
    q: "What is the ROI of commercial LED lighting retrofits under NYC Local Law 97?",
    a: "Commercial properties reduce lighting energy usage by up to 65%, avoiding LL97 carbon penalties.",
    article: "Article #4",
  },
];

export function AdminPrototype() {
  const [selectedLead, setSelectedLead] = useState(LEADS[0]);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedNode, setSelectedNode] = useState(MAP_GRID[0]); // Default to Astoria North (missing node)

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Zap className="h-3 w-3" /> Lead Fulfillment Engine
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
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b] shrink-0">
                  <ShieldCheck className="h-3 w-3" /> Verified via Firecrawl
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
                  <h3 className="font-bold text-base text-[#0d1738]">
                    Interactive Queens 7×7 Search Grid & Lost Revenue Scanner
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#533afd]">Speed Lift: 29 → 98 / 100</span>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
                {/* 7x7 Grid */}
                <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">
                      Click Any of 49 Queens Scan Nodes:
                    </span>
                    <span className="text-[11px] font-bold text-[#533afd]">Node #{selectedNode.id} Selected</span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {MAP_GRID.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => setSelectedNode(pt)}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold transition ${
                          pt.status === "visible"
                            ? "bg-[#533afd] text-white hover:bg-[#432bd9]"
                            : pt.status === "outside"
                            ? "bg-[#ffe086] text-[#231b00] hover:bg-[#eec218]"
                            : "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]"
                        } ${selectedNode.id === pt.id ? "ring-2 ring-[#0d1738] scale-110 shadow-sm" : ""}`}
                      >
                        {pt.rank}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between text-[11px] text-[#777588]">
                    <span>Rank #1–3 (10 Dominant)</span>
                    <span className="text-[#ba1a1a] font-bold">Missing (39 Nodes)</span>
                  </div>
                </div>

                {/* Interactive Node Competitor Inspector Box */}
                <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs">
                  <div className="flex justify-between items-center border-b border-[#c7d0fb] pb-2.5">
                    <span className="font-bold text-[#533afd] uppercase text-[11px]">
                      Node #{selectedNode.id}: {selectedNode.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        selectedNode.status === "visible"
                          ? "bg-[#eaf8f0] text-[#0b8f5b]"
                          : "bg-[#ffdad6] text-[#ba1a1a]"
                      }`}
                    >
                      {selectedNode.status === "visible" ? "Rank #1-3 Leader" : `Rank #${selectedNode.rank} (Missing)`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[#777588]">Competitor Holding Search Spot:</span>
                      <p className="font-bold text-[#0d1738] text-sm mt-0.5">{selectedNode.competitor}</p>
                    </div>
                    <div>
                      <span className="text-[#777588]">Estimated Lost Job Volume in this Area:</span>
                      <p className="font-bold text-[#ba1a1a] text-sm mt-0.5">{selectedNode.lostJobs} / month</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-[#c7d0fb] text-[11px] leading-relaxed text-[#42506a]">
                    <strong className="text-[#533afd] block mb-0.5">Closing Call Insight:</strong>
                    "In {selectedNode.name}, {selectedNode.competitor.split(' ')[0]} takes the calls because your old site didn't mention {selectedNode.name}. The new site builds a dedicated page for this neighborhood to reclaim these jobs."
                  </div>
                </div>
              </div>
            </div>

            {/* LINEAR STEP 3: COMPETITOR HEAD-TO-HEAD BENCHMARK & GOOGLE AI Q&A INTEL */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    3
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Competitor Head-to-Head Benchmark & Google AI Q&A</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b] shrink-0">
                  <BarChart3 className="h-3 w-3" /> 4 Competitors Benchmarked
                </span>
              </div>

              {/* Competitor Benchmark Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5e7f2] text-[#777588] uppercase text-[10px]">
                      <th className="pb-3 font-bold">Company</th>
                      <th className="pb-3 font-bold">Google Reviews</th>
                      <th className="pb-3 font-bold">Mobile Speed</th>
                      <th className="pb-3 font-bold">Service Routes</th>
                      <th className="pb-3 font-bold">Territory Dominance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7f2]">
                    {COMPETITOR_BENCHMARKS.map((comp) => (
                      <tr
                        key={comp.name}
                        className={comp.status === "Leader" ? "bg-[#f0f3ff] font-bold text-[#533afd]" : "text-[#42506a]"}
                      >
                        <td className="py-3 font-semibold">{comp.name}</td>
                        <td className="py-3">{comp.reviews}</td>
                        <td className="py-3">{comp.speed}</td>
                        <td className="py-3">{comp.routes}</td>
                        <td className="py-3">{comp.territory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center pt-2 border-t border-[#e5e7f2]">
                <div className="h-56 w-full">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#777588] mb-2">Market Positioning Radar</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
                      <PolarGrid stroke="#e5e7f2" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#777588", fontSize: 9 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="York Electrical (Rebuilt)" dataKey="York" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
                      <Radar name="Competitor Avg" dataKey="Competitors" stroke="#777588" fill="#777588" fillOpacity={0.15} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Google PAA Snippets */}
                <div className="space-y-2 text-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#777588]">Google AI Overview Queries Answered</p>
                  {GOOGLE_PAA_QUESTIONS.slice(0, 3).map((item) => (
                    <div key={item.q} className="rounded-lg bg-[#f9f9ff] border border-[#e5e7f2] p-2.5">
                      <p className="font-bold text-[#0d1738] truncate">"{item.q}"</p>
                      <p className="text-[#0b8f5b] text-[11px] mt-0.5">✓ Answered in {item.article}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* LINEAR STEP 4: VISUAL ASSET SLOTTING & HIGH-VALUE REBUILD */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    4
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Visual Asset Engine & Hero Studio</h3>
                </div>
                <button
                  onClick={() => alert("Standalone Next.js Project (.zip) generated for " + selectedLead.company + "!\n\n✓ Isolated Next 15 package\n✓ Tailored schema & Tailwind\n✓ Ready to 1-click import into Vercel Free Tier or AWS.")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#07284d] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0c68c8]"
                >
                  <FileCode2 className="h-3.5 w-3.5 text-[#ffd12d]" /> Export Next.js Zip
                </button>
              </div>

              {/* Rendered Live Hero Preview Box (Spennato/BlueBuilt/Roofworx Standard) */}
              <div className="relative overflow-hidden rounded-xl border-2 border-[#07284d] bg-[#07284d] text-white p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px]">
                  <span className="font-semibold flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#ffd12d]" /> 24/7 Dispatch: {selectedLead.phone}
                  </span>
                  <span className="bg-[#ff1744] text-white font-bold px-2 py-0.5 rounded uppercase text-[9px]">
                    Get Free Quote
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr] items-center">
                  <div className="space-y-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-bold text-[#ffd12d] uppercase">
                      #1 Verified {selectedLead.trade} in {selectedLead.location}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black uppercase leading-tight">
                      {selectedLead.company.toUpperCase()}
                    </h2>
                    <div className="flex flex-wrap gap-1.5 text-[9px] font-bold pt-1">
                      <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">⭐ 5.0 (450+ Reviews)</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">🛡️ 100% Guaranteed</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center bg-white/5 rounded-lg p-2 text-center border border-white/10">
                    <div className="h-24 w-full flex items-center justify-center overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80"
                        alt="Owner"
                        className="h-full w-auto object-contain drop-shadow-lg"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#ffd12d] mt-1">
                      {selectedLead.contact} (Founder)
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Slotting Grid */}
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-[#e5e7f2] p-3 space-y-1.5 bg-[#f9f9ff]">
                  <span className="font-bold text-[#0d1738] block text-[11px]">Slot 1: Hero Cutout</span>
                  <span className="rounded bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b] inline-block">
                    ✓ PNG Headshot Active
                  </span>
                </div>
                <div className="rounded-lg border border-[#e5e7f2] p-3 space-y-1.5 bg-[#f9f9ff]">
                  <span className="font-bold text-[#0d1738] block text-[11px]">Slot 2: 6 Service Cards</span>
                  <span className="rounded bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b] inline-block">
                    ✓ 6 High-Res Photos Slotted
                  </span>
                </div>
                <div className="rounded-lg border border-[#e5e7f2] p-3 space-y-1.5 bg-[#f9f9ff]">
                  <span className="font-bold text-[#0d1738] block text-[11px]">Slot 3: 8 Launch Articles</span>
                  <span className="rounded bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b] inline-block">
                    ✓ Google AI Q&A Ready
                  </span>
                </div>
              </div>
            </div>

            {/* LINEAR STEP 5: 1-CLICK BREVO DELIVERY & LIVE TRACKING */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                    5
                  </span>
                  <h3 className="font-bold text-base text-[#0d1738]">Automated Brevo Delivery & Live Proposal Link</h3>
                </div>
                <span className="text-xs font-mono text-[#777588]">magic_983 token</span>
              </div>

              <div className="rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs space-y-3.5">
                <div className="flex justify-between items-center border-b border-[#c7d0fb] pb-2.5 text-[11px]">
                  <span><strong>To:</strong> david@yorkelectrical.com</span>
                  <span><strong>Private Portal:</strong> https://portal.barakahsoft.com/s/york-electrical?auth=magic_983</span>
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

            {/* LINEAR STEP 6: CLOSE & STRIPE $797 CHECKOUT */}
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

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7f2] bg-white py-6 text-center text-xs text-[#777588] mt-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p>© 2026 BarakahSoft LLC · Internal Lead Fulfillment Engine</p>
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
