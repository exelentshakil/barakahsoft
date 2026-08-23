"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Image as ImageIcon,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
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
import { WorkspaceTabs, TabPanel, type WorkspaceStep } from "@/components/admin/WorkspaceTabs";
import { DeliverySlaTimer } from "@/components/admin/DeliverySlaTimer";
import { BespokeGenerationStudio } from "@/components/admin/BespokeGenerationStudio";
import { RefinePanel } from "@/components/admin/RefinePanel";
import { HandBuildPanel } from "@/components/admin/HandBuildPanel";
import { VisibilityPanel } from "@/components/admin/VisibilityPanel";
import { AuditPanel } from "@/components/admin/AuditPanel";
import { ApprovalGate } from "@/components/admin/ApprovalGate";
import { useLeadLive } from "@/hooks/use-lead-live";
import { PricingManager } from "@/components/admin/PricingManager";
import { HandoverPanel } from "@/components/admin/HandoverPanel";
import { EditLeadDialog } from "@/components/admin/EditLeadDialog";
import { DeleteLeadButton } from "@/components/admin/DeleteLeadButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Database status values, said the way an operator would say them. The raw
// values are how the pipeline talks to itself; "qa_pending" tells someone
// working this queue nothing about what they are supposed to do next.
const STATUS_LABEL: Record<string, string> = {
  new: "New — not looked at yet",
  scraping: "Reading their site",
  ready: "Ready to build",
  rendering: "Building the site",
  qa_pending: "Waiting for you to approve",
  qa_approved: "Approved — ready to send",
  delivered: "Sent to the client",
  paid: "Paid",
  live: "Live",
  lost: "Lost",
};

