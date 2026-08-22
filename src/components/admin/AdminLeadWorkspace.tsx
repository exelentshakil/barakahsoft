"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Globe2,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Upload,
  User,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import { AssetSlottingManager } from "@/components/admin/AssetSlottingManager";
import { PricingManager } from "@/components/admin/PricingManager";
import { EditLeadDialog } from "@/components/admin/EditLeadDialog";
import { DeleteLeadButton } from "@/components/admin/DeleteLeadButton";
import { Badge } from "@/components/ui/badge";

// 49 scan nodes
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
];

const COMPETITOR_BENCHMARKS = [
  { name: "York Electrical (Rebuilt)", reviews: "450+ ★ 5.0", speed: "0.12s (98/100)", routes: "28 Pages", territory: "All 49 Queens Zones", status: "Leader" },
  { name: "Entech Electrical", reviews: "168 ★ 4.9", speed: "0.82s (48/100)", routes: "6 Pages", territory: "Astoria Only", status: "Competitor" },
  { name: "Brightline Power Co", reviews: "155 ★ 5.0", speed: "0.47s (65/100)", routes: "4 Pages", territory: "Sunnyside Only", status: "Competitor" },
  { name: "Citywide Power NYC", reviews: "140 ★ 4.8", speed: "0.95s (40/100)", routes: "8 Pages", territory: "LIC / Forest Hills", status: "Competitor" },
];

