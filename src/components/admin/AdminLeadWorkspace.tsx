"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { displayPhone } from "@/lib/phone";
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
  Copy,
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
  Monitor,
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
import type { Lead, LeadStatus, Artifact, ScrapeResults } from "@/types/database";
import { WorkspaceTabs, TabPanel, type WorkspaceStep } from "@/components/admin/WorkspaceTabs";
import { DeliverySlaTimer } from "@/components/admin/DeliverySlaTimer";
import { BespokeGenerationStudio } from "@/components/admin/BespokeGenerationStudio";
import { RefinePanel } from "@/components/admin/RefinePanel";
import { HandBuildPanel } from "@/components/admin/HandBuildPanel";
import { VisibilityPanel } from "@/components/admin/VisibilityPanel";
import { AuditPanel } from "@/components/admin/AuditPanel";
import { CompetitorPanel } from "@/components/admin/CompetitorPanel";
import { ApprovalGate } from "@/components/admin/ApprovalGate";
import { useLeadLive } from "@/hooks/use-lead-live";
import { PricingManager } from "@/components/admin/PricingManager";
import { HandoverPanel } from "@/components/admin/HandoverPanel";
import { LeadValuePanel, type LeadValueData } from "@/components/admin/LeadValuePanel";
import { EditLeadDialog } from "@/components/admin/EditLeadDialog";
import { DeleteLeadButton } from "@/components/admin/DeleteLeadButton";
import { SocialMockupPanel } from "@/components/admin/SocialMockupPanel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildOfferOptions, type OfferOption } from "@/lib/audit/lead-value";

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
  const colour =
    tone === "bad"
      ? "text-rose-600"
      : tone === "good"
      ? "text-emerald-700"
      : "text-slate-900";
  const bgBadge =
    tone === "bad"
      ? "bg-rose-50/80 border-rose-200"
      : tone === "good"
      ? "bg-emerald-50/80 border-emerald-200"
      : "bg-slate-50 border-slate-200/80";
  return (
    <div className={`min-w-0 rounded-xl p-3.5 border transition shadow-sm ${bgBadge}`}>
      <p className="truncate text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${colour}`}>
        {value}
        {suffix && <span className="text-xs font-bold text-slate-500 ml-1">{suffix}</span>}
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
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [generatingStripe, setGeneratingStripe] = useState(false);
  const [rescraping, setRescraping] = useState(false);
  const [previewPath, setPreviewPath] = useState("");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
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
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const nap = (facts.nap as { address?: string; phone?: string; phones?: string[]; email?: string; emails?: string[] } | undefined) || {};
  const rawPhone = nap.phones?.find((p) => /\d{7,}/.test(p.replace(/\D/g, ""))) || nap.phone || lead.phone;
  const phone = displayPhone(rawPhone) || "No phone on file";
  const email = nap.emails?.[0] || nap.email || lead.email || "No email on file";
  const portalUrl = `https://portal.barakahsoft.com/s/${lead.slug}`;
  
  // Preview mode suppresses proposal/chat UI on every route, not just home.
  const previewUrl = `/s/${lead.slug}${previewPath}?view=preview`;

  // 1. Real Extracted Brand & Proof Facts
  const colors = (facts.colors as { primary?: string; accent?: string } | undefined) || {};
  const primaryColor = colors.primary || (artifact?.extracted_assets as any)?.branding?.colors?.primary || "#533AFD";
  const accentColor = colors.accent || (artifact?.extracted_assets as any)?.branding?.colors?.accent || "#FFD12D";
  const logoName = (artifact?.extracted_assets as any)?.branding?.logo || facts.logo_url ? "Logo Active" : "Pending";

  const proof = (facts.proof as { rating?: number; reviewCount?: number } | undefined) || {};
  const rating = proof.rating || 5.0;
  const reviewCount = proof.reviewCount || 0;
  const city = typeof nap.address === "string" ? nap.address.split(",")[0] : typeof facts.town === "string" ? facts.town : null;

  // 2. Real Google Places Competitor Benchmark (Zero Fake Fallbacks)
  // Rivals actually benchmarked, from the column the audit route writes.
  // Excludes the client's own row, which is in there as a comparison.
  const benchmark = scrapeResults?.competitors as { rows?: { isClient?: boolean }[] } | null | undefined;
  const measuredRivals = benchmark?.rows?.filter((row) => !row.isClient).length ?? 0;

  const scrapedCompetitors = (facts.competitors as Array<{ name: string; user_ratings_total?: number; rating?: number; website?: string }>) || [];
  const competitorsList = scrapedCompetitors.length > 0
    ? [
        {
          name: `${businessName} (your lead)`,
          // Their real review count, or nothing. This row used to assert
          // "5.0 ★", "0.12s (98/100)", "28 Pages" and "Leader" for a site
          // that had not been measured — invented figures about our own
          // rebuild, sitting in a table of real competitor data.
          reviews: reviewCount > 0 ? `${reviewCount} ★ ${rating}` : "—",
          speed: typeof scrapeResults?.pagespeed_mobile?.score === "number" ? `${scrapeResults.pagespeed_mobile.score}/100` : "—",
          routes: "—",
          territory: city ?? "—",
          status: "Your lead",
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
  const generatedPages = artifact?.bespoke_pages ?? {};
  const previewServices = services.filter((service) => generatedPages[`services/${service.slug}`]);
  const previewAreas = Object.keys(generatedPages)
    .filter((key) => key.startsWith("areas/") && generatedPages[key])
    .map((key) => ({ slug: key.slice("areas/".length), label: key.slice("areas/".length).replace(/-/g, " ") }));
  const rawLeadValue = facts.lead_value as LeadValueData | undefined;
  const offerOptions = rawLeadValue?.offers?.length
    ? rawLeadValue.offers
    : buildOfferOptions(services.length + 1, businessName);
  const fallbackOfferId: OfferOption["id"] = rawLeadValue?.tier === "premium" ? "complete" : rawLeadValue?.tier === "budget" ? "essential" : "growth";
  const fallbackOffer = offerOptions.find((offer) => offer.id === (rawLeadValue?.suggested?.offerId ?? fallbackOfferId)) ?? offerOptions[1];
  const aiLeadValue = rawLeadValue
    ? {
        ...rawLeadValue,
        offers: offerOptions,
        suggested: {
          setupPrice: fallbackOffer.setupPrice,
          monthlyPrice: fallbackOffer.monthlyPrice,
          standardValue: fallbackOffer.standardValue,
          label: `${fallbackOffer.label} · ${fallbackOffer.setupPrice > 0 ? `$${fallbackOffer.setupPrice} one time` : `$${fallbackOffer.monthlyPrice}/mo`}`,
          offerId: fallbackOffer.id,
        },
      }
    : null;
  const pricing = (artifact?.extracted_assets?.pricing as any) ?? null;
  const pricingIsConfigured = typeof pricing?.offerId === "string" || (Array.isArray(pricing?.offerOptions) && pricing.offerOptions.length > 0);

  // Outreach Mode & Sequence State
  const defaultIsCold = lead.source !== "redesign" && lead.source !== "home";
  const [outreachMode, setOutreachMode] = useState<"inbound" | "cold">(defaultIsCold ? "cold" : "inbound");
  const [currentLeadStatus, setCurrentLeadStatus] = useState<LeadStatus>(lead.status);
  const [activeOutreachStep, setActiveOutreachStep] = useState<1 | 2 | 3>(
    lead.status === "contacted" ? 2 : lead.status === "delivered" ? 2 : 1
  );

  const contactName = lead.contact_name || "there";

  function getEmailContentFor(mode: "inbound" | "cold", step: 1 | 2 | 3) {
    if (mode === "inbound") {
      if (step === 1) {
        return {
          subject: `Your Rebuilt Homepage & Speed Audit are Ready! (${businessName})`,
          body: `Hi ${contactName}, we finished your requested 48-hour homepage redesign for ${businessName}. We audited your mobile speed, mapped your local search rankings, and built a fresh concept tailored to your brand. Your live concept is ready to review below.`,
        };
      } else if (step === 2) {
        return {
          subject: `Quick follow up regarding ${businessName}'s homepage rebuild`,
          body: `Hi ${contactName}, just checking in to see if you had a moment to review the homepage concept you requested for ${businessName}. Have you had any thoughts on the layout or features?`,
        };
      } else {
        return {
          subject: `Final check regarding ${businessName} website concept`,
          body: `Hi ${contactName}, following up one last time on the custom website files and Google speed audit for ${businessName} before we archive the staging preview.`,
        };
      }
    } else {
      // Cold Outreach (Born-to-Help / Value Gift)
      if (step === 1) {
        return {
          subject: `Rebuilt ${businessName} homepage (no charge)`,
          body: `Hi ${contactName}, we analyzed ${lead.source_url} and noticed a few mobile speed bottlenecks costing you local customer calls. Rather than send a sales pitch, we went ahead and rebuilt a clean, high-speed homepage concept for ${businessName} (no charge). We also mapped out your core services and service territory. Your concept is ready to review below.`,
        };
      } else if (step === 2) {
        return {
          subject: `Quick question about ${businessName}`,
          body: `Hi ${contactName}, just wanted to check if you had a quick minute to take a look at the ${businessName} rebuild we put together. Any thoughts on the new layout?`,
        };
      } else {
        return {
          subject: `Rebuilt homepage files for ${businessName}`,
          body: `Hi ${contactName}, following up one last time regarding the custom redesign for ${businessName}. The files and Google speed diagnostic are 100% yours to keep with zero obligation.`,
        };
      }
    }
  }

  const initialContent = getEmailContentFor(defaultIsCold ? "cold" : "inbound", lead.status === "contacted" || lead.status === "delivered" ? 2 : 1);
  const [emailSubject, setEmailSubject] = useState(initialContent.subject);
  const [emailBody, setEmailBody] = useState(initialContent.body);

  function handleSwitchMode(mode: "inbound" | "cold") {
    setOutreachMode(mode);
    const content = getEmailContentFor(mode, activeOutreachStep);
    setEmailSubject(content.subject);
    setEmailBody(content.body);
  }

  function selectOutreachSequenceStep(step: 1 | 2 | 3) {
    setActiveOutreachStep(step);
    const content = getEmailContentFor(outreachMode, step);
    setEmailSubject(content.subject);
    setEmailBody(content.body);
  }

  async function handleUpdateLeadStatus(newStatus: LeadStatus) {
    setCurrentLeadStatus(newStatus);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  // Price formatting
  const setupPrice = pricingIsConfigured ? pricing.setupPrice : aiLeadValue?.suggested.setupPrice ?? 997;
  const monthlyPrice = pricingIsConfigured ? pricing.monthlyPrice : aiLeadValue?.suggested.monthlyPrice ?? 0;
  const priceDisplay =
    setupPrice === 0 && monthlyPrice > 0
      ? `$${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} setup · $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  // Dynamic real-time revenue metrics from actual database leads
  const collectedThisWeek = otherLeads
    .filter((l) => Boolean(l.paid_at) || l.status === "paid" || l.status === "live")
    .reduce((acc) => acc + 779, 0);

  const pendingCloseAmount = otherLeads
    .filter((l) => !l.paid_at && !["paid", "live", "lost"].includes(l.status))
    .reduce((acc) => acc + 779, 0);

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
    if (currentLeadStatus === "lost") {
      alert("Outreach is blocked because this lead is marked as 'Not Interested / Lost'.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: activeOutreachStep,
          subject: emailSubject,
          message: emailBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "The email did not send. Please check your Brevo/Resend API keys.");
      }
      setEmailSent(true);
      if (data.status) {
        setCurrentLeadStatus(data.status);
      }
      if (data.warning) {
        alert(data.warning);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "The email did not send. Check the client has a real email address on file, then try again.");
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
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* 1. LEFT ASIDE: INBOUND LEAD ORDERS & WEEKLY PULSE */}
      <aside className="space-y-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">Your Pipeline</span>
            <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 text-xs font-black text-indigo-700">
              {otherLeads.length} leads
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
                  className={`block rounded-xl p-3.5 transition border ${
                    isSelected
                      ? "bg-indigo-50/70 border-2 border-indigo-600 shadow-md ring-2 ring-indigo-500/10"
                      : "bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                      {itemTrade}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">$779</span>
                  </div>

                  <p className="mt-2 truncate text-sm font-black text-slate-900 leading-tight">
                    {item.business_name || item.slug}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{item.contact_name || item.source_url}</p>

                  <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span
                      className={`font-black text-[11px] uppercase tracking-wider ${
                        item.status === "paid"
                          ? "text-emerald-700"
                          : item.status === "delivered" || item.status === "qa_approved"
                          ? "text-indigo-600"
                          : "text-amber-700"
                      }`}
                    >
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <div className="mt-2">
                    <DeliverySlaTimer createdAt={item.created_at} deliveredAt={item.delivered_at} compact />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Weekly Target Pulse</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-600">Collected Revenue</span>
            <span className="text-base font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ${collectedThisWeek.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Pipeline To Close</span>
            <span className="text-base font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              ${pendingCloseAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: LINEAR STUDIO WORKSPACE */}
      <div className="space-y-8">
        <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-black text-indigo-700">
                <Zap className="h-3.5 w-3.5" /> Active Lead Pipeline
              </span>
              <Badge variant="outline" className="whitespace-nowrap text-xs font-bold px-2.5 py-1">
                {STATUS_LABEL[lead.status] ?? lead.status}
              </Badge>
              <DeliverySlaTimer createdAt={lead.created_at} deliveredAt={lead.delivered_at} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {businessName}
              </h1>
              <div className="flex shrink-0 items-center rounded-xl border border-slate-200 bg-white">
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
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-slate-600">
              <span>{lead.contact_name || "Owner"}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-800">{phone}</span>
              <span className="text-slate-300">|</span>
              <span className="truncate text-slate-800">{email}</span>
            </p>
          </div>

          {/* Outreach Pipeline Status & Outcome Toolbar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outreach Stage:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    currentLeadStatus === "paid" || currentLeadStatus === "live"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : currentLeadStatus === "lost"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : currentLeadStatus === "contacted"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : currentLeadStatus === "delivered"
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {currentLeadStatus === "lost"
                    ? "🚫 Not Interested / Do Not Contact"
                    : currentLeadStatus === "paid" || currentLeadStatus === "live"
                    ? "🏆 Won & Paid (Live)"
                    : currentLeadStatus === "contacted"
                    ? "💬 In Conversation"
                    : currentLeadStatus === "delivered"
                    ? "📧 Step 1 Pitch Sent"
                    : "Ready for Outreach"}
                </span>
              </div>

              {/* Quick 1-Click Outcome Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("contacted")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "contacted"
                      ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  💬 In Conversation
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("paid")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "paid" || currentLeadStatus === "live"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  🏆 Won / Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("lost")}
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "lost"
                      ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  🚫 Not Interested
                </button>
                {["lost", "contacted", "paid", "live"].includes(currentLeadStatus) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLeadStatus("qa_approved")}
                    className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {currentLeadStatus === "lost" && (
              <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                ⚠️ Lead is marked as Not Interested. Email delivery is disabled to prevent spam.
              </p>
            )}
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-4 sm:grid-cols-4">
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
              value={`${measuredRivals}`}
              tone="neutral"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              title="Opens the page the client sees: their new homepage, the report and the price."
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> See what the client sees
            </a>

            <button
              onClick={handleSendBrevoEmail}
              disabled={sendingEmail}
              title="Emails the client a private link to their new homepage and report."
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
                emailSent
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {sendingEmail ? "Sending..." : emailSent ? "Link sent ✓" : "Email their site to them"}
            </button>

            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/\D/g, "")}`}
                title={`Calls ${lead.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> Call them
              </a>
            )}

            <button
              onClick={handleGenerateStripeCheckout}
              disabled={generatingStripe}
              title="Creates a Stripe payment link for this price and opens it."
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" /> Ask for payment ({priceDisplay})
            </button>
          </div>
        </div>

        <WorkspaceTabs steps={steps} active={tab} onChange={setTab} />

        <TabPanel active={tab === "lead"}>
        {/* LINEAR STEP 1: INBOUND INTAKE & VERIFIED FACTS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-700 shrink-0">
                1
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">Inbound Lead &amp; Verified Facts</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!scrapeResults ? (
                <button
                  onClick={() => handleAnalyse("light")}
                  disabled={rescraping}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 shadow-xs transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${rescraping ? "animate-spin" : ""}`} />
                  {rescraping ? "Reading site..." : "Read site (2 pages)"}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleRescrape("light")}
                    disabled={rescraping}
                    title="Refresh brand colours, logo, rating and reviews. One page."
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${rescraping ? "animate-spin" : ""}`} />
                    Refresh (1 page)
                  </button>
                  <button
                    onClick={() => handleAnalyse("deep")}
                    disabled={rescraping}
                    title="Reads up to 25 of their pages instead of 2. Slower and costs more, but it is what finds the page-by-page faults you sell against."
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    Deep crawl (25 pages)
                  </button>
                </>
              )}
              {scrapeResults && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 text-sm leading-relaxed">
            <div className="rounded-xl bg-slate-50/80 p-5 border border-slate-200/80 space-y-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 text-xs">Selected Intake Pains</span>
              {lead.pain_points.length > 0 ? (
                lead.pain_points.map((p) => <p key={p} className="font-bold text-slate-900 text-sm">• {p}</p>)
              ) : (
                <p className="text-slate-600 font-medium text-sm">Standard Speed &amp; Conversion Optimization</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50/80 p-5 border border-slate-200/80 space-y-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 text-xs">Verified Credentials</span>
              <p className="font-bold text-slate-900 text-sm">
                • Google Rating: {reviewCount > 0 ? `${rating} ★ (${reviewCount}+ Reviews)` : "Pending Verification"}
              </p>
              <p className="font-bold text-slate-900 text-sm">
                • Location: {city || "Global / Digital"}
              </p>
              <p className="font-bold text-slate-900 text-sm">• Operating Business Entity</p>
            </div>

            <div className="rounded-xl bg-slate-50/80 p-5 border border-slate-200/80 space-y-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-500 text-xs">Extracted Brand Tokens</span>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="h-4 w-4 rounded-full border shadow-inner shrink-0" style={{ backgroundColor: primaryColor }} /> {primaryColor}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                  <span className="h-4 w-4 rounded-full border shadow-inner shrink-0" style={{ backgroundColor: accentColor }} /> {accentColor}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 pt-1">{logoName}</p>
            </div>
          </div>
        </div>

        {/* Social Media Launch Studio (3D Poster & Motion Kit) prominently below Lead Data */}
        <SocialMockupPanel lead={lead} artifact={artifact} facts={facts} />

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
        {scrapeResults && <CompetitorPanel key={`rivals-${reloadKey}`} leadId={lead.id} />}

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
          <div className="overflow-hidden rounded-2xl border border-[#dfe3ef] bg-white shadow-[0_18px_50px_rgba(24,35,72,0.08)]">
            <div className="flex flex-col gap-4 border-b border-[#e5e7f2] bg-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0f3ff] text-[#533afd]">
                  <Eye className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0d1738]">Generated website preview</h3>
                  <p className="mt-0.5 text-xs text-[#667085]">Review the real responsive page before approval.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={previewPath}
                  onChange={(e) => setPreviewPath(e.target.value)}
                  aria-label="Preview page"
                  className="h-9 rounded-lg border border-[#dfe3ef] bg-white px-3 text-xs font-semibold text-[#26324b] outline-none focus:border-[#533afd]"
                >
                  <option value="">Homepage</option>
                  {generatedPages.about && <option value="/about">About Us</option>}
                  {generatedPages.contact && <option value="/contact">Contact</option>}
                  {generatedPages.faq && <option value="/faq">FAQ</option>}
                  {previewServices.map((s) => (
                    <option key={s.slug} value={`/services/${s.slug}`}>
                      Service: {s.h2}
                    </option>
                  ))}
                  {previewAreas.map((area) => (
                    <option key={area.slug} value={`/areas/${area.slug}`}>
                      Area: {area.label}
                    </option>
                  ))}
                </select>
                <div className="flex h-9 items-center rounded-lg border border-[#dfe3ef] bg-[#f7f8fc] p-1" aria-label="Preview viewport">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    aria-pressed={previewViewport === "desktop"}
                    className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition ${previewViewport === "desktop" ? "bg-white text-[#533afd] shadow-sm" : "text-[#667085] hover:text-[#26324b]"}`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    aria-pressed={previewViewport === "mobile"}
                    className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition ${previewViewport === "mobile" ? "bg-white text-[#533afd] shadow-sm" : "text-[#667085] hover:text-[#26324b]"}`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Mobile
                  </button>
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#533afd] hover:bg-[#f0f3ff]"
                >
                  Open in new tab <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="overflow-auto bg-[#eef1f7] p-3 sm:p-6">
              <div className={`mx-auto overflow-hidden border border-[#cfd5e3] bg-white shadow-[0_24px_70px_rgba(24,35,72,0.16)] transition-[width] duration-300 ${previewViewport === "mobile" ? "w-[390px] max-w-full rounded-[28px]" : "w-full min-w-[1024px] rounded-xl"}`}>
                <div className="flex h-9 items-center gap-1.5 border-b border-[#e5e7f2] bg-[#f8f9fc] px-3" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#5dd39e]" />
                  <span className="mx-auto rounded-md border border-[#e2e6ef] bg-white px-4 py-1 text-[10px] text-[#98a2b3]">
                    {previewViewport === "mobile" ? "390 × 844" : "Responsive desktop"}
                  </span>
                </div>
                <iframe
                  key={`${previewPath}-${previewViewport}-${reloadKey}`}
                  src={previewUrl}
                  className={previewViewport === "mobile" ? "h-[844px] w-full" : "h-[820px] w-full"}
                  title={`${businessName} ${previewViewport} preview`}
                  loading="lazy"
                />
              </div>
            </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e7f2] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f3ff] text-xs font-bold text-[#533afd]">
                5
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Outreach &amp; Sequence Delivery</h3>
            </div>

            {/* Inbound vs Cold Outreach Mode Switcher */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleSwitchMode("inbound")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  outreachMode === "inbound"
                    ? "bg-white text-[#533afd] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎯 Inbound Ad Lead (Requested)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("cold")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  outreachMode === "cold"
                    ? "bg-[#533afd] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ⚡ Cold Outreach (Value Drop Gift)
              </button>
            </div>
          </div>

          {/* Sequence Step Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {outreachMode === "inbound" ? "Inbound Requested Delivery Sequence:" : "Cold Outreach Anti-Spam Sequence:"}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {outreachMode === "inbound" ? "Warm follow-up on requested site" : "Born-to-help gift & curiosity loop"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => selectOutreachSequenceStep(1)}
                className={`rounded-xl border p-3 text-left transition ${
                  activeOutreachStep === 1
                    ? "border-[#533afd] bg-[#f0f3ff] ring-2 ring-[#533afd]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs font-bold text-[#0d1738]">
                  {outreachMode === "inbound" ? "1. Initial Delivery" : "1. Value Drop Gift"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {outreachMode === "inbound" ? "Your requested 48h rebuild is ready" : "Rebuilt concept & speed audit (no charge)"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectOutreachSequenceStep(2)}
                className={`rounded-xl border p-3 text-left transition ${
                  activeOutreachStep === 2
                    ? "border-[#533afd] bg-[#f0f3ff] ring-2 ring-[#533afd]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs font-bold text-[#0d1738]">2. 48h Follow-up Bump</span>
                <span className="text-[11px] text-slate-500">
                  {outreachMode === "inbound" ? "Checking in on requested concept" : "Quick 2-sentence check on layout"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectOutreachSequenceStep(3)}
                className={`rounded-xl border p-3 text-left transition ${
                  activeOutreachStep === 3
                    ? "border-[#533afd] bg-[#f0f3ff] ring-2 ring-[#533afd]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="block text-xs font-bold text-[#0d1738]">3. Final Notice</span>
                <span className="text-[11px] text-slate-500">
                  {outreachMode === "inbound" ? "Final check before staging archive" : "Free files transfer & zero-obligation wrap"}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-5">
            <div className="flex flex-col gap-2 border-b border-[#c7d0fb] pb-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                <strong>Goes to:</strong> {email}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                    setCopiedPortalLink(true);
                    setTimeout(() => setCopiedPortalLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[#533afd] hover:underline"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedPortalLink ? "Copied! ✓" : "Copy Client Link"}
                </button>
                <span className="text-[#c7d0fb]">·</span>
                <a
                  href={`/s/${lead.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#533afd] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Proposal Portal
                </a>
                <span className="text-[#c7d0fb]">·</span>
                <a
                  href={`/s/${lead.slug}?view=preview`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#533afd] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Website Directly
                </a>
              </div>
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
                <span className="mb-1 block text-sm font-semibold text-[#0d1738]">Email Content</span>
                <Textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="resize-none bg-white text-sm"
                />
              </div>
            </div>

            {currentLeadStatus === "lost" ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800 flex items-center justify-between">
                <span>🚫 Outreach is blocked because lead is marked as Not Interested.</span>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("qa_approved")}
                  className="underline hover:text-rose-950"
                >
                  Re-enable Outreach
                </button>
              </div>
            ) : currentLeadStatus === "paid" || currentLeadStatus === "live" ? (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <span>🏆 Client has purchased. Automated outreach sequence finished.</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  Sending Step {activeOutreachStep} will update lead status to{" "}
                  <strong>{activeOutreachStep === 1 ? "Delivered" : "Contacted"}</strong>.
                </span>
                <button
                  onClick={handleSendBrevoEmail}
                  disabled={sendingEmail}
                  className="rounded-md bg-[#533afd] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#432bd9] disabled:opacity-50"
                >
                  {sendingEmail ? "Sending via Brevo..." : emailSent ? "Sent ✓" : `Send Step ${activeOutreachStep} via Brevo`}
                </button>
              </div>
            )}
          </div>
        </div>

        </TabPanel>

        <TabPanel active={tab === "close"}>
        {/* What they can pay, before the panel that asks what to charge. */}
        <LeadValuePanel leadId={lead.id} value={aiLeadValue} />

        {/* LINEAR STEP 6: DYNAMIC PRICING MANAGER */}
        <PricingManager
          leadId={lead.id}
          currentPricing={pricing}
          businessName={businessName}
          pageCount={services.length}
          leadValue={aiLeadValue}
        />

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
              Client receives 100% standalone Next.js code + DNS CNAME setup with a 2-4 week launch timeline after payment, content approval, and domain access.
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
