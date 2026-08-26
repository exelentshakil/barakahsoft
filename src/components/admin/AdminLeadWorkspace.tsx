"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { displayPhone } from "@/lib/phone";
import { resolveBusinessContact } from "@/lib/business-contact";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Camera,
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
} from "lucide-react";
import type { Lead, LeadStatus, Artifact, ScrapeResults } from "@/types/database";
import { toBlob } from "html-to-image";
import { WorkspaceTabs, WorkspaceTabHint, TabPanel, type WorkspaceStep } from "@/components/admin/WorkspaceTabs";
import { DeliverySlaTimer } from "@/components/admin/DeliverySlaTimer";
import { ShowcaseApprovalControl } from "@/components/portal/sections/ShowcaseApprovalControl";
import { BespokeGenerationStudio } from "@/components/admin/BespokeGenerationStudio";
import { RefinePanel } from "@/components/admin/RefinePanel";
import { ManualPhotoUpload } from "@/components/admin/ManualPhotoUpload";
import { HandBuildPanel } from "@/components/admin/HandBuildPanel";
import { OutreachSequencePanel } from "@/components/admin/OutreachSequencePanel";
import { PeriodPulsePanel } from "@/components/admin/PeriodPulsePanel";
import { AddUrlDialog } from "@/components/admin/AddUrlDialog";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildOfferOptions, type OfferOption } from "@/lib/audit/lead-value";
import type { LeadCost } from "@/lib/cost/lead-cost";

const STATUS_LABEL: Record<string, string> = {
  new: "New — not looked at yet",
  scraping: "Reading their site",
  ready: "Ready to build",
  rendering: "Building the site",
  qa_pending: "Waiting for approval",
  qa_approved: "Approved — ready to send",
  delivered: "Sent to client",
  paid: "Paid",
  live: "Live",
  lost: "Lost",
};

function HeaderStat({
  label,
  value,
  suffix = "",
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string | React.ReactNode;
  suffix?: string;
  tone?: "good" | "bad" | "neutral";
  onClick?: () => void;
}) {
  const colour =
    tone === "bad"
      ? "text-rose-600"
      : tone === "good"
      ? "text-emerald-700"
      : "text-slate-900";
  const bgBadge =
    tone === "bad"
      ? "bg-rose-50/70 border-rose-200/80"
      : tone === "good"
      ? "bg-emerald-50/70 border-emerald-200/80"
      : "bg-slate-50/80 border-slate-200/70";
  return (
    <div
      className={`min-w-0 rounded-xl border p-2.5 transition ${bgBadge} ${onClick ? 'cursor-pointer hover:shadow-sm' : ''}`}
      onClick={onClick}
    >
      <p className="truncate text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-base sm:text-lg font-extrabold tabular-nums tracking-tight ${colour}`}>
        {value}
        {suffix && <span className="ml-1 text-[11px] font-bold text-slate-500">{suffix}</span>}
      </p>
    </div>
  );
}

const TAB_IDS = ["lead", "build", "photos", "audit", "rivals", "review", "send", "close"];

interface AdminLeadWorkspaceProps {
  lead: Lead;
  artifact: Artifact | null;
  scrapeResults: ScrapeResults | null;
  otherLeads: Lead[];
  cost: LeadCost;
  proposalViews?: string[];
}