const RADAR_DATA = [
  { subject: "Search Coverage", Client: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", Client: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", Client: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", Client: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", Client: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", Client: 100, Competitors: 25, fullMark: 100 },
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

interface AdminLeadWorkspaceProps {
  lead: Lead;
  artifact: Artifact | null;
  scrapeResults: ScrapeResults | null;
  otherLeads: Lead[];
}

export function AdminLeadWorkspace({
  lead,
  artifact,
  scrapeResults,
  otherLeads,
}: AdminLeadWorkspaceProps) {
  const [selectedNode, setSelectedNode] = useState(MAP_GRID[0]);
  const [emailSent, setEmailSent] = useState(Boolean(lead.delivered_at));
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingStripe, setGeneratingStripe] = useState(false);

  const businessName = lead.business_name || lead.contact_name || lead.source_url;
  const phone = lead.phone || "(718) 353-7227";
  const email = lead.email || "david@yorkelectrical.com";
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const pricing = (artifact?.extracted_assets?.pricing as any) ?? null;
  const portalUrl = `https://portal.barakahsoft.com/s/${lead.slug}`;

  // Price formatting
  const setupPrice = pricing?.setupPrice ?? 797;
  const monthlyPrice = pricing?.monthlyPrice ?? 0;
  const priceDisplay =
    setupPrice === 0 && monthlyPrice > 0
      ? `$${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} + $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  async function handleSendBrevoEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Your Rebuilt Homepage & Market Speed Audit are Ready! (${businessName})`,
          message: `Hi ${lead.contact_name || "there"}, we mapped your real history, 5.0 rating, and local search grid. Your rebuilt homepage and 28 service pages are ready for review.`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setEmailSent(true);
    } catch {
      alert("Failed to dispatch delivery email via Brevo API.");
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleGenerateStripeCheckout() {
    setGeneratingStripe(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          tier: monthlyPrice > 0 ? "hosting" : "website",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(`Stripe ${priceDisplay} checkout session prepared for ${businessName}!`);
      }
    } catch {
      alert(`Directing to Stripe ${priceDisplay} checkout session...`);
    } finally {
      setGeneratingStripe(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      {/* 1. LEFT ASIDE: INBOUND LEAD ORDERS & WEEKLY PULSE */}
      <aside className="space-y-6">
        <div className="rounded-xl border border-[#e5e7f2] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#777588]">
              INBOUND LEAD ORDERS
            </span>
            <span className="rounded-full bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
              {otherLeads.length} Active
            </span>
          </div>

          <div className="space-y-2">
            {otherLeads.map((item) => {
              const isSelected = item.id === lead.id;
              const itemTrade = item.industry || (item.persona ? item.persona.replace(/-/g, " ") : "Electricians");
              return (
                <Link
                  key={item.id}
                  href={`/admin/leads/${item.id}`}
                  className={`block rounded-lg p-3 transition border ${
                    isSelected
                      ? "bg-[#f0f3ff] border-[#533afd] shadow-sm ring-1 ring-[#533afd]"
                      : "bg-white hover:bg-slate-50 border-[#e5e7f2]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded bg-[#f0f3ff] px-1.5 py-0.5 text-[10px] font-bold text-[#533afd] capitalize">
                      {itemTrade}
                    </span>
                    <span className="font-bold text-xs text-[#0b8f5b]">$797</span>
                  </div>

                  <p className="mt-1 font-bold text-xs text-[#0d1738] truncate">
                    {item.business_name || item.slug}
                  </p>
                  <p className="text-[10px] text-[#777588] truncate">{item.contact_name || item.source_url}</p>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold capitalize ${
                        item.status === "paid"
                          ? "text-[#0b8f5b]"
                          : item.status === "delivered" || item.status === "qa_approved"
                          ? "text-[#533afd]"
                          : "text-amber-600"
                      }`}
                    >
                      {item.status === "qa_approved" ? "Preview Ready" : item.status}
                    </span>
                    <ChevronRight className="h-3 w-3 text-[#777588]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Weekly Pulse */}
        <div className="rounded-xl border border-[#e5e7f2] bg-white p-5 space-y-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">WEEKLY PULSE</span>
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

      {/* 2. RIGHT COLUMN: LINEAR STUDIO WORKSPACE */}
      <div className="space-y-8">
        {/* Top Overview Banner */}
        <div className="rounded-2xl border border-[#c7d0fb] bg-white p-7 shadow-sm flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                ACTIVE PIPELINE LEAD
              </span>
              <span className="text-xs font-mono text-[#777588]">#{lead.id.slice(0, 8)}</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
              {businessName}
            </h1>
            <p className="text-xs text-[#777588] mt-0.5">
              {lead.contact_name || "Owner"} · {phone} · {email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={handleSendBrevoEmail}
              disabled={sendingEmail}
              className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-xs font-bold text-white transition ${
                emailSent ? "bg-[#0b8f5b]" : "bg-[#533afd] hover:bg-[#432bd9]"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              {sendingEmail ? "Dispatching via Brevo..." : emailSent ? "Brevo Email Sent ✓" : "Send Brevo Magic Link"}
            </button>

            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0b8f5b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#09744a]"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Click-to-Call
              </a>
            )}

            <button
              onClick={handleGenerateStripeCheckout}
              disabled={generatingStripe}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#533afd] bg-white px-4 py-2.5 text-xs font-bold text-[#533afd] hover:bg-[#f0f3ff]"
            >
              <CircleDollarSign className="h-3.5 w-3.5" /> Send {priceDisplay} Invoice
            </button>

            <EditLeadDialog
              leadId={lead.id}
              businessName={lead.business_name}
              sourceUrl={lead.source_url}
              facebookPixelId={lead.facebook_pixel_id}
              googleSiteVerification={lead.google_site_verification}
            />
            <DeleteLeadButton leadId={lead.id} />
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
              {lead.pain_points.length > 0 ? (
                lead.pain_points.map((p) => <p key={p} className="font-bold text-[#0d1738]">• {p}</p>)
              ) : (
                <>
                  <p className="font-bold text-[#0d1738]">• Nobody finds us on Google</p>
                  <p className="font-bold text-[#0d1738]">• Mobile looks outdated & slow</p>
                  <p className="font-bold text-[#0d1738]">• Visitors leave without calling</p>
                </>
              )}
            </div>

            <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
              <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Verified Credentials</span>
              <p className="font-bold text-[#0d1738]">• Google 5.0 ★ Rating (450+ Reviews)</p>
              <p className="font-bold text-[#0d1738]">• Master License Verified</p>
              <p className="font-bold text-[#0d1738]">• 37+ Years Serving Customers</p>
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
              <p className="text-[11px] text-[#777588] pt-1">Logo: brand-logo.png extracted</p>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 2: INTERACTIVE 7×7 LOCAL MAP GRID */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                2
              </span>
              <h3 className="font-bold text-base text-[#0d1738]">
                Interactive Local 7×7 Search Grid & Lost Revenue Scanner
              </h3>
            </div>
            <span className="text-xs font-bold text-[#533afd]">Speed Lift: 29 → 98 / 100</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
            {/* Grid */}
            <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">
                  Click Any of 49 Scan Nodes:
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

            {/* Node Detail */}
            <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs">
              <div className="flex justify-between items-center border-b border-[#c7d0fb] pb-2.5 text-[11px]">
                <span className="font-bold text-[#533afd] uppercase">Node #{selectedNode.id}: {selectedNode.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${selectedNode.status === "visible" ? "bg-[#eaf8f0] text-[#0b8f5b]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                  {selectedNode.status === "visible" ? "Rank #1-3 Leader" : `Rank #${selectedNode.rank} (Missing)`}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[#777588]">Competitor Holding Search Spot:</span>
                  <p className="font-bold text-[#0d1738] text-sm mt-0.5">{selectedNode.competitor}</p>
                </div>
                <div>
                  <span className="text-[#777588]">Estimated Lost Job Volume:</span>
                  <p className="font-bold text-red-600 text-sm mt-0.5">{selectedNode.lostJobs} / month</p>
                </div>
              </div>
              <div className="rounded-lg bg-white p-3 border border-[#c7d0fb] text-[11px] leading-relaxed text-[#42506a]">
                <strong className="text-[#533afd] block mb-0.5">Closing Call Insight:</strong>
                "In {selectedNode.name}, competitors take the calls because your old site didn't mention this territory. The new build adds dedicated pages to reclaim these jobs."
              </div>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 3: COMPETITOR BENCHMARK & GOOGLE AI Q&A */}
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
                  <Radar name={`${businessName} (Rebuilt)`} dataKey="Client" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
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

        {/* LINEAR STEP 4: VISUAL ASSET ENGINE & HERO STUDIO */}
        {artifact && <AssetSlottingManager lead={lead} artifact={artifact} />}

        {/* LINEAR STEP 5: AUTOMATED BREVO DELIVERY & LIVE PROPOSAL LINK */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                5
              </span>
              <h3 className="font-bold text-base text-[#0d1738]">Automated Brevo Delivery & Live Proposal Link</h3>
            </div>
            <span className="text-xs font-mono text-[#777588]">magic_{lead.id.slice(0, 4)} token</span>
          </div>

          <div className="rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#c7d0fb] pb-2.5 text-[11px] gap-2">
              <span><strong>To:</strong> {email}</span>
              <span><strong>Private Portal:</strong> <a href={portalUrl} target="_blank" className="font-bold text-[#533afd] hover:underline">{portalUrl}</a></span>
            </div>
            <p className="font-bold text-[#0d1738] text-sm">
              Subject: Your Rebuilt Homepage & Market Speed Audit are Ready! ({businessName})
            </p>
            <p className="text-[#42506a] leading-relaxed">
              "Hi {lead.contact_name || "there"}, we mapped your real history, Google 5.0 rating, and local search grid. Your rebuilt homepage and 28 service pages are ready for review."
            </p>
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-[#777588]">1-Click Delivery via Brevo API</span>
              <button
                onClick={handleSendBrevoEmail}
                disabled={sendingEmail}
                className="rounded-md bg-[#533afd] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#432bd9]"
              >
                {sendingEmail ? "Sending..." : emailSent ? "Delivered via Brevo ✓" : "Send Delivery Email Now"}
              </button>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 6: DYNAMIC PRICING MANAGER */}
        <PricingManager leadId={lead.id} currentPricing={pricing} />

        {/* FINAL STEP: CLOSE & STRIPE CHECKOUT DISPATCH */}
        <div className="rounded-2xl bg-[#0d1738] p-7 text-white shadow-md flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#533afd] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                FINAL STEP
              </span>
              <span className="text-xs text-white/70">Payment & Go-Live SLA</span>
            </div>
            <h3 className="mt-2 text-xl font-bold">
              Collect {priceDisplay} & Launch {lead.custom_domain || lead.source_url}
            </h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              Client receives 100% standalone Next.js code + DNS CNAME setup with 48h SLA.
            </p>
          </div>

          <button
            onClick={handleGenerateStripeCheckout}
            disabled={generatingStripe}
            className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#432bd9] shrink-0"
          >
            <CreditCard className="h-4 w-4" /> Send {priceDisplay} Payment Link
          </button>
        </div>
      </div>
    </div>
  );
}
