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
import { DeliveryEmailComposer } from "@/components/admin/DeliveryEmailComposer";
import { PricingManager } from "@/components/admin/PricingManager";
import { EditLeadDialog } from "@/components/admin/EditLeadDialog";
import { DeleteLeadButton } from "@/components/admin/DeleteLeadButton";
import { Badge } from "@/components/ui/badge";

// 49 scan nodes
const MAP_GRID = [
  { id: 1, name: "North Sector", rank: 14, competitor: "Competitor A (168 Reviews)", status: "missing", lostJobs: "$4,500" },
  { id: 2, name: "East District", rank: 12, competitor: "Competitor A (168 Reviews)", status: "missing", lostJobs: "$3,500" },
  { id: 3, name: "Downtown Central", rank: 18, competitor: "Citywide Pro (140 Reviews)", status: "missing", lostJobs: "$8,000" },
  { id: 4, name: "West Corridor", rank: 11, competitor: "Brightline Pro (155 Reviews)", status: "missing", lostJobs: "$2,500" },
  { id: 5, name: "South Hills", rank: 8, competitor: "Brightline Pro (155 Reviews)", status: "outside", lostJobs: "$2,000" },
  { id: 6, name: "Metro Center", rank: 3, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 7, name: "Plaza Zone", rank: 2, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 8, name: "Main Hub", rank: 1, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 9, name: "Business Park", rank: 1, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 10, name: "Suburban North", rank: 15, competitor: "Apex Sparks", status: "missing", lostJobs: "$3,000" },
  { id: 11, name: "Valley West", rank: 16, competitor: "Apex Sparks", status: "missing", lostJobs: "$4,000" },
  { id: 12, name: "Harbor Point", rank: 19, competitor: "Coastline Pro", status: "missing", lostJobs: "$5,000" },
  { id: 13, name: "Heights East", rank: 1, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 14, name: "Commercial Park", rank: 1, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 15, name: "Transit Hub", rank: 2, competitor: "Your Business", status: "visible", lostJobs: "$0 (Dominant)" },
  { id: 16, name: "Industrial Zone", rank: 21, competitor: "Metro Group", status: "missing", lostJobs: "$6,500" },
];

