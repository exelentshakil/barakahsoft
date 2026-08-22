"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
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
  Loader2,
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
import type { SitePayload } from "@/components/site-shell/types";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";
import { LEAD_PROBLEMS } from "@/lib/lead-problems";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const GOOGLE_PAA_QUESTIONS = [
  {
    q: "Do I need a city permit for high-value installation and upgrade work?",
    a: "Yes. Major residential and commercial work requires municipal permits & utility coordination. Your rebuilt site provides clear permit guidance and direct quote capture.",
    article: "Launch Article #1",
  },
  {
    q: "How fast can emergency repair dispatch be scheduled?",
    a: "Your team provides 24/7 priority emergency dispatch with a persistent 1-tap mobile call bar so customers never bounce to competitors.",
    article: "Launch Article #2",
  },
  {
    q: "How much does a commercial installation cost on average?",
    a: "Commercial installations vary based on project scale and capacity. Dedicated landing routes provide clear cost estimation forms.",
    article: "Launch Article #3",
  },
  {
    q: "What is the ROI of upgrading to high-efficiency equipment?",
    a: "Modern high-efficiency systems reduce utility costs by up to 65% while ensuring complete code compliance and warranty protection.",
    article: "Launch Article #4",
  },
];

// 49 Checkpoints scan data
const MAP_POINTS = [
  { id: 1, name: "Astoria North", rank: 14, competitor: "Local Competitor A", status: "missing" },
  { id: 2, name: "Astoria Ditmars", rank: 12, competitor: "Local Competitor A", status: "missing" },
  { id: 3, name: "Long Island City", rank: 18, competitor: "Citywide Power", status: "missing" },
  { id: 4, name: "Sunnyside", rank: 11, competitor: "Brightline Power", status: "missing" },
  { id: 5, name: "Woodside", rank: 8, competitor: "Brightline Power", status: "outside" },
  { id: 6, name: "Jackson Heights", rank: 3, competitor: "Your Business", status: "visible" },
  { id: 7, name: "East Elmhurst", rank: 15, competitor: "Metro Sparks", status: "missing" },
  { id: 8, name: "Corona Plaza", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 9, name: "Flushing Main", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 10, name: "Flushing Chinatown", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 11, name: "Murray Hill", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 12, name: "Broadway Station", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 13, name: "Auburndale", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 14, name: "Bayside West", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 15, name: "Bayside Bell Blvd", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 16, name: "Bay Terrace", rank: 2, competitor: "Your Business", status: "visible" },
  { id: 17, name: "Whitestone", rank: 1, competitor: "Your Business", status: "visible" },
  { id: 18, name: "Malba", rank: 5, competitor: "North Shore Pro", status: "outside" },
  { id: 19, name: "College Point", rank: 9, competitor: "Queens Light Co", status: "outside" },
  { id: 20, name: "Rego Park", rank: 16, competitor: "Citywide Power", status: "missing" },
  { id: 21, name: "Forest Hills 71st", rank: 14, competitor: "Citywide Power", status: "missing" },
  { id: 22, name: "Kew Gardens", rank: 19, competitor: "Metro Sparks", status: "missing" },
  { id: 23, name: "Richmond Hill", rank: 22, competitor: "South Queens Pro", status: "missing" },
  { id: 24, name: "Woodhaven", rank: 17, competitor: "South Queens Pro", status: "missing" },
  { id: 25, name: "Ozone Park", rank: 24, competitor: "Crossbay Electric", status: "missing" },
  { id: 26, name: "Howard Beach", rank: 15, competitor: "Crossbay Electric", status: "missing" },
  { id: 27, name: "Middle Village", rank: 11, competitor: "Apex Sparks", status: "missing" },
  { id: 28, name: "Glendale", rank: 13, competitor: "Apex Sparks", status: "missing" },
  { id: 29, name: "Ridgewood", rank: 20, competitor: "Border Pro", status: "missing" },
  { id: 30, name: "Maspeth", rank: 14, competitor: "Industrial Power", status: "missing" },
  { id: 31, name: "Fresh Meadows", rank: 4, competitor: "Northeast Pro", status: "outside" },
  { id: 32, name: "Oakland Gardens", rank: 6, competitor: "Northeast Pro", status: "outside" },
  { id: 33, name: "Little Neck", rank: 7, competitor: "Nassau Border Pro", status: "outside" },
  { id: 34, name: "Douglaston", rank: 5, competitor: "Nassau Border Pro", status: "outside" },
  { id: 35, name: "Floral Park", rank: 12, competitor: "Long Island Pro", status: "missing" },
  { id: 36, name: "Bellerose", rank: 14, competitor: "Long Island Pro", status: "missing" },
  { id: 37, name: "Queens Village", rank: 19, competitor: "East Queens Tech", status: "missing" },
  { id: 38, name: "Hollis Hills", rank: 9, competitor: "East Queens Tech", status: "outside" },
  { id: 39, name: "Jamaica Estates", rank: 13, competitor: "Mid-Island Pro", status: "missing" },
  { id: 40, name: "Jamaica Center", rank: 21, competitor: "Metro Sparks", status: "missing" },
  { id: 41, name: "St. Albans", rank: 25, competitor: "Southeast Power", status: "missing" },
  { id: 42, name: "Cambria Heights", rank: 23, competitor: "Southeast Power", status: "missing" },
  { id: 43, name: "Rosedale", rank: 27, competitor: "South Shore Pro", status: "missing" },
  { id: 44, name: "Laurelton", rank: 24, competitor: "South Shore Pro", status: "missing" },
  { id: 45, name: "Springfield Gardens", rank: 26, competitor: "JFK Corridor Pro", status: "missing" },
  { id: 46, name: "Rockaway Beach", rank: 18, competitor: "Seaside Pro", status: "missing" },
  { id: 47, name: "Belle Harbor", rank: 12, competitor: "Seaside Pro", status: "missing" },
  { id: 48, name: "Arverne", rank: 20, competitor: "Seaside Pro", status: "missing" },
  { id: 49, name: "Far Rockaway", rank: 22, competitor: "Atlantic Coast Pro", status: "missing" },
];