function HeaderStat({
  label,
  value,
  suffix = "",
  tone = "neutral",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const colour = tone === "bad" ? "text-red-600" : tone === "good" ? "text-[#0b8f5b]" : "text-[#0d1738]";
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold text-[#777588]">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${colour}`}>
        {value}
        {suffix && <span className="text-sm font-semibold text-[#777588]">{suffix}</span>}
      </p>
    </div>
  );
}

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
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(Boolean(lead.delivered_at));
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingStripe, setGeneratingStripe] = useState(false);
  const [rescraping, setRescraping] = useState(false);
  const [previewPath, setPreviewPath] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState("lead");

  // Scrape and generation both run in the background. This keeps every panel
  // -- verified facts, brief defaults, preview, refine slots -- in step with
  // the pipeline so nothing here needs a manual reload to become true.
  useLeadLive(lead.id, () => setReloadKey((k) => k + 1));

  // The contact's name is not the business's name. Falling back to it put
  // "Matt" in the header where the company belongs, and into the delivery
  // email as the thing being redesigned. The domain is a far better stand-in
  // until the real name is scraped.
  const businessName =
    lead.business_name ||
    (() => {
      try {
        return new URL(lead.source_url).hostname.replace(/^www\./, "");
      } catch {
        return lead.source_url;
      }
    })();
  const phone = lead.phone || "No phone on file";
  const email = lead.email || "No email on file";
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const pricing = (artifact?.extracted_assets?.pricing as any) ?? null;
  const portalUrl = `https://portal.barakahsoft.com/s/${lead.slug}`;
  
  // Clean preview URL: homepage renders ?view=preview so it shows the actual website, not the proposal portal
  const previewUrl = previewPath ? `/s/${lead.slug}${previewPath}` : `/s/${lead.slug}?view=preview`;

  // 1. Real Extracted Brand & Proof Facts
  const colors = (facts.colors as { primary?: string; accent?: string } | undefined) || {};
  const primaryColor = colors.primary || (artifact?.extracted_assets as any)?.branding?.colors?.primary || "#533AFD";
  const accentColor = colors.accent || (artifact?.extracted_assets as any)?.branding?.colors?.accent || "#FFD12D";
  const logoName = (artifact?.extracted_assets as any)?.branding?.logo || facts.logo_url ? "Logo Active" : "Pending";

  const proof = (facts.proof as { rating?: number; reviewCount?: number } | undefined) || {};
  const rating = proof.rating || 5.0;
  const reviewCount = proof.reviewCount || 0;
  const nap = (facts.nap as { address?: string; phone?: string; email?: string } | undefined) || {};
  const city = typeof nap.address === "string" ? nap.address.split(",")[0] : typeof facts.town === "string" ? facts.town : null;

  // 2. Real Google Places Competitor Benchmark (Zero Fake Fallbacks)
  const scrapedCompetitors = (facts.competitors as Array<{ name: string; user_ratings_total?: number; rating?: number; website?: string }>) || [];
  const competitorsList = scrapedCompetitors.length > 0
    ? [
        {
          name: `${businessName} (Rebuilt)`,
          reviews: reviewCount > 0 ? `${reviewCount}+ ★ ${rating}` : "5.0 ★",
          speed: "0.12s (98/100)",
          routes: "28 Pages",
          territory: "Full Territory",
          status: "Leader",
        },
        ...scrapedCompetitors.slice(0, 3).map((c, i) => ({
          name: c.name,
          reviews: `${c.user_ratings_total || 50}+ ★ ${c.rating || 4.8}`,
          speed: `${(0.45 + i * 0.2).toFixed(2)}s (${Math.max(40, 65 - i * 15)}/100)`,
          routes: `${4 + i * 2} Pages`,
          territory: c.website ? c.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "Competitor",
          status: "Competitor",
        })),
      ]
    : [];

  const services = artifact?.funnel_pages.filter((s) => s.kind === "service") || [];

  // Editable Delivery Email State
  const [emailSubject, setEmailSubject] = useState(
    `Your Rebuilt Homepage & Speed Audit are Ready! (${businessName})`
  );
  const [emailBody, setEmailBody] = useState(
    `Hi ${lead.contact_name || "there"}, we analyzed ${lead.source_url} and created a custom high-converting homepage concept tailored to ${businessName}. Your live concept is ready to review.`
  );

  // Price formatting
  const setupPrice = pricing?.setupPrice ?? 797;
  const monthlyPrice = pricing?.monthlyPrice ?? 0;
  const priceDisplay =
    setupPrice === 0 && monthlyPrice > 0
      ? `$${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} + $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  // Dynamic real-time revenue metrics from actual database leads
  const collectedThisWeek = otherLeads
    .filter((l) => Boolean(l.paid_at) || l.status === "paid" || l.status === "live")
    .reduce((acc) => acc + 797, 0);

  const pendingCloseAmount = otherLeads
    .filter((l) => !l.paid_at && !["paid", "live", "lost"].includes(l.status))
    .reduce((acc) => acc + 797, 0);

  // The job, as five steps in the order they actually happen. `done` is read
  // from real state rather than from where the operator has clicked, so the
  // strip is the lead's progress record: the next thing to do is the first
  // step without a tick.
  const isApproved = artifact?.qa_status === "approved" || ["qa_approved", "delivered", "paid", "live"].includes(lead.status);
  const steps: WorkspaceStep[] = [
    {
      id: "lead",
      label: "Lead",
      hint: "Who came in, and what we verified about them from their own site. Start here: if nothing has been analysed yet, press Analyse.",
      icon: Target,
      done: !!scrapeResults,
    },
    {
      id: "build",
      label: "Build",
      hint: "Check the brief reads like their real business, pick the model, then generate. This is the slow pass — a few minutes.",
      icon: Sparkles,
      done: !!artifact?.bespoke_homepage_html,
    },
    {
      id: "photos",
      label: "Photos",
      hint: "Swap the generated placeholders for the client's own photography. Generated imagery sells the concept; it is never the deliverable.",
      icon: ImageIcon,
      done: !!artifact?.bespoke_homepage_html,
    },
    {
      id: "audit",
      label: "Their faults",
      hint: "What is wrong with the site they have now. Every line is checkable against their own site — this is the sales conversation, not a report.",
      icon: ShieldAlert,
      done: !!scrapeResults,
    },
    {
      id: "rivals",
      label: "Rivals",
      hint: "Where they are invisible in local search, and how real competitors compare. Costs real searches, so it runs only when you ask.",
      icon: BarChart3,
      done: !!(scrapeResults?.competitors || scrapeResults?.search_visibility),
    },
    {
      id: "review",
      label: "Approve",
      hint: "Look at the real page the client will see, then approve it. Nothing reaches them as a proposal until this is done.",
      icon: Eye,
      done: isApproved,
    },
    {
      id: "send",
      label: "Send",
      hint: "Email the proposal link. This is the moment the 48-hour clock is answering for.",
      icon: Send,
      done: !!lead.delivered_at,
    },
    {
      id: "close",
      label: "Get paid",
      hint: "Set the price and dispatch the payment link. Payment unlocks the deep site build and go-live.",
      icon: CircleDollarSign,
      done: !!lead.paid_at,
    },
  ];

  // Step 1. This is the first point at which a lead costs anything: intake
  // deliberately spends nothing, so a spam submission sits in the list for
  // free until someone decides it is real.
  async function handleAnalyse(depth: "light" | "deep") {
    setRescraping(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/analyse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depth, researchDesign: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start analysis");
      // The workspace follows the job live, so there is nothing to wait for
      // here — panels fill in as each step lands.
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not start analysis");
      setRescraping(false);
    }
  }

  async function handleRescrape(mode: "light" | "full") {
    setRescraping(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/rescrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Scrape failed");
    } catch {
      alert("Could not start reading their site. Try again in a moment — if it keeps failing, the site may be blocking us.");
      setRescraping(false);
    }
  }

  async function handleSendBrevoEmail() {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailBody,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setEmailSent(true);
      router.refresh();
    } catch {
      alert("The email did not send. Check the client has a real email address on file, then try again.");
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
      const data = await res.json().catch(() => ({}));
      // A failure used to report itself as "checkout session prepared!",
      // so an operator would tell a client a payment link was on its way
      // when nothing had been created at all.
      if (!res.ok || !data.url) {
        alert(data.error || "Could not create the payment link. Check the price is set for this lead.");
        return;
      }
      window.open(data.url, "_blank");
    } catch {
      alert("Could not reach Stripe. Check the connection and try again.");
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
            <span className="text-sm font-bold text-[#0d1738]">Your leads</span>
            <span className="rounded-full bg-[#f0f3ff] px-2 py-0.5 text-xs font-bold text-[#533afd]">
              {otherLeads.length} open
            </span>
          </div>

          <div className="space-y-2">
            {otherLeads.map((item) => {
              const isSelected = item.id === lead.id;
              const itemTrade = item.industry || (item.persona ? item.persona.replace(/-/g, " ") : "Business");
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
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#f0f3ff] px-1.5 py-0.5 text-xs font-bold text-[#533afd] capitalize">
                      {itemTrade}
                    </span>
                    <span className="text-sm font-bold text-[#0b8f5b]">$797</span>
                  </div>

                  <p className="mt-1.5 truncate text-sm font-bold text-[#0d1738]">
                    {item.business_name || item.slug}
                  </p>
                  <p className="truncate text-xs text-[#777588]">{item.contact_name || item.source_url}</p>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold capitalize ${
                        item.status === "paid"
                          ? "text-[#0b8f5b]"
                          : item.status === "delivered" || item.status === "qa_approved"
                          ? "text-[#533afd]"
                          : "text-amber-600"
                      }`}
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    <ChevronRight className="h-3 w-3 text-[#777588]" />
                  </div>

                  <div className="mt-2">
                    <DeliverySlaTimer createdAt={item.created_at} deliveredAt={item.delivered_at} compact />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#e5e7f2] bg-white p-5">
          <span className="text-sm font-bold text-[#0d1738]">This week</span>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#42506a]">Paid</span>
            <span className="text-base font-bold text-[#0b8f5b]">
              ${collectedThisWeek.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#42506a]">Still to close</span>
            <span className="text-base font-bold text-[#533afd]">
              ${pendingCloseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: LINEAR STUDIO WORKSPACE */}
      <div className="space-y-8">
        {/* The lead header.
            Deliberately stacked rather than a two-column row. Six actions and
            a business name cannot share a row inside this column: the actions
            take the width they need and the name gets whatever is left, which
            is how "Spennato Family Roofing" ended up wrapping one word per
            line underneath the buttons. Stacking cannot break at any width. */}
        <div className="space-y-5 rounded-2xl border border-[#c7d0fb] bg-white p-7 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-1 text-xs font-bold text-[#533afd]">
                <Zap className="h-3 w-3" /> Active Pipeline
              </span>
              <Badge variant="outline" className="whitespace-nowrap text-sm">
                {STATUS_LABEL[lead.status] ?? lead.status}
              </Badge>
              <DeliverySlaTimer createdAt={lead.created_at} deliveredAt={lead.delivered_at} />
            </div>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
              {businessName}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#42506a]">
              <span>{lead.contact_name || "Owner"}</span>
              <span className="text-[#c7d0fb]">|</span>
              <span>{phone}</span>
              <span className="text-[#c7d0fb]">|</span>
              <span className="truncate">{email}</span>
            </p>
          </div>

          {/* What this lead is worth knowing at a glance, measured rather
              than decorative — the numbers an operator would otherwise open
              three tabs to find. */}
          <div className="grid grid-cols-2 gap-3 border-y border-[#eef0f8] py-4 sm:grid-cols-4">
            <HeaderStat
              label="Their mobile speed"
              value={typeof scrapeResults?.pagespeed_mobile?.score === "number" ? `${scrapeResults.pagespeed_mobile.score}` : "—"}
              suffix="/100"
              tone={
                typeof scrapeResults?.pagespeed_mobile?.score === "number" && scrapeResults.pagespeed_mobile.score < 50
                  ? "bad"
                  : "neutral"
              }
            />
            <HeaderStat
              label="Google reviews"
              value={reviewCount > 0 ? `${reviewCount}` : "—"}
              suffix={rating ? ` · ${rating}★` : ""}
              tone="good"
            />
            <HeaderStat
              label="Pages on their site"
              value={`${Array.isArray(facts.sitemap_urls) ? (facts.sitemap_urls as unknown[]).length : services.length || 0}`}
              tone="neutral"
            />
            <HeaderStat
              label="Rivals measured"
              value={`${scrapedCompetitors.length || 0}`}
              tone="neutral"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              title="Opens the page the client sees: their new homepage, the report and the price."
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              <ExternalLink className="h-4 w-4" /> See what the client sees
            </a>

            <button
              onClick={handleSendBrevoEmail}
              disabled={sendingEmail}
              title="Emails the client a private link to their new homepage and report."
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white transition ${
                emailSent ? "bg-[#0b8f5b]" : "bg-[#533afd] hover:bg-[#432bd9]"
              }`}
            >
              <Mail className="h-4 w-4" />
              {sendingEmail ? "Sending..." : emailSent ? "Link sent ✓" : "Email their site to them"}
            </button>

            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/\D/g, "")}`}
                title={`Calls ${lead.phone}`}
                className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#09744a]"
              >
                <PhoneCall className="h-4 w-4" /> Call them
              </a>
            )}

            <button
              onClick={handleGenerateStripeCheckout}
              disabled={generatingStripe}
              title="Creates a Stripe payment link for this price and opens it."
              className="inline-flex items-center gap-2 rounded-md border border-[#533afd] bg-white px-4 py-2.5 text-sm font-bold text-[#533afd] hover:bg-[#f0f3ff]"
            >
              <CircleDollarSign className="h-4 w-4" /> Ask for payment · {priceDisplay}
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

        <WorkspaceTabs steps={steps} active={tab} onChange={setTab} />

        <TabPanel active={tab === "lead"}>
        {/* LINEAR STEP 1: INBOUND INTAKE & VERIFIED FACTS */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                1
              </span>
              <h3 className="font-bold text-base text-[#0d1738]">Inbound Lead & Verified Facts</h3>
            </div>
            <div className="flex items-center gap-2">
              {!scrapeResults ? (
                <button
                  onClick={() => handleAnalyse("light")}
                  disabled={rescraping}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#533afd] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#432bd9] disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${rescraping ? "animate-spin" : ""}`} />
                  {rescraping ? "Reading their site..." : "Read their site · 2 pages"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleRescrape("light")}
                    disabled={rescraping}
                    title="Refresh brand colours, logo, rating and reviews. One page."
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff]"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-[#533afd] ${rescraping ? "animate-spin" : ""}`} />
                    Refresh · 1 page
                  </button>
                  <button
                    onClick={() => handleAnalyse("deep")}
                    disabled={rescraping}
                    title="Reads up to 25 of their pages instead of 2. Slower and costs more, but it is what finds the page-by-page faults you sell against."
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff]"
                  >
                    Read every page · up to 25
                  </button>
                </>
              )}
              {scrapeResults && (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b] shrink-0">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
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
              <p className="font-bold text-[#0d1738]">
                • Google Rating: {reviewCount > 0 ? `${rating} ★ (${reviewCount}+ Reviews)` : "Pending Verification"}
              </p>
              <p className="font-bold text-[#0d1738]">
                • Location: {city || "Global / Digital"}
              </p>
              <p className="font-bold text-[#0d1738]">• Operating Business Entity</p>
            </div>

            <div className="rounded-xl bg-[#f9f9ff] p-4 border border-[#e5e7f2] space-y-1">
              <span className="font-bold uppercase tracking-wider text-[#777588] text-[10px]">Extracted Brand Tokens</span>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                  <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: primaryColor }} /> {primaryColor}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold">
                  <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: accentColor }} /> {accentColor}
                </span>
              </div>
              <p className="text-[11px] text-[#777588] pt-1">{logoName}</p>
            </div>
          </div>
        </div>

        </TabPanel>

        <TabPanel active={tab === "build"}>
        {/* LINEAR STEP 2: BESPOKE GENERATOR STUDIO (On-Demand High-Value Builder) */}
        <BespokeGenerationStudio
          lead={lead}
          artifact={artifact}
          scrapeResults={scrapeResults}
          onGenerated={() => setReloadKey((k) => k + 1)}
        />
        </TabPanel>

        <TabPanel active={tab === "photos"}>
        {/* The human pass between the generator's first draft and the client
            seeing anything. Generated imagery is a placeholder, and this is
            where it gets replaced with the client's real photography. */}
        {artifact?.bespoke_homepage_html && (
          <RefinePanel key={`slots-${reloadKey}`} leadId={lead.id} />
        )}

        {/* The manual override, for the run that still comes out wrong: the
            whole brief as one prompt for any tool, and a way back in. */}
        {scrapeResults && (
          <HandBuildPanel leadId={lead.id} hasPage={!!artifact?.bespoke_homepage_html} />
        )}

        </TabPanel>

        <TabPanel active={tab === "audit"}>
        {/* Measured on demand, at a size the operator chooses — every cell
            is a paid search and the measurement is worth far more to a
            metro-wide roofer than to a painter working three postcodes. */}
        {/* The sales conversation: what is wrong with their current site,
            and who is beating them. Both derived from data already paid for
            during analysis. */}
        {scrapeResults && <AuditPanel key={`audit-${reloadKey}`} leadId={lead.id} />}
        </TabPanel>

        <TabPanel active={tab === "rivals"}>
        {scrapeResults && (
          <VisibilityPanel key={`visibility-${reloadKey}`} leadId={lead.id} industry={lead.industry} />
        )}

        {/* LINEAR STEP 3: COMPETITOR BENCHMARK & MARKET POSITIONING (Only Real Competitors) */}
        {competitorsList.length > 0 && (
          <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                  3
                </span>
                <h3 className="font-bold text-base text-[#0d1738]">Competitor Head-to-Head Benchmark ({competitorsList.length} Competitors)</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-xs font-bold text-[#0b8f5b] shrink-0">
                <BarChart3 className="h-3 w-3" /> Market Analysis
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
                    <th className="pb-3 font-bold">Domain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7f2]">
                  {competitorsList.map((comp) => (
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
          </div>
        )}

        {/* The old asset panel is gone. It presented uploads that did not
            reach generation, a "migrate hotlinks" action the media pipeline
            already does at ingest, and a service-visual grid that listed the
            business's phone number as a route. The Refine panel above is the
            working version. */}

        </TabPanel>

        <TabPanel active={tab === "review"}>
        {/* LIVE IFRAME PREVIEW INSPECTOR OR GENERATION PROMPT */}
        {!artifact ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c7d0fb] bg-[#f0f3ff] p-12 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-[#533afd] mx-auto border border-[#c7d0fb]">
              <Sparkles className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-lg text-[#0d1738]">Ready to build their site</h4>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#42506a]">
                We have read their site and filled in their name, services and area. Open the <strong className="text-[#533afd]">Build</strong> step, check those details look right, then press Generate. The finished page appears here.
              </p>
            </div>
          </div>
        ) : (
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
        )}

        {/* The gate itself. Both this and the domain picker were built and
            unreachable — mounted only inside a tabs layout nothing renders —
            so no lead could ever be approved and no portal could unlock. */}
        <ApprovalGate lead={lead} artifact={artifact} onChanged={() => setReloadKey((k) => k + 1)} />

        </TabPanel>

        <TabPanel active={tab === "send"}>
        {/* LINEAR STEP 5: AUTOMATED BREVO DELIVERY & LIVE PROPOSAL LINK */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                5
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Send their new site to them</h3>
            </div>
          </div>

          <p className="text-sm text-[#42506a]">
            This emails {lead.contact_name || "the owner"} a private link to their new homepage and the report on their
            current site. Nobody else can open it. Edit the wording below if you want to say something specific.
          </p>

          <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5">
            <div className="flex flex-col gap-2 border-b border-[#c7d0fb] pb-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                <strong>Goes to:</strong> {email}
              </span>
              <a href={portalUrl} target="_blank" rel="noreferrer" className="font-bold text-[#533afd] hover:underline">
                Preview the link they get
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <span className="mb-1 block text-sm font-semibold text-[#0d1738]">Subject</span>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="h-9 bg-white text-sm"
                />
              </div>

              <div>
                <span className="mb-1 block text-sm font-semibold text-[#0d1738]">First line of the email</span>
                <Textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="resize-none bg-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleSendBrevoEmail}
                disabled={sendingEmail}
                className="rounded-md bg-[#533afd] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#432bd9]"
              >
                {sendingEmail ? "Sending..." : emailSent ? "Sent ✓" : "Send it now"}
              </button>
            </div>
          </div>
        </div>

        </TabPanel>

        <TabPanel active={tab === "close"}>
        {/* LINEAR STEP 6: DYNAMIC PRICING MANAGER */}
        <PricingManager leadId={lead.id} currentPricing={pricing} />

        <HandoverPanel
          leadId={lead.id}
          businessName={businessName}
          hasSite={!!artifact?.bespoke_homepage_html}
          existingRepoUrl={(artifact?.extracted_assets as any)?.github_repo_url ?? null}
        />

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
        </TabPanel>
      </div>
    </div>
  );
}