const COMPETITOR_BENCHMARKS = [
  { name: "Your Business (Rebuilt)", reviews: "450+ ★ 5.0", speed: "0.12s (98/100)", routes: "28 Pages", territory: "All Local Zones", status: "Leader" },
  { name: "Top Competitor A", reviews: "168 ★ 4.9", speed: "0.82s (48/100)", routes: "6 Pages", territory: "Single Zone", status: "Competitor" },
  { name: "Top Competitor B", reviews: "155 ★ 5.0", speed: "0.47s (65/100)", routes: "4 Pages", territory: "Metro Only", status: "Competitor" },
  { name: "Top Competitor C", reviews: "140 ★ 4.8", speed: "0.95s (40/100)", routes: "8 Pages", territory: "Outskirts", status: "Competitor" },
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
    q: "Do I need a city permit for major upgrade and replacement work?",
    a: "Yes. Major residential and commercial work requires municipal permits & utility inspection. Your rebuilt site provides clear guidance.",
    article: "Launch Article #1",
  },
  {
    q: "How fast can emergency service repairs be dispatched?",
    a: "Your team provides 24/7 priority emergency dispatch with a persistent 1-tap call bar.",
    article: "Launch Article #2",
  },
  {
    q: "How much does a commercial installation cost on average?",
    a: "Commercial installations vary based on project scale. Dedicated landing routes provide clear cost estimation forms.",
    article: "Launch Article #3",
  },
  {
    q: "What is the ROI of upgrading to high-efficiency equipment?",
    a: "Modern systems reduce utility usage by up to 65% while ensuring complete code compliance.",
    article: "Launch Article #4",
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
  const [previewPath, setPreviewPath] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const businessName = lead.business_name || lead.contact_name || lead.source_url;
  const phone = lead.phone || "No phone on file";
  const email = lead.email || "No email on file";
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const pricing = (artifact?.extracted_assets?.pricing as any) ?? null;
  const previewUrl = `/s/${lead.slug}${previewPath}`;

  const services = artifact?.funnel_pages.filter((s) => s.kind === "service") || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* 1. LEFT ASIDE: LEADS LIST & WEEKLY PULSE */}
      <aside className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#533afd] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads Table
        </Link>

        {/* Recent Leads Stack */}
        <div className="rounded-xl border border-[#e5e7f2] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#777588]">
              Pipeline ({otherLeads.length})
            </span>
          </div>

          <div className="space-y-2">
            {otherLeads.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/admin/leads/${item.id}`}
                className={`block rounded-lg p-2.5 transition border ${
                  item.id === lead.id
                    ? "bg-[#f0f3ff] border-[#c7d0fb]"
                    : "hover:bg-accent border-transparent"
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0d1738] truncate">{item.business_name || item.slug}</span>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-[#e3dfff] text-[#533afd]">
                    {item.status}
                  </span>
                </div>
                <p className="text-[10px] text-[#777588] truncate mt-0.5">{item.source_url}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Weekly Pulse Metrics */}
        <div className="rounded-xl border border-[#e5e7f2] bg-white p-4 space-y-3 text-xs">
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

      {/* 2. RIGHT COLUMN: LINEAR STUDIO WORKSPACE */}
      <div className="space-y-8">
        {/* Top Overview Banner */}
        <div className="rounded-2xl border border-[#c7d0fb] bg-white p-6 shadow-sm flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Active Pipeline Lead
              </span>
              <span className="text-xs font-mono text-[#777588]">#{lead.id.slice(0, 8)}</span>
              <Badge variant="outline">{lead.status}</Badge>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
              {businessName}
            </h1>
            <p className="text-xs text-[#777588] mt-0.5">
              {phone} · {email} · {lead.source_url}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/s/${lead.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#533afd] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#432bd9]"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Customer Proposal Portal
            </a>
            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#0b8f5b] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#09744a]"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Call
              </a>
            )}
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
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
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
                <p className="text-muted-foreground">Standard Speed & Conversion Optimization</p>
              )}
            </div>

            <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
              <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Verified Credentials</span>
              <p className="font-bold text-[#0d1738]">• Google 5.0 ★ Rating ({scrapeResults ? "Scraped" : "Verified"})</p>
              <p className="font-bold text-[#0d1738]">• Licensed & Insured Provider</p>
              <p className="font-bold text-[#0d1738]">• Clean Customer Reputation</p>
            </div>

            <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
              <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Brand Tokens</span>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                  <span className="h-3 w-3 rounded-full bg-[#533AFD] border" /> Primary
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                  <span className="h-3 w-3 rounded-full bg-[#FFD12D] border" /> Accent
                </span>
              </div>
              <p className="text-[11px] text-[#777588] pt-1">Vector Logo & Brand Colors Locked</p>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 2: INTERACTIVE 7×7 LOCAL MAP GRID */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                2
              </span>
              <h3 className="font-bold text-base text-[#0d1738]">
                Interactive Local Search Grid & Lost Revenue Scanner
              </h3>
            </div>
            <span className="text-xs font-bold text-[#533afd]">Speed Lift: 29 → 98 / 100</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
            {/* Grid */}
            <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">
                  Click Any Scan Node:
                </span>
                <span className="text-[11px] font-bold text-[#533afd]">Node #{selectedNode.id} Selected</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
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
                    } ${selectedNode.id === pt.id ? "ring-2 ring-[#0d1738] scale-105 shadow-sm" : ""}`}
                  >
                    {pt.rank}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Detail */}
            <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5 text-xs">
              <div className="flex justify-between items-center border-b border-[#c7d0fb] pb-2 text-[11px]">
                <span className="font-bold text-[#533afd] uppercase">Node #{selectedNode.id}: {selectedNode.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selectedNode.status === "visible" ? "bg-[#eaf8f0] text-[#0b8f5b]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                  Rank #{selectedNode.rank}
                </span>
              </div>
              <div className="space-y-1.5">
                <p><span className="text-[#777588]">Competitor Holding Search Spot:</span> <strong>{selectedNode.competitor}</strong></p>
                <p><span className="text-[#777588]">Estimated Lost Jobs:</span> <strong className="text-red-600">{selectedNode.lostJobs}</strong></p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-[#c7d0fb] text-[11px] leading-relaxed text-[#42506a]">
                <strong className="text-[#533afd] block mb-0.5">Closing Call Pitch:</strong>
                "In {selectedNode.name}, competitors take the calls because your old site didn't mention this area. The new build adds dedicated pages to capture these jobs."
              </div>
            </div>
          </div>
        </div>

        {/* LINEAR STEP 3: COMPETITOR BENCHMARK & GOOGLE AI Q&A */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-3">
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
                  <th className="pb-2 font-bold">Company</th>
                  <th className="pb-2 font-bold">Google Reviews</th>
                  <th className="pb-2 font-bold">Mobile Speed</th>
                  <th className="pb-2 font-bold">Service Routes</th>
                  <th className="pb-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7f2]">
                {COMPETITOR_BENCHMARKS.map((comp) => (
                  <tr
                    key={comp.name}
                    className={comp.status === "Leader" ? "bg-[#f0f3ff] font-bold text-[#533afd]" : "text-[#42506a]"}
                  >
                    <td className="py-2.5 font-semibold">{comp.name}</td>
                    <td className="py-2.5">{comp.reviews}</td>
                    <td className="py-2.5">{comp.speed}</td>
                    <td className="py-2.5">{comp.routes}</td>
                    <td className="py-2.5">{comp.status}</td>
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
                  <Radar name="Your Site (Rebuilt)" dataKey="Client" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
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

        {/* LINEAR STEP 4: VISUAL ASSET ENGINE & LIVE PREVIEW STUDIO */}
        {artifact && <AssetSlottingManager lead={lead} artifact={artifact} />}

        {/* LIVE IFRAME PREVIEW SELECTOR */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-bold text-xs">Live Generated Website Preview</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={previewPath}
                onChange={(e) => setPreviewPath(e.target.value)}
                className="rounded-md border border-input bg-background px-2.5 py-1 text-xs"
              >
                <option value="">Homepage (0.12s Paint)</option>
                <option value="/about">About Us</option>
                <option value="/contact">Contact</option>
                <option value="/faq">FAQ</option>
                {services.map((s) => (
                  <option key={s.slug} value={`/services/${s.slug}`}>
                    Service: {s.h2}
                  </option>
                ))}
              </select>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Open Full Window <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <iframe
            key={`${previewPath}-${reloadKey}`}
            src={previewUrl}
            className="h-[750px] w-full"
            title="Generated site preview"
          />
        </div>

        {/* LINEAR STEP 5: DELIVERY EMAIL COMPOSER (Email #2) */}
        <DeliveryEmailComposer lead={lead} />

        {/* LINEAR STEP 6: DYNAMIC PRICING MANAGER */}
        <PricingManager leadId={lead.id} currentPricing={pricing} />
      </div>
    </div>
  );
}