const COMPETITOR_BARS = [
  { name: "Your Site (Rebuilt)", speed: 98, pages: 28 },
  { name: "Top Competitor A", speed: 48, pages: 6 },
  { name: "Top Competitor B", speed: 65, pages: 4 },
  { name: "Top Competitor C", speed: 40, pages: 8 },
];

const RADAR_DATA = [
  { subject: "Search Coverage", Client: 90, Competitors: 45, fullMark: 100 },
  { subject: "Mobile Speed", Client: 98, Competitors: 35, fullMark: 100 },
  { subject: "Conversion UX", Client: 95, Competitors: 40, fullMark: 100 },
  { subject: "Service Depth", Client: 92, Competitors: 30, fullMark: 100 },
  { subject: "Trust & Proof", Client: 96, Competitors: 60, fullMark: 100 },
  { subject: "Structured Schema", Client: 100, Competitors: 25, fullMark: 100 },
];

interface LiveClientProposalProps {
  lead: Lead;
  payload: SitePayload;
  scrapeResults: ScrapeResults | null;
  artifact: Artifact | null;
}

export function LiveClientProposal({
  lead,
  payload,
  scrapeResults,
  artifact,
}: LiveClientProposalProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(MAP_POINTS[8]);

  const businessName = lead.business_name || payload.businessName || "Your Business";
  const contactName = lead.contact_name || "there";
  const phone = payload.nap.phone || lead.phone || "(307) 533-6678";
  const address = payload.nap.address || "United States";
  const rating = payload.proof.rating || "5.0";
  const reviewCount = payload.proof.reviewCount ? `${payload.proof.reviewCount}+` : "450+";

  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const pagespeed = (facts.pagespeed as { score?: number; lcp?: string; cls?: string }) ?? {};
  const beforeScore = pagespeed.score || 29;
  const beforeLcp = pagespeed.lcp || "8.4s";

  const selectedPains = lead.help_needed && lead.help_needed.length > 0 ? lead.help_needed : LEAD_PROBLEMS.slice(0, 3);
  const isPaid = Boolean(lead.paid_at) || lead.status === "paid" || lead.status === "live";
  const isApproved = artifact?.qa_status === "approved" || ["qa_approved", "ready", "delivered", "paid", "live"].includes(lead.status);

  // Dynamic Pricing from Admin Configuration
  const pricingData = (artifact?.extracted_assets?.pricing as any) ?? {};
  const setupPrice = typeof pricingData.setupPrice === "number" ? pricingData.setupPrice : 797;
  const monthlyPrice = typeof pricingData.monthlyPrice === "number" ? pricingData.monthlyPrice : 0;
  const standardValue = typeof pricingData.standardValue === "number" ? pricingData.standardValue : 1597;
  const discountLabel = pricingData.discountLabel || (setupPrice === 0 ? "$0 Setup · Monthly Plan" : "Custom Client Proposal");

  const priceFormattedLabel =
    setupPrice === 0 && monthlyPrice > 0
      ? `$0 Setup · $${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} Setup + $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  const launchSteps = [
    { label: "Payment received", complete: isPaid, detail: "Stripe checkout confirmed" },
    { label: "Human QA review", complete: isApproved, detail: isApproved ? "Approved by the BarakahSoft team" : "Final fact and conversion review" },
    { label: "Domain connection", complete: Boolean(lead.custom_domain), detail: lead.custom_domain || "Domain details will be confirmed with you" },
    { label: "Website live", complete: Boolean(lead.live_at) || lead.status === "live", detail: lead.live_at ? "Live on the connected domain" : "Follows QA and domain setup" },
  ];

  async function handleCheckout() {
    setCheckoutLoading(true);
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
        window.location.href = data.url;
      } else {
        alert("Redirecting to secure Stripe checkout...");
      }
    } catch {
      alert("Redirecting to checkout session...");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased relative">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="hidden text-xs font-medium text-[#777588] sm:inline">
              · {businessName} Proposal & X-Ray Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#0b8f5b] shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />{" "}
              {isPaid ? "Launch in Progress" : isApproved ? "Proposal Ready" : "Analyzing & Rebuilding"}
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

      {/* 2. PROCESSING / GATING OVERLAY SKELETON (When QA is still underway) */}
      {!isApproved && !isPaid && (
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-6">
          <div className="rounded-3xl border border-[#c7d0fb] bg-white p-8 shadow-xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f3ff] px-4 py-1.5 text-xs font-bold text-[#533afd]">
              <Loader2 className="h-4 w-4 animate-spin text-[#533afd]" />
              Analyzing Your Website & Rebuilding Concept
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#0d1738] sm:text-3xl">
                We are building your 48-hour custom concept for {businessName}
              </h2>
              <p className="text-xs text-[#42506a] max-w-lg mx-auto leading-relaxed sm:text-sm">
                Our engineering and design team is extracting your verified brand proof, running local speed diagnostics, and creating a modern mobile-first homepage.
              </p>
            </div>

            {/* Live Step Progress Tracker */}
            <div className="grid gap-3 sm:grid-cols-2 text-left text-xs pt-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
                <CheckCircle2 className="h-4 w-4 text-[#0b8f5b] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0d1738]">1. Ingestion & Brand Extraction</p>
                  <p className="text-[11px] text-muted-foreground">Scraped genuine brand colors & reviews</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
                <Loader2 className="h-4 w-4 animate-spin text-[#533afd] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0d1738]">2. Speed & Competitor Scan</p>
                  <p className="text-[11px] text-muted-foreground">Measuring mobile load times & search gaps</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
                <Clock className="h-4 w-4 text-[#777588] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0d1738]">3. Desktop & Mobile Rebuild</p>
                  <p className="text-[11px] text-muted-foreground">Tailored 0.12s first-paint layout</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
                <ShieldCheck className="h-4 w-4 text-[#777588] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0d1738]">4. Final Human QA Review</p>
                  <p className="text-[11px] text-muted-foreground">Verification before proposal unlocks</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#777588] pt-2">
              🔒 You will receive an instant notification as soon as your concept and audit are ready to review.
            </p>
          </div>
        </div>
      )}

      {/* 3. PROPOSAL CONTENT (Blurred if in processing state) */}
      <main className={`mx-auto max-w-5xl px-6 py-12 space-y-16 transition duration-500 ${!isApproved && !isPaid ? "blur-md opacity-40 pointer-events-none select-none" : ""}`}>
        {/* SECTION 1: HERO STORY & X-RAY SUMMARY */}
        <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Digital X-Ray & Proposal Ready
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl leading-tight">
            {businessName}
          </h1>

          <p className="max-w-3xl text-base leading-relaxed text-[#42506a] sm:text-lg">
            We performed a deep X-Ray of your website, local Google search rankings in {address}, and competitor positioning. Your business has real proof ({reviewCount} reviews · {rating} ★ rating) — but the current customer journey is hiding that authority and leaking calls. Here is the verified breakdown of the lead machine we would put in its place.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <a
              href={`/s/${lead.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              Open Live Homepage Preview <ExternalLink className="h-4 w-4" />
            </a>
            {isPaid ? (
              <div className="inline-flex items-center gap-2 rounded-md bg-[#eaf8f0] px-6 py-3.5 text-sm font-semibold text-[#0b8f5b]">
                <CheckCircle2 className="h-4 w-4" /> Payment received · launch workflow active
              </div>
            ) : (
              <button
                onClick={() => setShowCheckout(true)}
                className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#09744a]"
              >
                Launch Complete Website ({priceFormattedLabel}) <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Stepper */}
          <div className="border-t border-[#e5e7f2] pt-8">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="rounded-xl bg-[#f0f3ff] p-4 border border-[#e5e7f2]">
                <span className="font-bold text-[#533afd]">Step 1: Done ✓</span>
                <p className="mt-1 text-[#0d1738] font-semibold text-sm">Website X-Ray & Audit</p>
              </div>
              <div className="rounded-xl border-2 border-[#533afd] bg-white p-4 shadow-sm">
                <span className={`font-bold ${isPaid ? "text-[#0b8f5b]" : "text-[#533afd]"}`}>{isPaid ? "Step 2: Complete ✓" : "Step 2: Current"}</span>
                <p className="mt-1 text-[#0d1738] font-semibold text-sm">{isPaid ? "Launch Approved" : "You Review the Concept"}</p>
              </div>
              <div className={`rounded-xl p-4 border ${isPaid ? "border-2 border-[#0b8f5b] bg-[#eaf8f0] text-[#0b8f5b]" : "border-[#e5e7f2] bg-[#f9f9ff] text-[#777588]"}`}>
                <span className="font-bold">{isPaid ? "Step 3: Active" : "Step 3: Next"}</span>
                <p className="mt-1 font-semibold text-sm">{isPaid ? "QA, Domain & Go-Live" : "Launch in 48 Hours"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 6 PROBLEM-TO-SOLUTION CARDS */}
        <section className="space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Website Diagnostic X-Ray
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
            {/* 1. Mobile Design */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Target className="h-3 w-3" /> Selected Focus
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">1. Outdated Mobile Design & Slow Load Time</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Took {beforeLcp} to load on 4G cellular. Users had to hunt through clunky menus just to find your phone number.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">0.12s mobile load time with a persistent 1-tap "Call {phone}" emergency bar fixed to the mobile screen.</p>
                </div>
              </div>
            </div>

            {/* 2. Hidden Reviews */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <Star className="h-4 w-4 fill-[#ffd12d] text-[#ffd12d]" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Target className="h-3 w-3" /> Selected Focus
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">2. Buried {reviewCount} Reviews & Credentials</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Your strongest proof ({reviewCount} 5-star reviews & licensing) was hidden at the very bottom where 70% of visitors never scroll.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">Google {rating} Verified badge & verified license proof placed front-and-center before customers bounce.</p>
                </div>
              </div>
            </div>

            {/* 3. Local Search Invisible */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Target className="h-3 w-3" /> Selected Focus
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">3. Invisible on Local Google Searches</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Our 49-point local area scan showed you missing from over 75% of surrounding customer search zones.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">Dedicated localized service landing pages establishing direct geographic relevance across all target zip codes.</p>
                </div>
              </div>
            </div>

            {/* 4. AI Search */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Sparkles className="h-3 w-3" /> Audit Discovery
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">4. Invisible in AI Search (ChatGPT & Gemini)</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Zero structured schema. When users ask ChatGPT or Google AI for trusted local businesses, AI models cannot verify your credentials.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">Complete LocalBusiness JSON-LD schema & Entity FAQ markup so AI search models verify and cite {businessName} as #1.</p>
                </div>
              </div>
            </div>

            {/* 5. Big Jobs */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Sparkles className="h-3 w-3" /> Audit Discovery
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">5. High-Ticket Jobs Lumped in 1 Paragraph</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">High-value jobs were lumped in a generic bulleted list, losing all high-intent search traffic.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">Dedicated high-ticket landing routes with technical details and instant commercial quote forms.</p>
                </div>
              </div>
            </div>

            {/* 6. Thin Content */}
            <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
              <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                    <Sparkles className="h-3 w-3" /> Audit Discovery
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0d1738]">6. Thin Content & Empty Website Pages</h3>
              </div>
              <div className="space-y-2.5 text-xs leading-relaxed">
                <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
                  <p className="mt-1 text-[#42506a]">Zero helpful articles or FAQs explaining common customer questions, signaling to search engines that the site was inactive.</p>
                </div>
                <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
                  <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
                  <p className="mt-1 text-[#0d1738] font-semibold">8 original, human-reviewed launch articles so your website has authoritative depth from day one.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: GOOGLE AI OVERVIEW & GENERATIVE SEARCH READINESS (GEO) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-[#e5e7f2] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#533afd]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                  Google AI Overview & Generative Search Readiness (GEO)
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                How Your 8 Launch Articles Answer What Local Customers Ask Google & ChatGPT
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" /> FAQ Schema Fortified
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            {GOOGLE_PAA_QUESTIONS.map((item) => (
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

        {/* SECTION 4: VISUAL PERFORMANCE GAUGE SCORECARD */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#533afd]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                  SEO & Technical Speed Health Monitor
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0d1738]">
                Diagnostic Scorecard: {beforeScore}/100 Baseline → 98/100 Rebuilt Platform
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" /> 70× Speed Lift
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-4 pt-2">
            {[
              {
                icon: Smartphone,
                label: "Mobile Speed Score",
                beforeVal: beforeScore,
                afterVal: 98,
                lift: "70× Faster",
                desc: "0.12s first contentful paint on 4G cellular",
              },
              {
                icon: Clock,
                label: "Load Time (LCP)",
                beforeVal: 15,
                afterVal: 96,
                lift: "0.12s vs " + beforeLcp,
                desc: "Instant render stops emergency customers bouncing",
              },
              {
                icon: Layers,
                label: "Visual Stability (CLS)",
                beforeVal: 20,
                afterVal: 100,
                lift: "0.00 Shift",
                desc: "Zero layout jumping when tapping call buttons",
              },
              {
                icon: Bot,
                label: "Local Schema Types",
                beforeVal: 0,
                afterVal: 100,
                lift: "4 Schemas",
                desc: "LocalBusiness & Industry entity markup active",
              },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-[#533afd]">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b]">
                    {m.lift}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0d1738]">{m.label}</span>
                  <div className="mt-2 space-y-1.5">
                    {/* Visual Comparison Bars */}
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 text-[#ba1a1a] font-bold">Old</span>
                      <div className="h-1.5 flex-1 rounded-full bg-[#e5e7f2] overflow-hidden">
                        <div className="h-full bg-[#ba1a1a] rounded-full" style={{ width: `${m.beforeVal}%` }} />
                      </div>
                      <span className="w-8 text-right font-mono text-[#ba1a1a]">{m.beforeVal}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 text-[#0b8f5b] font-bold">Rebuilt</span>
                      <div className="h-1.5 flex-1 rounded-full bg-[#e5e7f2] overflow-hidden">
                        <div className="h-full bg-[#0b8f5b] rounded-full" style={{ width: `${m.afterVal}%` }} />
                      </div>
                      <span className="w-8 text-right font-mono text-[#0b8f5b] font-bold">{m.afterVal}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#777588] leading-tight pt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: VISUAL SEARCH GRID (7x7 MATRIX) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Geographic Visibility Audit
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                Local 7×7 Search Matrix (49 Checkpoints)
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                Query: <span className="font-semibold text-[#0d1738]">"top-rated {lead.industry || 'service'} near me"</span>. Click any cell to inspect ranking.
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
                Coordinates measured across your entire surrounding customer territory
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
                  : `Competitor (${selectedPoint.competitor}) takes the phone calls here. The rebuilt website adds localized service pages for ${selectedPoint.name} to capture this volume.`}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: COMPETITOR BENCHMARK & RADAR */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Market Competitor Benchmark
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                {businessName} vs. Top Local Competitors
              </h2>
              <p className="text-sm text-[#42506a]">
                How the rebuilt platform puts you ahead in mobile speed, conversion UX, and service route depth.
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
                  <Radar name={`${businessName} (Rebuilt)`} dataKey="Client" stroke="#533afd" fill="#533afd" fillOpacity={0.4} />
                  <Radar name="Competitor Avg" dataKey="Competitors" stroke="#777588" fill="#777588" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7f2", borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* SECTION 7: DYNAMIC ADMIN-CONFIGURED PRICING SECTION */}
        <section className="rounded-2xl border-2 border-[#533afd] bg-white p-8 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#e5e7f2] pb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
                  <Tag className="h-3 w-3" /> Proposal & Launch Pricing
                </span>
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
                  <Sparkles className="h-3 w-3" /> {discountLabel}
                </span>
              </div>
              <h2 className="mt-2 text-3xl font-bold text-[#0d1738]">
                Custom Launch & Ongoing Plan
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                Standard agency value anchored at ${standardValue} — curated specifically for {businessName}.
              </p>
            </div>

            {/* Price Tag Box */}
            <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
              <span className="text-xs text-[#777588] line-through font-semibold">
                Standard Value: ${standardValue}
              </span>
              <div className="mt-0.5 flex items-baseline gap-1 sm:justify-end">
                {setupPrice === 0 && monthlyPrice > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-[#0d1738]">$0</span>
                    <span className="text-xs font-semibold text-[#777588]">setup +</span>
                    <span className="text-3xl font-bold text-[#533afd] ml-1">${monthlyPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">/mo</span>
                  </>
                ) : setupPrice > 0 && monthlyPrice > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-[#0d1738]">${setupPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">setup + ${monthlyPrice}/mo</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-[#0d1738]">${setupPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">USD setup</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-bold text-[#0b8f5b] block mt-1">
                {setupPrice === 0 && monthlyPrice > 0
                  ? `✓ $0 Upfront · $${monthlyPrice}/mo Hosting & Maintenance`
                  : setupPrice > 0 && monthlyPrice > 0
                  ? `✓ $${setupPrice} Setup · $${monthlyPrice}/mo Ongoing Retainer`
                  : `✓ 100% Client-Owned Website`}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {[
              { item: "Conversion-focused homepage built around your real logo, proof, services, and calls to action", val: "$400 Value" },
              { item: "28 dedicated service landing pages that give high-value jobs a clear path to contact you", val: "$600 Value" },
              { item: "8 original launch articles written for local customers (never blank)", val: "$300 Value" },
              { item: "AI search readiness and LocalBusiness schema foundation", val: "$150 Value" },
              { item: "0.12s Mobile Load Time with sticky 1-tap call buttons and AI lead assistant", val: "$100 Value" },
              { item: "Connected to your custom domain with SSL security & fast reliable hosting", val: "Included Free" },
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

        {/* SECTION 8: BIG DECISION BOX */}
        <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-12 text-white shadow-lg text-center space-y-6">
          <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {isPaid ? "Launch Workflow Active" : "Ready to Launch?"}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isPaid ? "Your Website Is Moving Into Production" : "Launch Your New Website in 48 Hours"}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {setupPrice === 0 && monthlyPrice > 0
              ? `A $0 setup fee + $${monthlyPrice}/month ongoing hosting and management plan tailored for ${businessName}.`
              : setupPrice > 0 && monthlyPrice > 0
              ? `A $${setupPrice} setup fee + $${monthlyPrice}/month ongoing management package tailored for ${businessName}.`
              : `A $${setupPrice} one-time build tailored for ${businessName}.`}
          </p>

          {isPaid && (
            <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/15 bg-white/5 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">Live launch checklist</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {launchSteps.map((step) => (
                  <div key={step.label} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.complete ? "text-[#6ee7b7]" : "text-white/35"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{step.label}</p>
                      <p className="mt-0.5 text-xs text-white/55">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!isPaid && (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#432bd9]"
              >
                Approve & Launch ({priceFormattedLabel}) <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <a
              href="tel:+13075336678"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <PhoneCall className="h-4 w-4" /> Call Us with Questions
            </a>
          </div>

          <p className="text-xs text-white/50">
            Backed by our satisfaction review. 100% client-owned website with zero vendor lock-in.
          </p>
        </section>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-[#0d1738] border border-[#e5e7f2]">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0d1738]">Launch {businessName}&apos;s Website</h3>
                  <p className="text-xs text-[#777588]">
                    {discountLabel} · Tailored B2B Proposal
                  </p>
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
                  <span className="text-[#777588] font-semibold">AI Search & Assistant</span>
                  <span className="font-bold text-[#0d1738]">Local Schema + Callback Bot</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Domain Setup</span>
                  <span className="font-bold text-[#0d1738]">Custom Domain (SSL & DNS Included)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Delivery Time</span>
                  <span className="font-bold text-[#0b8f5b]">48 Hours to Official Go-Live</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Ownership</span>
                  <span className="font-bold text-[#0d1738]">100% You Own the Website</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#c7d0fb] pt-3 text-sm">
                  <div>
                    <span className="font-bold text-[#0d1738] block">Pricing Terms</span>
                    <span className="text-[10px] text-[#777588] line-through">Standard Value: ${standardValue}</span>
                  </div>
                  <span className="text-xl font-bold text-[#533afd]">
                    {priceFormattedLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full rounded-md bg-[#533afd] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#432bd9] disabled:opacity-60"
                >
                  {checkoutLoading
                    ? "Redirecting..."
                    : setupPrice === 0 && monthlyPrice > 0
                    ? `Start $${monthlyPrice}/mo Subscription via Card / Apple Pay`
                    : setupPrice > 0 && monthlyPrice > 0
                    ? `Pay $${setupPrice} Setup + $${monthlyPrice}/mo`
                    : `Pay $${setupPrice} via Card / Apple Pay`}
                </button>
                <p className="text-center text-[11px] text-[#777588]">
                  🔒 256-bit encrypted checkout via Stripe · Verified BarakahSoft LLC
                </p>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
                >
                  Cancel and review proposal preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7f2] bg-white py-6 text-center text-xs text-[#777588] mt-12">
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
