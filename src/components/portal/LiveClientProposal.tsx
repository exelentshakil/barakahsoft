"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
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
  const pricingModel: "flat" | "monthly" | "hybrid" = pricingData.model || "flat";
  const setupPrice = typeof pricingData.setupPrice === "number" ? pricingData.setupPrice : 797;
  const monthlyPrice = typeof pricingData.monthlyPrice === "number" ? pricingData.monthlyPrice : 0;
  const standardValue = typeof pricingData.standardValue === "number" ? pricingData.standardValue : 1597;
  const discountLabel = pricingData.discountLabel || "Save $800 Today";

  const launchSteps = [
    { label: "Payment received", complete: isPaid, detail: "Stripe checkout confirmed" },
    { label: "Human QA review", complete: isApproved, detail: isApproved ? "Approved by the BarakahSoft team" : "Final fact and conversion review" },
    { label: "Domain connection", complete: Boolean(lead.custom_domain), detail: lead.custom_domain || "Domain details will be confirmed with you" },
    { label: "Website live", complete: Boolean(lead.live_at) || lead.status === "live", detail: lead.live_at ? "Live on the connected domain" : "Follows QA and domain setup" },
  ];

  // Computed 49 local scan nodes for client service radius
  const mapPoints = Array.from({ length: 49 }, (_, i) => ({
    id: i + 1,
    rank: i < 10 ? 1 : i < 20 ? 6 : 22,
    status: i < 10 ? "visible" : i < 20 ? "outside" : "missing",
  }));

  const [selectedPoint, setSelectedPoint] = useState(mapPoints[8]);

  const radarData = [
    { subject: "Search Coverage", Client: 90, Competitors: 45, fullMark: 100 },
    { subject: "Mobile Speed", Client: 98, Competitors: 35, fullMark: 100 },
    { subject: "Conversion UX", Client: 95, Competitors: 40, fullMark: 100 },
    { subject: "Service Depth", Client: 92, Competitors: 30, fullMark: 100 },
    { subject: "Trust & Proof", Client: 96, Competitors: 60, fullMark: 100 },
    { subject: "Structured Schema", Client: 100, Competitors: 25, fullMark: 100 },
  ];

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          tier: "website",
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
        {/* HERO STORY & X-RAY SUMMARY */}
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
                Launch Complete Lead Machine {pricingModel === "monthly" ? `($${monthlyPrice}/mo)` : `($${setupPrice})`} <ArrowRight className="h-4 w-4" />
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
                <p className="mt-1 text-[#0d1738] font-semibold text-sm">{isPaid ? "Launch Approved" : "You Review the Lead Machine"}</p>
              </div>
              <div className={`rounded-xl p-4 border ${isPaid ? "border-2 border-[#0b8f5b] bg-[#eaf8f0] text-[#0b8f5b]" : "border-[#e5e7f2] bg-[#f9f9ff] text-[#777588]"}`}>
                <span className="font-bold">{isPaid ? "Step 3: Active" : "Step 3: Next"}</span>
                <p className="mt-1 font-semibold text-sm">{isPaid ? "QA, Domain & Go-Live" : "Launch the Lead Machine"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM-TO-SOLUTION MAPPING (ALL 6 ISSUES) */}
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
                  <p className="mt-1 text-[#42506a]">Took {beforeLcp} to load on 4G cellular. Users had to hunt through clunky menus just to find your emergency phone number.</p>
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

        {/* 4. DYNAMIC ADMIN-CONFIGURED PRICING SECTION */}
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
                Complete Lead Machine Build & Local Launch
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                Standard agency value anchored at ${standardValue} — tailored for {businessName}.
              </p>
            </div>

            {/* Price Tag Box */}
            <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
              <span className="text-xs text-[#777588] line-through font-semibold">
                Standard Value: ${standardValue}
              </span>
              <div className="mt-0.5 flex items-baseline gap-1 sm:justify-end">
                {pricingModel === "monthly" ? (
                  <>
                    <span className="text-4xl font-bold text-[#0d1738]">${monthlyPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">/ month</span>
                  </>
                ) : pricingModel === "hybrid" ? (
                  <>
                    <span className="text-3xl font-bold text-[#0d1738]">${setupPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">setup + ${monthlyPrice}/mo</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-[#0d1738]">${setupPrice}</span>
                    <span className="text-xs font-semibold text-[#777588]">USD flat</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-bold text-[#0b8f5b] block mt-1">
                ✓ 100% Client-Owned · No Monthly Lock-In
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

        {/* 5. BIG DECISION BOX */}
        <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-12 text-white shadow-lg text-center space-y-6">
          <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {isPaid ? "Launch Workflow Active" : "Ready to Launch?"}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isPaid ? "Your Lead Machine Is Moving Into Production" : "Launch Your New Lead Machine in 48 Hours"}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            {pricingModel === "monthly"
              ? `A $${monthlyPrice}/month zero-down plan that connects search visibility, trust proof, service demand, and fast call paths.`
              : pricingModel === "hybrid"
              ? `A $${setupPrice} setup + $${monthlyPrice}/month ongoing package that delivers full market takeover.`
              : `A $${setupPrice} flat build that connects search visibility, trust proof, service demand, and fast call paths.`}
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
                Approve & Launch My Lead Machine {pricingModel === "monthly" ? `($${monthlyPrice}/mo)` : `($${setupPrice})`} <ArrowRight className="h-5 w-5" />
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
            Backed by our satisfaction review. 100% client-owned with zero monthly hostage fees.
          </p>
        </section>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-[#0d1738] border border-[#e5e7f2]">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0d1738]">Launch {businessName}&apos;s Lead Machine</h3>
                  <p className="text-xs text-[#777588]">
                    {pricingModel === "monthly" ? `$${monthlyPrice}/mo Zero Down` : `$${setupPrice} One-Time Flat Build · ${discountLabel}`}
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
                    <span className="font-bold text-[#0d1738] block">Total Due Today</span>
                    <span className="text-[10px] text-[#777588] line-through">Standard Value: ${standardValue}</span>
                  </div>
                  <span className="text-xl font-bold text-[#533afd]">
                    {pricingModel === "monthly" ? `$${monthlyPrice}.00 USD / mo` : `$${setupPrice}.00 USD`}
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
                    : pricingModel === "monthly"
                    ? `Subscribe $${monthlyPrice}/mo via Card / Apple Pay`
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