export function AdminLeadWorkspace({
  lead,
  artifact,
  scrapeResults,
  otherLeads,
  cost,
  proposalViews = [],
}: AdminLeadWorkspaceProps) {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(Boolean(lead.delivered_at));
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [generatingStripe, setGeneratingStripe] = useState(false);
  const [rescraping, setRescraping] = useState(false);
  const [previewPath, setPreviewPath] = useState("");
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  const searchParams = useSearchParams();
  const [tab, setTabState] = useState(() => {
    const initial = searchParams.get("tab");
    return initial && TAB_IDS.includes(initial) ? initial : "lead";
  });

  const setTab = useCallback((next: string) => {
    setTabState(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === "lead") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  useLeadLive(lead.id, () => setReloadKey((k) => k + 1));

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
  const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });
  const phone = displayPhone(contact.phone) || "No phone on file";
  const email = contact.email || "No email on file";
  const portalUrl = `https://portal.barakahsoft.com/s/${lead.slug}`;
  
  const previewUrl = `/s/${lead.slug}${previewPath}?view=preview`;

  const colors = (facts.colors as { primary?: string; accent?: string } | undefined) || {};
  const primaryColor = colors.primary || (artifact?.extracted_assets as any)?.branding?.colors?.primary || "#533AFD";
  const accentColor = colors.accent || (artifact?.extracted_assets as any)?.branding?.colors?.accent || "#FFD12D";
  const resolvedLogo = (artifact?.extracted_assets as any)?.branding?.logo || (artifact?.extracted_assets as any)?.logo_url || facts.logo_url || (facts.branding as any)?.images?.logo || (facts.branding as any)?.logo || null;
  const logoName = resolvedLogo ? "Brand Logo Verified" : "Logo Pending";

  const rating = typeof facts.rating === "number" ? facts.rating : null;
  const reviewCount = typeof facts.review_count === "number" ? facts.review_count : 0;
  const nap = (facts.nap as { address?: string } | undefined) ?? {};
    const city = typeof nap.address === "string" ? nap.address.split(",")[0] : typeof facts.town === "string" ? facts.town : null;

  const scrapedCompetitors = (facts.competitors as Array<{ name: string; user_ratings_total?: number; rating?: number; website?: string }>) || [];
  const competitorsList = scrapedCompetitors.length > 0
    ? [
        {
          name: `${businessName} (your lead)`,
          reviews: reviewCount > 0 ? `${reviewCount} ★ ${rating}` : "—",
          speed: typeof scrapeResults?.pagespeed_mobile?.score === "number" ? `${scrapeResults.pagespeed_mobile.score}/100` : "—",
          routes: "—",
          territory: city ?? "—",
          status: "Your lead",
        },
        ...scrapedCompetitors.slice(0, 3).map((c) => ({
          name: c.name,
          reviews:
            typeof c.user_ratings_total === "number" && typeof c.rating === "number"
              ? `${c.user_ratings_total} ★ ${c.rating}`
              : "—",
          speed: "—",
          routes: "—",
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

  const defaultIsCold = lead.source !== "redesign" && lead.source !== "home";
  const [outreachMode, setOutreachMode] = useState<"inbound" | "cold">(defaultIsCold ? "cold" : "inbound");
  const [currentLeadStatus, setCurrentLeadStatus] = useState<LeadStatus>(lead.status);
  const [localOutreachStage, setLocalOutreachStage] = useState<number>(lead.outreach_stage || 0);
  const [activeOutreachStep, setActiveOutreachStep] = useState<1 | 2 | 3>(
    ((lead.outreach_stage || 0) < 3 ? (lead.outreach_stage || 0) + 1 : 3) as 1 | 2 | 3
  );

  const contactName = lead.contact_name || "there";

  function getEmailContentFor(mode: "inbound" | "cold", step: 1 | 2 | 3) {
    if (mode === "inbound") {
      if (step === 1) {
        return {
          subject: `${businessName} homepage rebuild (no charge)`,
          body: `Hi ${contactName},

We analysed ${businessName} and noticed a few mobile speed bottlenecks costing you local customer calls.
We went ahead and rebuilt a clean, high-speed homepage concept for ${businessName} (no charge).

Your concept is ready to review below:
${portalUrl}

Cheers,
Shaq`,
        };
      } else if (step === 2) {
        return {
          subject: `Checking in on requested concept`,
          body: `Hi ${contactName},

Just checking in to see if you had a moment to review the homepage concept we built for ${businessName}?

${portalUrl}

Happy to make any tweaks, just let me know.

Cheers,
Shaq`,
        };
      } else {
        return {
          subject: `Final check before staging archive`,
          body: `Hi ${contactName},

Following up one last time on the custom website files for ${businessName} before we archive the staging preview.

Are you open to taking a quick look?

${portalUrl}

Cheers,
Shaq`,
        };
      }
    } else {
      if (step === 1) {
        return {
          subject: `${businessName} homepage rebuild (no charge)`,
          body: `Hi ${contactName},

We analysed ${businessName} and noticed a few mobile speed bottlenecks costing you local customer calls.
We went ahead and rebuilt a clean, high-speed homepage concept for ${businessName} (no charge).

Your concept is ready to review below:
${portalUrl}

Cheers,
Shaq`,
        };
      } else if (step === 2) {
        return {
          subject: `Checking in on requested concept`,
          body: `Hi ${contactName},

Just checking in to see if you had a moment to review the homepage concept we built for ${businessName}?

${portalUrl}

Happy to make any tweaks, just let me know.

Cheers,
Shaq`,
        };
      } else {
        return {
          subject: `Final check before staging archive`,
          body: `Hi ${contactName},

Following up one last time on the custom website files for ${businessName} before we archive the staging preview.

Are you open to taking a quick look?

${portalUrl}

Cheers,
Shaq`,
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
      // Update both status and outreach metadata
      const now = new Date().toISOString();
      const payload: any = {
        status: newStatus,
      };
      
      if (newStatus === "delivered" || newStatus === "contacted") {
        if (newStatus === "delivered" && !lead.delivered_at) payload.delivered_at = now;
        payload.outreach_stage = activeOutreachStep;
        setLocalOutreachStage(activeOutreachStep);
        payload.outreach_last_sent_at = now;
      }

      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  const setupPrice = pricingIsConfigured ? pricing.setupPrice : aiLeadValue?.suggested.setupPrice ?? 997;
  const monthlyPrice = pricingIsConfigured ? pricing.monthlyPrice : aiLeadValue?.suggested.monthlyPrice ?? 0;
  const priceDisplay =
    setupPrice === 0 && monthlyPrice > 0
      ? `$${monthlyPrice}/mo`
      : setupPrice > 0 && monthlyPrice > 0
      ? `$${setupPrice} setup · $${monthlyPrice}/mo`
      : `$${setupPrice}`;

  const collectedThisWeek = otherLeads
    .filter((l) => Boolean(l.paid_at) || l.status === "paid" || l.status === "live")
    .reduce((acc) => acc + 779, 0);

  const pendingCloseAmount = otherLeads
    .filter((l) => !l.paid_at && !["paid", "live", "lost"].includes(l.status))
    .reduce((acc) => acc + 779, 0);

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
      hint: "Check the brief reads like their real business, pick the model, then generate. High-converting homepage pass.",
      icon: Sparkles,
      done: !!artifact?.bespoke_homepage_html,
    },
    {
      id: "photos",
      label: "Photos",
      hint: "Swap the generated placeholders for the client's own photography.",
      icon: ImageIcon,
      done: !!artifact?.bespoke_homepage_html,
    },
    {
      id: "audit",
      label: "Their faults",
      hint: "What is wrong with the site they have now. Every line is checkable against their own site.",
      icon: ShieldAlert,
      done: !!scrapeResults,
    },
    {
      id: "rivals",
      label: "Rivals",
      hint: "Where they are invisible in local search, and how real competitors compare.",
      icon: BarChart3,
      done: !!(scrapeResults?.competitors || scrapeResults?.search_visibility),
    },
    {
      id: "review",
      label: "Approve",
      hint: "Look at the real page the client will see, then approve it.",
      icon: Eye,
      done: isApproved,
    },
    {
      id: "send",
      label: "Send",
      hint: "Email the proposal link. This is the moment the 48-hour clock answers for.",
      icon: Send,
      done: !!lead.delivered_at,
    },
    {
      id: "close",
      label: "Get paid",
      hint: "Set the price and dispatch the payment link. Payment unlocks full build and go-live.",
      icon: CircleDollarSign,
      done: !!lead.paid_at,
    },
  ];

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
      alert("Could not start reading their site. Try again in a moment.");
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
      setLocalOutreachStage(activeOutreachStep);
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

  const [capturingSlot, setCapturingSlot] = useState<"hero" | "about" | null>(null);
  const [capturedSuccess, setCapturedSuccess] = useState<string | null>(null);

  async function captureIframeSection(slot: "hero" | "about") {
    setCapturingSlot(slot);
    setCapturedSuccess(null);
    try {
      const iframe = document.querySelector<HTMLIFrameElement>(`iframe[title*="${businessName}"]`);
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (!doc) {
        throw new Error("Preview frame not ready. Please wait for the preview to load or open the preview page.");
      }

      let targetEl: HTMLElement | null = null;
      if (slot === "hero") {
        targetEl =
          doc.querySelector<HTMLElement>("#hero") ||
          doc.querySelector<HTMLElement>("main > section:first-of-type") ||
          doc.querySelector<HTMLElement>("section");
      } else {
        targetEl =
          doc.querySelector<HTMLElement>("#about") ||
          doc.querySelector<HTMLElement>("section[class*='about']") ||
          doc.querySelectorAll<HTMLElement>("section")[1] ||
          null;
      }

      if (!targetEl) {
        throw new Error(`Could not find the ${slot} section element in the preview.`);
      }

      const blob = await toBlob(targetEl, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      if (!blob) {
        throw new Error("Screenshot capture failed.");
      }

      const file = new File([blob], `${slot}-${Date.now()}.png`, { type: "image/png" });
      const formData = new FormData();
      formData.append("slot", slot);
      formData.append("file", file);

      const res = await fetch(`/api/leads/${lead.id}/mockup`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save screenshot to Mockup Studio.");
      }

      setCapturedSuccess(`${slot === "hero" ? "Hero" : "About"} captured to Social Studio ✓`);
      setTimeout(() => setCapturedSuccess(null), 3500);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to capture screenshot.");
    } finally {
      setCapturingSlot(null);
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

  // 1. Segmented Pipeline Management
  const [pipelineView, setPipelineView] = useState<"active" | "won" | "lost" | "all">("active");
  const [pipelineSearch, setPipelineSearch] = useState("");

  const activeCount = otherLeads.filter((l) => !["paid", "live", "lost"].includes(l.status)).length;
  const wonCount = otherLeads.filter((l) => ["paid", "live"].includes(l.status)).length;
  const lostCount = otherLeads.filter((l) => l.status === "lost").length;

  const filteredBySearch = otherLeads.filter((item) => {
    if (!pipelineSearch.trim()) return true;
    const q = pipelineSearch.toLowerCase().trim();
    return (
      (item.business_name && item.business_name.toLowerCase().includes(q)) ||
      (item.slug && item.slug.toLowerCase().includes(q)) ||
      (item.contact_name && item.contact_name.toLowerCase().includes(q)) ||
      (item.phone && item.phone.includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.industry && item.industry.toLowerCase().includes(q))
    );
  });

  const activeLeads = filteredBySearch.filter((item) => !["paid", "live", "lost"].includes(item.status));
  const wonLeads = filteredBySearch.filter((item) => ["paid", "live"].includes(item.status));
  const lostLeads = filteredBySearch.filter((item) => item.status === "lost");

  const currentViewLeads =
    pipelineView === "active"
      ? activeLeads
      : pipelineView === "won"
      ? wonLeads
      : pipelineView === "lost"
      ? lostLeads
      : filteredBySearch;

  const inboundLeads = currentViewLeads.filter((item) => item.source !== "outreach" && item.source !== "manual");
  const outreachLeads = currentViewLeads.filter((item) => item.source === "outreach" || item.source === "manual");

  function renderLeadCard(item: Lead) {
    const isSelected = item.id === lead.id;
    const itemTrade = item.industry || (item.persona ? item.persona.replace(/-/g, " ") : "Business");

    const isPaid = item.status === "paid" || item.status === "live";
    const isLost = item.status === "lost";
    const isDelivered = item.status === "delivered";
    const isEngaged = item.status === "contacted" || !!item.last_viewed_at;
    const isBuilding = item.status === "scraping" || item.status === "rendering";
    const isQa = item.status === "qa_pending" || item.status === "qa_approved";

    return (
      <Link
        key={item.id}
        href={`/admin/leads/${item.id}`}
        title={`${item.business_name || item.slug} · ${itemTrade}`}
        className={`group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 transition border ${
          isSelected
            ? "border-indigo-500 bg-indigo-50/90 ring-1 ring-indigo-500/30 text-indigo-950 font-bold shadow-2xs"
            : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50/90"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              isPaid
                ? "bg-emerald-500 shadow-sm"
                : isLost
                ? "bg-rose-400"
                : isEngaged
                ? "bg-sky-500 shadow-sm animate-pulse"
                : isDelivered
                ? "bg-indigo-500 shadow-sm"
                : isQa
                ? "bg-purple-500 shadow-sm"
                : isBuilding
                ? "bg-amber-500 shadow-sm animate-pulse"
                : "bg-slate-400"
            }`}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold leading-tight text-slate-900">
              {item.business_name || item.slug}
            </span>
            <span className="block truncate text-[10px] leading-tight text-slate-500 font-medium mt-0.5">
              {isPaid
                ? "🏆 Paid Client"
                : isLost
                ? "🗄️ Archived"
                : isEngaged
                ? "💬 In Conversation"
                : isDelivered
                ? "📧 Pitch Sent"
                : isQa
                ? "🔍 Ready for QA"
                : isBuilding
                ? "⚡ Building the site"
                : STATUS_LABEL[item.status] ?? item.status}
              {item.contact_name ? ` · ${item.contact_name}` : ""}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(item.source === "outreach" || item.source === "manual") && (
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200/60 px-1.5 py-0.2 rounded-md">
              🎯
            </span>
          )}
          {isPaid && (
            <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
              $997
            </span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]">
      {/* 1. LEFT ASIDE: SEGMENTED LEAD PIPELINES & WEEKLY PULSE */}
      <aside className="min-w-0 space-y-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-3.5 shadow-sm">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-0.5">
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block">Lead Pipeline</span>
              <span className="text-[10px] text-slate-400 font-medium">Segmented by conversion stage</span>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 text-[11px] font-extrabold text-indigo-700">
              {activeCount} active
            </span>
          </div>

          {/* Segmented Pipeline Stage Filter Buttons (Ultra-compact, single-line tabs) */}
          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-[10.5px] font-semibold">
            <button
              type="button"
              onClick={() => setPipelineView("active")}
              className={`py-1 px-1 rounded-md flex items-center justify-center gap-1 whitespace-nowrap transition ${
                pipelineView === "active"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Active in-flight leads"
            >
              <span>Active</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                pipelineView === "active" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200/80 text-slate-600"
              }`}>
                {activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPipelineView("won")}
              className={`py-1 px-1 rounded-md flex items-center justify-center gap-1 whitespace-nowrap transition ${
                pipelineView === "won"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Won & closed clients"
            >
              <span>Won</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                pipelineView === "won" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/80 text-slate-600"
              }`}>
                {wonCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPipelineView("lost")}
              className={`py-1 px-1 rounded-md flex items-center justify-center gap-1 whitespace-nowrap transition ${
                pipelineView === "lost"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Lost or archived leads"
            >
              <span>Lost</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                pipelineView === "lost" ? "bg-rose-100 text-rose-700" : "bg-slate-200/80 text-slate-600"
              }`}>
                {lostCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPipelineView("all")}
              className={`py-1 px-1 rounded-md flex items-center justify-center gap-1 whitespace-nowrap transition ${
                pipelineView === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="All leads"
            >
              <span>All</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                pipelineView === "all" ? "bg-slate-200 text-slate-900" : "bg-slate-200/80 text-slate-600"
              }`}>
                {otherLeads.length}
              </span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone..."
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* 1. View: Won Pipeline */}
          {pipelineView === "won" && (
            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Closed &amp; Paid Clients ({wonLeads.length})
                </span>
                <p className="mt-0.5 text-[11px] text-emerald-700">These deals are won. Build handover &amp; go-live active.</p>
              </div>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                {wonLeads.length === 0 ? (
                  <p className="px-2 py-3 text-xs italic text-slate-400 text-center">No won leads yet. Close your first deal!</p>
                ) : (
                  wonLeads.map((item) => renderLeadCard(item))
                )}
              </div>
            </div>
          )}

          {/* 2. View: Lost / Archived Pipeline */}
          {pipelineView === "lost" && (
            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-600" /> Archived &amp; Not Interested ({lostLeads.length})
                </span>
                <p className="mt-0.5 text-[11px] text-rose-700">Removed from active queue. Click any lead to inspect or reactivate.</p>
              </div>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                {lostLeads.length === 0 ? (
                  <p className="px-2 py-3 text-xs italic text-slate-400 text-center">No archived leads.</p>
                ) : (
                  lostLeads.map((item) => renderLeadCard(item))
                )}
              </div>
            </div>
          )}

          {/* 3. View: Active & All Pipelines */}
          {(pipelineView === "active" || pipelineView === "all") && (
            <div className="space-y-3 pt-1">
              <details className="group" open={inboundLeads.length > 0 && inboundLeads.length <= 12}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                    Inbound Leads ({inboundLeads.length})
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <div className="space-y-1.5 pt-2 max-h-[320px] overflow-y-auto pr-0.5">
                  {inboundLeads.length === 0 ? (
                    <p className="px-2 py-2 text-xs italic text-slate-400">No active inbound submissions</p>
                  ) : (
                    inboundLeads.map((item) => renderLeadCard(item))
                  )}
                </div>
              </details>

              <details className="group border-t border-slate-100 pt-3" open={outreachLeads.length > 0 && outreachLeads.length <= 12}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-2 py-1.5 hover:bg-slate-50">
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    🎯 Manual Outreach ({outreachLeads.length})
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <div className="space-y-2 pt-2">
                  <AddUrlDialog variant="sidebar" />
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
                    {outreachLeads.length === 0 ? (
                      <p className="px-2 py-2 text-xs italic text-slate-400">No active outreach prospects</p>
                    ) : (
                      outreachLeads.map((item) => renderLeadCard(item))
                    )}
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        {inboundLeads.length > 0 && (
          <OutreachSequencePanel
            leads={inboundLeads}
            track="inbound"
            title="Inbound delivery sequence"
            blurb="These prospects requested their rebuild, so message 1 delivers rather than pitches."
          />
        )}

        {outreachLeads.length > 0 && <OutreachSequencePanel leads={outreachLeads} track="outreach" />}

        <PeriodPulsePanel collectedRevenue={collectedThisWeek} pipelineToClose={pendingCloseAmount} />
      </aside>

      {/* 2. RIGHT COLUMN: MASTER COMMAND STUDIO */}
      <div className="space-y-6">
        {/* Master Command Card */}
        <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
          {/* Header Row: Lead Identity & Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {lead.source === "outreach" || lead.source === "manual" ? (
                  <Badge variant="outline" className="whitespace-nowrap text-[11px] font-extrabold px-2.5 py-0.5 bg-sky-50 text-sky-700 border-sky-300 rounded-lg">
                    🎯 Manual Outreach
                  </Badge>
                ) : (
                  <Badge variant="outline" className="whitespace-nowrap text-[11px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-300 rounded-lg">
                    ⚡ Inbound Ad Lead
                  </Badge>
                )}
                <Badge variant="outline" className="whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 bg-slate-50 text-slate-700 border-slate-300 rounded-lg">
                  {STATUS_LABEL[lead.status] ?? lead.status}
                </Badge>
                <DeliverySlaTimer createdAt={lead.created_at} deliveredAt={lead.delivered_at} />
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {businessName}
                </h1>
                <div className="flex shrink-0 items-center rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                  <EditLeadDialog
                    leadId={lead.id}
                    businessName={lead.business_name}
                    sourceUrl={lead.source_url}
                    facebookPixelId={lead.facebook_pixel_id}
                    googleSiteVerification={lead.google_site_verification}
                    contactName={lead.contact_name}
                    phone={lead.phone}
                    email={lead.email}
                    painPoints={lead.pain_points}
                  />
                  <DeleteLeadButton leadId={lead.id} />
                </div>
              </div>

              <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-slate-600">
                <span>{lead.contact_name || "Business Owner"}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-800 font-bold">{phone}</span>
                <span className="text-slate-300">·</span>
                {email === "No email on file" ? (
                  <span className="truncate text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Missing Email (Needs Update)</span>
                ) : (
                  <span className="truncate text-slate-800">{email}</span>
                )}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                title="Opens the page the client sees: their new homepage, the report and the price."
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" /> Client Portal
              </a>

              <button
                onClick={handleSendBrevoEmail}
                disabled={sendingEmail}
                title="Emails the client a private link to their new homepage and report."
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-2xs transition ${
                  emailSent
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80"
                    : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {sendingEmail ? "Sending..." : emailSent ? "Pitch Sent ✓" : "Email Pitch"}
              </button>

              {lead.phone && (
                <a
                  href={`tel:${lead.phone.replace(/\D/g, "")}`}
                  title={`Calls ${lead.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> Call
                </a>
              )}

              <button
                onClick={handleGenerateStripeCheckout}
                disabled={generatingStripe}
                title="Creates a Stripe payment link for this price and opens it."
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#533afd] hover:bg-[#432ec4] text-white px-4 py-2 text-xs font-bold shadow-sm shadow-indigo-500/20 transition"
              >
                <CircleDollarSign className="h-3.5 w-3.5 text-amber-300" /> Ask Payment ({priceDisplay})
              </button>
            </div>
          </div>

          {/* Outreach Pipeline Status & Outcome Toolbar */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Stage:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
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
                    ? "🚫 Not Interested / Lost"
                    : currentLeadStatus === "paid" || currentLeadStatus === "live"
                    ? "🏆 Won & Paid"
                    : currentLeadStatus === "contacted"
                    ? "💬 In Conversation"
                    : currentLeadStatus === "delivered"
                    ? "📧 Step 1 Pitch Sent"
                    : "Ready for Outreach"}
                </span>

                {(proposalViews && proposalViews.length > 0) || lead.last_viewed_at ? (
                  <button onClick={() => {
                    if (proposalViews && proposalViews.length > 0) setViewsModalOpen(true);
                  }} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition animate-pulse">
                    <Eye className="h-3 w-3" />
                    Proposal Opened {proposalViews?.length > 1 ? `(${proposalViews.length}x) ` : ''}
                    {new Date((proposalViews && proposalViews[0]) || lead.last_viewed_at!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                  </button>
                ) : lead.delivered_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                    <Clock3 className="h-3 w-3" /> Email Sent · Awaiting Open
                  </span>
                ) : null}
              </div>

              {/* 1-Click Outcome Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("contacted")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "contacted"
                      ? "bg-blue-600 text-white border-blue-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  💬 In Conversation
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("paid")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "paid" || currentLeadStatus === "live"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  🏆 Won / Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus("lost")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                    currentLeadStatus === "lost"
                      ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  🚫 Not Interested
                </button>
                {["lost", "contacted", "paid", "live"].includes(currentLeadStatus) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateLeadStatus("qa_approved")}
                    className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {currentLeadStatus === "lost" && (
              <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                ⚠️ Lead is marked as Not Interested. Email delivery is disabled.
              </p>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            <HeaderStat
              label="Proposal link activity"
              value={
                proposalViews && proposalViews.length > 0 ? (
                  <span className="flex items-center gap-1.5">
                    Opened ✓
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full">{proposalViews.length}</span>
                  </span>
                ) : lead.delivered_at ? "Sent" : "Unsent"
              }
              suffix={
                proposalViews && proposalViews.length > 0 
                  ? ` · ${new Date(proposalViews[0]).toLocaleDateString([], { month: "short", day: "numeric" })} ${new Date(proposalViews[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  : ""
              }
              tone={proposalViews && proposalViews.length > 0 ? "good" : "neutral"}
              onClick={() => {
                if (proposalViews && proposalViews.length > 0) setViewsModalOpen(true);
              }}
            />
            <Dialog open={viewsModalOpen} onOpenChange={setViewsModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Proposal View History</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="text-sm text-slate-500 pb-2 border-b">
                    Total opens: <span className="font-bold text-slate-900">{proposalViews?.length || 0}</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                    {proposalViews?.map((viewDate, i) => {
                      const d = new Date(viewDate);
                      return (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-700">
                            {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setViewsModalOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>
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
              label="Cost to acquire"
              value={
                cost.totalUsd !== null
                  ? `$${cost.totalUsd.toFixed(2)}`
                  : cost.calls > 0
                    ? `${(cost.promptTokens + cost.completionTokens).toLocaleString()}`
                    : "—"
              }
              suffix={
                cost.totalUsd !== null
                  ? cost.adShareUsd !== null
                    ? ` · ads $${cost.adShareUsd.toFixed(2)} of ${cost.adShareCohort}`
                    : ` · ${cost.calls} model calls`
                  : cost.calls > 0
                    ? " tokens · no price"
                    : ""
              }
              tone="neutral"
            />
          </div>
        </div>

        {/* Rail and content are siblings in a row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
          <WorkspaceTabs steps={steps} active={tab} onChange={setTab} />

          <div className="min-w-0 flex-1 space-y-4">
            <WorkspaceTabHint steps={steps} active={tab} />

            <TabPanel active={tab === "lead"}>
              {/* STEP 1: INBOUND INTAKE & VERIFIED FACTS */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-700 shrink-0">
                      1
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">Inbound Lead &amp; Verified Facts</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!scrapeResults ? (
                      <button
                        onClick={() => handleAnalyse("light")}
                        disabled={rescraping}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#533afd] hover:bg-[#432ec4] px-4 py-2 text-xs font-bold text-white disabled:opacity-60 shadow-sm shadow-indigo-500/20 transition"
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
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${rescraping ? "animate-spin" : ""}`} />
                          Refresh (1 page)
                        </button>
                        <button
                          onClick={() => handleAnalyse("deep")}
                          disabled={rescraping}
                          title="Reads up to 25 of their pages instead of 2."
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
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

                <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed">
                  <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80 space-y-2">
                    <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px]">Selected Intake Pains</span>
                    {lead.pain_points.length > 0 ? (
                      lead.pain_points.map((p) => <p key={p} className="font-bold text-slate-900 text-xs">• {p}</p>)
                    ) : (
                      <p className="text-slate-600 font-medium text-xs">Standard Speed &amp; Conversion Optimization</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80 space-y-2">
                    <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px]">Verified Credentials</span>
                    <p className="font-bold text-slate-900 text-xs">
                      • Google Rating: {reviewCount > 0 ? `${rating} ★ (${reviewCount}+ Reviews)` : "Pending Verification"}
                    </p>
                    <p className="font-bold text-slate-900 text-xs">
                      • Location: {city || "Global / Digital"}
                    </p>
                    <p className="font-bold text-slate-900 text-xs">• Operating Business Entity</p>
                  </div>

                  <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px]">Extracted Brand Tokens</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {logoName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="h-3.5 w-3.5 rounded-full border shadow-inner shrink-0" style={{ backgroundColor: primaryColor }} /> {primaryColor}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="h-3.5 w-3.5 rounded-full border shadow-inner shrink-0" style={{ backgroundColor: accentColor }} /> {accentColor}
                      </span>
                    </div>

                    {resolvedLogo && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs">
                        <div className="flex h-8 w-20 items-center justify-center rounded bg-slate-50 border border-slate-100 p-1 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolvedLogo}
                            alt={businessName}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{businessName}</p>
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Brand Asset Ready
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Launch Studio (3D Poster & Motion Kit) */}
              <SocialMockupPanel lead={lead} artifact={artifact} facts={facts} />
            </TabPanel>

            <TabPanel active={tab === "build"}>
              {/* STEP 2: BESPOKE GENERATOR STUDIO */}
              <BespokeGenerationStudio
                lead={lead}
                artifact={artifact}
                scrapeResults={scrapeResults}
                onGenerated={() => setReloadKey((k) => k + 1)}
              />
            </TabPanel>

            <TabPanel active={tab === "photos"}>
              <ManualPhotoUpload leadId={lead.id} onUploadComplete={() => setReloadKey((k) => k + 1)} />

              {artifact?.bespoke_homepage_html && (
                <RefinePanel key={`slots-${reloadKey}`} leadId={lead.id} />
              )}

              {scrapeResults && (
                <HandBuildPanel leadId={lead.id} hasPage={!!artifact?.bespoke_homepage_html} />
              )}
            </TabPanel>

            <TabPanel active={tab === "audit"}>
              {scrapeResults && <AuditPanel key={`audit-${reloadKey}`} leadId={lead.id} />}
            </TabPanel>

            <TabPanel active={tab === "rivals"}>
              {scrapeResults && <CompetitorPanel key={`rivals-${reloadKey}`} leadId={lead.id} />}

              {scrapeResults && (
                <VisibilityPanel key={`visibility-${reloadKey}`} leadId={lead.id} industry={lead.industry} />
              )}

              {/* Competitor Benchmark */}
              {competitorsList.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-700">
                        3
                      </span>
                      <h3 className="font-bold text-base text-slate-900">Competitor Head-to-Head Benchmark ({competitorsList.length} Competitors)</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 shrink-0">
                      <BarChart3 className="h-3 w-3" /> Market Analysis
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                          <th className="pb-3">Company</th>
                          <th className="pb-3">Google Reviews</th>
                          <th className="pb-3">Mobile Speed</th>
                          <th className="pb-3">Service Routes</th>
                          <th className="pb-3">Domain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {competitorsList.map((comp) => (
                          <tr
                            key={comp.name}
                            className={comp.status === "Leader" ? "bg-indigo-50/60 font-bold text-indigo-700" : "text-slate-700"}
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
            </TabPanel>

            <TabPanel active={tab === "review"}>
              {!artifact ? (
                <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-12 text-center space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-[#533afd] mx-auto border border-indigo-100">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-lg text-slate-900">Ready to build their site</h4>
                    <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-600">
                      We have read their site and extracted their brand details. Open the <strong className="text-[#533afd]">Build</strong> step to verify the brief and press Generate.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#533afd]">
                        <Eye className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">Generated website preview</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Review the real responsive page before approval.</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <details className="group relative">
                        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 shadow-2xs">
                          <Camera className="h-3 w-3" /> Capture
                        </summary>
                        <div className="absolute right-0 z-20 mt-1 flex w-44 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                          <button
                            type="button"
                            disabled={Boolean(capturingSlot)}
                            onClick={() => captureIframeSection("hero")}
                            className="rounded-lg px-2 py-1.5 text-left text-xs font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                          >
                            {capturingSlot === "hero" ? "Capturing hero…" : "Capture hero"}
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(capturingSlot)}
                            onClick={() => captureIframeSection("about")}
                            className="rounded-lg px-2 py-1.5 text-left text-xs font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
                          >
                            {capturingSlot === "about" ? "Capturing about…" : "Capture about"}
                          </button>
                        </div>
                      </details>

                      {capturedSuccess && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {capturedSuccess}
                        </span>
                      )}

                      <select
                        value={previewPath}
                        onChange={(e) => setPreviewPath(e.target.value)}
                        aria-label="Preview page"
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#533afd] shadow-2xs"
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

                      <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Preview viewport">
                        <button
                          type="button"
                          onClick={() => setPreviewViewport("desktop")}
                          aria-pressed={previewViewport === "desktop"}
                          className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${previewViewport === "desktop" ? "bg-white text-[#533afd] shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          <Monitor className="h-3.5 w-3.5" /> Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewViewport("mobile")}
                          aria-pressed={previewViewport === "mobile"}
                          className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${previewViewport === "mobile" ? "bg-white text-[#533afd] shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          <Smartphone className="h-3.5 w-3.5" /> Mobile
                        </button>
                      </div>

                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#533afd] hover:bg-indigo-50/50 shadow-2xs"
                      >
                        Open tab <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 px-5 py-2.5">
                    <ShowcaseApprovalControl
                      leadId={lead.id}
                      initialApproved={lead.showcase_approved}
                      initialLabel={lead.showcase_label}
                      hasImages={Boolean(lead.showcase_before_url && lead.showcase_after_url)}
                      compact
                    />
                  </div>

                  <div className="overflow-auto bg-slate-100 p-3 sm:p-6">
                    <div className={`mx-auto overflow-hidden border border-slate-300 bg-white shadow-xl transition-[width] duration-300 ${previewViewport === "mobile" ? "w-[390px] max-w-full rounded-[28px]" : "w-full min-w-[1024px] rounded-2xl"}`}>
                      <div className="flex h-9 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3" aria-hidden>
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#5dd39e]" />
                        <span className="mx-auto rounded-md border border-slate-200 bg-white px-4 py-0.5 text-[10px] text-slate-400 font-mono">
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

              <ApprovalGate lead={lead} artifact={artifact} onChanged={() => setReloadKey((k) => k + 1)} />
            </TabPanel>

            <TabPanel active={tab === "send"}>
              {/* STEP 5: AUTOMATED OUTREACH & BREVO DELIVERY */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-black text-indigo-700">
                      5
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Outreach &amp; Sequence Delivery</h3>
                  </div>

                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("inbound")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        outreachMode === "inbound"
                          ? "bg-white text-[#533afd] shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🎯 Inbound Lead (Requested)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("cold")}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        outreachMode === "cold"
                          ? "bg-[#533afd] text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ⚡ Cold Outreach (Gift)
                    </button>
                  </div>
                </div>

                {/* Sequence Step Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      {outreachMode === "inbound" ? "Inbound Requested Delivery Sequence:" : "Cold Outreach Anti-Spam Sequence:"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {outreachMode === "inbound" ? "Warm follow-up on requested site" : "Born-to-help gift & curiosity loop"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => selectOutreachSequenceStep(1)}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        activeOutreachStep === 1
                          ? "border-[#533afd] bg-indigo-50/60 ring-2 ring-[#533afd]/20 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-900">
                          {outreachMode === "inbound" ? "1. Initial Delivery" : "1. Value Drop Gift"}
                        </span>
                        {localOutreachStage >= 1 && <Check className="h-4 w-4 text-emerald-500" />}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                        {outreachMode === "inbound" ? "Your requested 48h rebuild is ready" : "Rebuilt concept & speed audit (no charge)"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectOutreachSequenceStep(2)}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        activeOutreachStep === 2
                          ? "border-[#533afd] bg-indigo-50/60 ring-2 ring-[#533afd]/20 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-900">2. 48h Follow-up Bump</span>
                        {localOutreachStage >= 2 && <Check className="h-4 w-4 text-emerald-500" />}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                        {outreachMode === "inbound" ? "Checking in on requested concept" : "Checking in on requested concept"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectOutreachSequenceStep(3)}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        activeOutreachStep === 3
                          ? "border-[#533afd] bg-indigo-50/60 ring-2 ring-[#533afd]/20 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-900">3. Final Notice</span>
                        {localOutreachStage >= 3 && <Check className="h-4 w-4 text-emerald-500" />}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                        {outreachMode === "inbound" ? "Final check before staging archive" : "Final check before staging archive"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5">
                  <div className="flex flex-col gap-2 border-b border-indigo-200/60 pb-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-semibold text-slate-800">
                      <strong>Recipient:</strong> {email === "No email on file" ? <span className="text-rose-600 font-bold">Missing valid email</span> : email}
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
                        {copiedPortalLink ? "Proposal Link Copied! ✓" : "Copy Proposal Link"}
                      </button>
                      <span className="text-indigo-200">·</span>
                      <a
                        href={`/s/${lead.slug}?view=preview`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#533afd] hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Live Website Directly
                      </a>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="mb-1 block text-xs font-bold text-slate-900">Subject</span>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="h-9 bg-white text-xs rounded-xl border-slate-200 font-medium"
                      />
                    </div>

                    <div>
                      <span className="mb-1 block text-xs font-bold text-slate-900">Email Content</span>
                      <Textarea
                        rows={3}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="resize-none bg-white text-xs rounded-xl border-slate-200 font-sans leading-relaxed"
                      />
                    </div>
                  </div>

                  {currentLeadStatus === "lost" ? (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800 flex items-center justify-between">
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
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                      <span>🏆 Client has purchased. Automated outreach sequence finished.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">
                        Sending Step {activeOutreachStep} will update status to{" "}
                        <strong>{activeOutreachStep === 1 ? "Delivered" : "Contacted"}</strong>.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await handleUpdateLeadStatus(activeOutreachStep === 1 ? "delivered" : "contacted");
                            setEmailSent(true);
                          }}
                          disabled={sendingEmail || localOutreachStage >= activeOutreachStep}
                          className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2 text-xs font-bold text-slate-700 shadow-sm transition disabled:opacity-50"
                        >
                          Mark Sent Manually (Zoho)
                        </button>
                        <button
                          onClick={handleSendBrevoEmail}
                          disabled={sendingEmail || localOutreachStage >= activeOutreachStep}
                          className="rounded-xl bg-[#533afd] hover:bg-[#432ec4] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 transition disabled:opacity-50"
                        >
                          {sendingEmail ? "Sending via Brevo..." : (localOutreachStage >= activeOutreachStep) ? "Sent ✓" : `Send Step ${activeOutreachStep}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabPanel>

            <TabPanel active={tab === "close"}>
              <LeadValuePanel leadId={lead.id} value={aiLeadValue} />

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
              <div className="rounded-2xl bg-slate-900 p-7 text-white shadow-md flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#533afd] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                      FINAL STEP
                    </span>
                    <span className="text-xs text-white/70">Payment & Go-Live SLA</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold">
                    Collect {priceDisplay} &amp; Launch {lead.custom_domain || lead.source_url}
                  </h3>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Client receives 100% standalone Next.js code + DNS CNAME setup with a 2-4 week launch timeline after payment, content approval, and domain access.
                  </p>
                </div>

                <button
                  onClick={handleGenerateStripeCheckout}
                  disabled={generatingStripe}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#533afd] hover:bg-[#432ec4] px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 transition shrink-0"
                >
                  <CreditCard className="h-4 w-4" /> Send {priceDisplay} Payment Link
                </button>
              </div>
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
