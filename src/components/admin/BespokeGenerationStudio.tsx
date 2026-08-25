"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Code2,
  FolderTree,
  Image as ImageIcon,
  Layers,
  Loader2,
  RefreshCw,
  Rocket,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InspirationPanel } from "@/components/admin/InspirationPanel";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

interface BespokeGenerationStudioProps {
  lead: Lead;
  artifact: Artifact | null;
  scrapeResults: ScrapeResults | null;
  onGenerated?: () => void;
}

export function BespokeGenerationStudio({
  lead,
  artifact,
  scrapeResults,
  onGenerated,
}: BespokeGenerationStudioProps) {
  const router = useRouter();
  const facts = (scrapeResults?.facts ?? {}) as Record<string, unknown>;
  const nap = (facts.nap as { address?: string; phone?: string; email?: string } | undefined) || {};
  const schema = Array.isArray(facts.existing_schema) && facts.existing_schema.length > 0 ? (facts.existing_schema[0] as any) : {};
  const sitePhotos = Array.isArray(facts.site_photos) ? (facts.site_photos as any[]) : [];
  const primaryScrapedPhoto = sitePhotos.find((p) => p.kind === "img" && p.url && (p.url.includes("headshot") || p.url.includes("photo")))?.url || sitePhotos[0]?.url;

  // Services come from the classification pass, which reads the page
  // content. Navigation text was the previous source and it put the
  // business's phone number and email address into this box as services —
  // and because whatever is in here overrides the classified list at
  // generation time, those went straight onto the client's homepage.
  const classifiedServices = Array.isArray(facts.derived_services) ? (facts.derived_services as string[]) : [];
  const classifiedAreas = Array.isArray(facts.derived_areas) ? (facts.derived_areas as string[]) : [];

  // Extract previously saved generated assets from Supabase
  const extracted = (artifact?.extracted_assets as any) || {};

  const defaultBusinessName = extracted.business_name || schema.name || (typeof facts.business_name === "string" ? facts.business_name : null) || lead.business_name || "";
  const defaultFounder = extracted.founder_name || schema.founder?.name || lead.contact_name || "";
  const defaultLogo = extracted.branding?.logo || schema.logo || (typeof facts.logo_url === "string" ? facts.logo_url : "") || "";
  const defaultFooterLogo = extracted.footer_logo_url || "";
  const defaultHero = extracted.hero_cutout || primaryScrapedPhoto || "";
  const defaultCity = extracted.city || (schema.address?.addressLocality ? `${schema.address.addressLocality}, ${schema.address.addressRegion || ""}`.trim() : typeof facts.town === "string" ? facts.town : "");
  const defaultIndustry = extracted.industry || lead.industry || (typeof facts.industry === "string" ? facts.industry : "");

  const defaultServices = Array.isArray(extracted.services_list) && extracted.services_list.length > 0
    ? extracted.services_list.join("\n")
    : classifiedServices.join("\n");

  const defaultAreas = Array.isArray(extracted.areas_list) && extracted.areas_list.length > 0
    ? extracted.areas_list.join("\n")
    : classifiedAreas.join("\n");

  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [founder, setFounder] = useState(defaultFounder);
  const [heroImage, setHeroImage] = useState(defaultHero);
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [footerLogoUrl, setFooterLogoUrl] = useState(defaultFooterLogo);
  const [city, setCity] = useState(defaultCity);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [servicesText, setServicesText] = useState(defaultServices);
  const [areasText, setAreasText] = useState(defaultAreas);
  const [primaryColor, setPrimaryColor] = useState(extracted.branding?.colors?.primary || (facts.colors as any)?.primary || "#533AFD");
  // useState initialisers run once. Analysis finishes minutes later and
  // refreshes these props, but the fields kept their original empty values —
  // so the brief looked unpopulated until the operator reloaded by hand.
  // Fields the operator has actually typed in are never overwritten.
  const dataSignature = `${defaultBusinessName}|${defaultCity}|${defaultIndustry}|${defaultServices}|${defaultAreas}`;
  const lastSignature = useRef(dataSignature);
  const touched = useRef(false);

  useEffect(() => {
    if (dataSignature === lastSignature.current) return;
    lastSignature.current = dataSignature;
    if (touched.current) return;

    setBusinessName(defaultBusinessName);
    setCity(defaultCity);
    setIndustry(defaultIndustry);
    setServicesText(defaultServices);
    setAreasText(defaultAreas);
    setFounder(defaultFounder);
    setHeroImage(defaultHero);
    setLogoUrl(defaultLogo);
    setFooterLogoUrl(defaultFooterLogo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSignature]);
  const [accentColor, setAccentColor] = useState(extracted.branding?.colors?.accent || (facts.colors as any)?.accent || "#FFD12D");
  // Which model writes the homepage markup and stylesheet. OpenAI is the
  // proven default; Gemini is opt-in per generation so the two can be
  // compared on real leads before either becomes the default.
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genWarnings, setGenWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [visualQa, setVisualQa] = useState<{ attempt: number; visual_status: string } | null>(null);

  // Only true while a scrape is genuinely running. This previously also
  // matched any lead that simply had no scrape yet, so a brand-new lead
  // displayed "Firecrawl is analyzing..." while nothing at all was happening
  // -- and the operator waited for a result that was never coming.
  const isScraping = lead.status === "scraping";
  const notAnalysed = !scrapeResults && !isScraping;

  const [uploadingSlot, setUploadingSlot] = useState<"hero" | "logo" | "footerLogo" | null>(null);

  async function handleDirectUpload(slot: "hero" | "logo" | "footerLogo", file: File | undefined) {
    if (!file) return;
    setUploadingSlot(slot);
    markTouched();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lead_id", lead.id);
      formData.append("slot_hint", slot === "hero" ? "hero" : slot === "logo" ? "logo" : "footer-logo");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      if (slot === "hero") setHeroImage(data.url);
      else if (slot === "logo") setLogoUrl(data.url);
      else if (slot === "footerLogo") setFooterLogoUrl(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload image to Supabase Storage");
    } finally {
      setUploadingSlot(null);
    }
  }

  // Phase 2: every service, area, about, FAQ and contact page, each written
  // to match the homepage that was approved. It is a separate button rather
  // than part of the first build because until the client says yes, that
  // spend is on a lead that may never reply.
  async function handleBuildRest() {
    setGenerating(true);
    setVisualQa(null);
    setGenError(null);
    setGenWarnings([]);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: 2, provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start the full-site build");
      pollProgress();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Full-site build failed to start");
      setGenerating(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setVisualQa(null);
    setGenError(null);
    setGenWarnings([]);
    try {
      const services = (servicesText || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const areas = (areasText || "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/leads/${lead.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          founder,
          heroImage,
          logoUrl,
          footerLogoUrl,
          city,
          industry,
          services,
          areas,
          // Phone and email are deliberately NOT defaulted to a placeholder.
          // A generated page with someone else's phone number on it is worse
          // than one with no phone number at all.
          phone: lead.phone || nap.phone || undefined,
          email: lead.email || nap.email || undefined,
          provider,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenWarnings(data.warnings ?? []);
        throw new Error(data.error || "Generation could not start");
      }

      setGenWarnings(data.warnings ?? []);
      pollProgress();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setGenerating(false);
    }
  }

  // The brief autosaves. It was previously only sent alongside a generate
  // request and never written back, so "Exact Industry" and "Core Services"
  // came back empty on every reload -- typed, used once, lost.
  const briefRef = useRef({ businessName, founder, city, industry, servicesText, areasText, heroImage, logoUrl, footerLogoUrl });
  briefRef.current = { businessName, founder, city, industry, servicesText, areasText, heroImage, logoUrl, footerLogoUrl };

  const [briefSaved, setBriefSaved] = useState<"idle" | "saving" | "saved">("idle");

  const markTouched = () => {
    touched.current = true;
  };

  const saveBrief = useCallback(async () => {
    const b = briefRef.current;
    setBriefSaved("saving");
    try {
      await fetch(`/api/leads/${lead.id}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: b.businessName,
          founder: b.founder,
          city: b.city,
          industry: b.industry,
          heroImage: b.heroImage,
          logoUrl: b.logoUrl,
          footerLogoUrl: b.footerLogoUrl,
          services: b.servicesText.split("\n").map((x: string) => x.trim()).filter(Boolean),
          areas: b.areasText.split("\n").map((x: string) => x.trim()).filter(Boolean),
        }),
      });
      setBriefSaved("saved");
    } catch {
      setBriefSaved("idle");
    }
  }, [lead.id]);

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    if (briefSaved === "saving") return;
    const timer = setTimeout(saveBrief, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, founder, city, industry, servicesText, areasText, heroImage, logoUrl, footerLogoUrl]);

  // A build that died without writing a status leaves its row on "running"
  // forever, and the Generate button is disabled while a build is running —
  // so the one action that would clear it is the one action unavailable.
  // A run that has not touched its row in this long is not running.
  const STALE_AFTER_MS = 15 * 60 * 1000;

  const isStalled = (job: { status?: string; updated_at?: string } | null | undefined) =>
    job?.status === "running" &&
    !!job.updated_at &&
    Date.now() - new Date(job.updated_at).getTime() > STALE_AFTER_MS;

  const STALLED_MESSAGE =
    "The last build stopped without finishing — most likely the model returned nothing. Press Generate to start it again.";

  // Generation is a multi-minute background job (several model calls plus a
  // critique pass), so the button reports real step progress rather than
  // spinning against a request that would have timed out anyway.
  const pollProgress = useCallback(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}/generate`);
        const data = await res.json().catch(() => ({}));
        const job = data.job;
        setVisualQa(data.visualQa ?? null);
        if (!job) return;

        setProgress({ done: job.pages_done ?? 0, total: job.pages_total ?? 1 });

        if (isStalled(job)) {
          clearInterval(timer);
          setGenerating(false);
          setGenError(STALLED_MESSAGE);
          return;
        }

        if (job.status === "complete" || job.status === "failed") {
          clearInterval(timer);
          setGenerating(false);
          if (job.status === "failed") {
            setGenError(job.error_message || "Generation failed \u2014 check the Inngest run for details.");
          } else {
            router.refresh();
            onGenerated?.();
            window.location.reload();
          }
        }
      } catch {
        // A dropped poll is not a failure — the next tick retries.
      }
    }, 3000);
    return timer;
  }, [lead.id, router, onGenerated]);

  // The job runs in the background, so a reload never interrupts it — but it
  // did previously lose the only thing watching it, leaving the operator
  // looking at an idle button while a build was still running. Reattaching on
  // mount makes the UI reflect real server state rather than the state of
  // this particular page load.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}/generate`);
        const data = await res.json().catch(() => ({}));
        setVisualQa(data.visualQa ?? null);
        if (cancelled || data.job?.status !== "running") return;
        // Do not reattach to a corpse — that is what left the button
        // disabled with no way back.
        if (isStalled(data.job)) {
          setGenError(STALLED_MESSAGE);
          return;
        }
        setGenerating(true);
        setProgress({ done: data.job.pages_done ?? 0, total: data.job.pages_total ?? 1 });
        timer = pollProgress();
      } catch {
        // No reachable job status is not itself an error to show.
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [lead.id, pollProgress]);

  if (isScraping) {
    return (
      <Card className="border border-border bg-[#f0f3ff] shadow-sm">
        <CardContent className="p-8 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#533afd] mx-auto" />
          <h3 className="font-bold text-base text-[#0d1738]">
            Reading {lead.source_url}...
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Mapping the site&apos;s pages, extracting real brand colours, photos, reviews and schema. This panel fills in
            by itself as each step lands.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (notAnalysed) {
    return (
      <Card className="border border-dashed border-[#c7d0fb] bg-[#fbfaff] shadow-sm">
        <CardContent className="p-8 text-center space-y-3">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#c7d0fb] bg-white text-[#533afd]">
            <Sparkles className="h-6 w-6" />
          </span>
          <h3 className="font-bold text-base text-[#0d1738]">This lead has not been analysed yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Nothing has been spent on it. Press <b>Analyse this lead</b> above to read their site — two Firecrawl pages —
            and the brief, brand tokens and generation studio all appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#533afd]/30 shadow-md bg-white overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-bold text-lg text-[#0d1738]">
                Build their website
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              These details came from reading their own site. Check they look right — anything wrong here ends up on their
              homepage — then press Generate.
            </p>
          </div>

        </div>

        <InspirationPanel
          leadId={lead.id}
          initialUrl={artifact?.inspiration_url ?? null}
          initialBranding={(artifact?.inspiration_branding as never) ?? null}
          industry={industry}
        />

        <form onSubmit={handleGenerate} className="space-y-5 text-xs">
          {(
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="gen-business-name" className="text-xs font-bold">Business Name</Label>
                <Input
                  id="gen-business-name"
                  value={businessName}
                  onChange={(e) => { markTouched(); setBusinessName(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. York Electrical Contractors"
                  required
                />
              </div>

              <div>
                <Label htmlFor="gen-founder" className="text-xs font-bold">Founder / Owner Name</Label>
                <Input
                  id="gen-founder"
                  value={founder}
                  onChange={(e) => { markTouched(); setFounder(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. David Karagounis"
                />
              </div>

              <div>
                <Label htmlFor="gen-city" className="text-xs font-bold">City / Target Territory</Label>
                <Input
                  id="gen-city"
                  value={city}
                  onChange={(e) => { markTouched(); setCity(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. Flushing, NY"
                />
              </div>

              <div>
                <Label htmlFor="gen-industry" className="text-xs font-bold">Exact Industry / Tagline</Label>
                <Input
                  id="gen-industry"
                  value={industry}
                  onChange={(e) => { markTouched(); setIndustry(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. Electrical & Solar Contractors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gen-hero" className="text-xs font-bold">Hero Photo / Cutout</Label>
                  <label className="cursor-pointer text-[11px] font-bold text-[#533afd] hover:underline inline-flex items-center gap-1">
                    {uploadingSlot === "hero" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>Upload to Supabase</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={Boolean(uploadingSlot)}
                      onChange={(e) => handleDirectUpload("hero", e.target.files?.[0])}
                    />
                  </label>
                </div>
                <Input
                  id="gen-hero"
                  value={heroImage}
                  onChange={(e) => { markTouched(); setHeroImage(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="https://.../owner-headshot.png"
                />
                {heroImage && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage}
                        alt="Hero preview"
                        className="h-10 w-16 rounded object-cover border border-black/10 bg-white"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-[10px] font-semibold text-slate-600 truncate">Hero Photo Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { markTouched(); setHeroImage(""); }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove hero image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gen-logo" className="text-xs font-bold">Brand Logo</Label>
                  <label className="cursor-pointer text-[11px] font-bold text-[#533afd] hover:underline inline-flex items-center gap-1">
                    {uploadingSlot === "logo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>Upload to Supabase</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={Boolean(uploadingSlot)}
                      onChange={(e) => handleDirectUpload("logo", e.target.files?.[0])}
                    />
                  </label>
                </div>
                <Input
                  id="gen-logo"
                  value={logoUrl}
                  onChange={(e) => { markTouched(); setLogoUrl(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="https://.../logo.png"
                />
                {logoUrl && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Brand logo preview"
                        className="h-9 max-w-[120px] rounded object-contain border border-black/10 bg-white p-1"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-[10px] font-semibold text-slate-600 truncate">Brand Logo Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { markTouched(); setLogoUrl(""); }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove logo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="gen-footer-logo" className="text-xs font-bold">Footer Logo (Transparent PNG / SVG)</Label>
                  <label className="cursor-pointer text-[11px] font-bold text-[#533afd] hover:underline inline-flex items-center gap-1">
                    {uploadingSlot === "footerLogo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <span>Upload to Supabase</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={Boolean(uploadingSlot)}
                      onChange={(e) => handleDirectUpload("footerLogo", e.target.files?.[0])}
                    />
                  </label>
                </div>
                <Input
                  id="gen-footer-logo"
                  value={footerLogoUrl}
                  onChange={(e) => { markTouched(); setFooterLogoUrl(e.target.value); }}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="Paste URL or click 'Upload to Supabase' above"
                />
                {footerLogoUrl && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-white shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={footerLogoUrl}
                        alt="Footer logo preview"
                        className="h-9 max-w-[120px] object-contain p-1"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <span className="text-[10px] font-semibold text-slate-300 truncate">Transparent Footer Logo Active</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { markTouched(); setFooterLogoUrl(""); }}
                      className="text-slate-400 hover:text-rose-400 p-1"
                      title="Remove footer logo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gen-services" className="text-xs font-bold">Core Services / Products (1 per line)</Label>
                  <Textarea
                    id="gen-services"
                    rows={6}
                    value={servicesText}
                    onChange={(e) => { markTouched(); setServicesText(e.target.value); }}
                    className="mt-1 text-xs bg-[#f9f9ff] font-sans"
                    placeholder="One real service per line (e.g. Water extraction, Mold remediation...)"
                  />
                </div>

                <div>
                  <Label htmlFor="gen-areas" className="text-xs font-bold">Service Areas / Locations (1 per line)</Label>
                  <Textarea
                    id="gen-areas"
                    rows={6}
                    value={areasText}
                    onChange={(e) => { markTouched(); setAreasText(e.target.value); }}
                    className="mt-1 text-xs bg-[#f9f9ff] font-sans"
                    placeholder="One location per line (e.g. Las Vegas, NV, Henderson, NV, Summerlin, NV...)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Which model writes the markup and the stylesheet. Both passes use
              the one chosen here, so a build is entirely one model's work and
              the two can be judged against each other on the same lead. */}
          <div className="rounded-lg border border-[#c7d0fb] bg-[#fbfaff] p-3.5">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[#533afd]" />
              <Label className="text-xs font-bold text-[#0d1738]">Design model</Label>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Writes both the page markup and its stylesheet. Run the same lead through each to see which sells better —
              regenerating replaces the current homepage.
            </p>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {([
                { id: "openai", name: "OpenAI · GPT-4o & o3", note: "Flagship conversion chain: o3-mini → o1 → GPT-4o." },
                { id: "gemini", name: "Gemini · 3.1 Pro", note: "Chain: Gemini 3.1 Pro → pro-latest → flash-latest." },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={generating}
                  onClick={() => setProvider(option.id)}
                  className={`rounded-lg border p-2.5 text-left transition disabled:opacity-60 ${
                    provider === option.id
                      ? "border-[#533afd] bg-white shadow-sm ring-1 ring-[#533afd]"
                      : "border-border bg-white hover:border-[#c7d0fb]"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0d1738]">{option.name}</span>
                    {provider === option.id && <CheckCircle2 className="h-3.5 w-3.5 text-[#533afd]" />}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">{option.note}</span>
                </button>
              ))}
            </div>
          </div>

          {genError && (
            <p className="rounded-md bg-red-50 p-2.5 text-[11px] font-medium text-red-700">{genError}</p>
          )}

          {genWarnings.length > 0 && (
            <ul className="space-y-1 rounded-md bg-amber-50 p-2.5 text-[11px] text-amber-800">
              {genWarnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          )}

          {generating && progress && (
            <div className="space-y-1.5 rounded-md border border-[#533afd]/20 bg-[#f9f9ff] p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#0d1738]">
                <span>
                  {visualQa?.visual_status === "queued"
                    ? `Waiting for local visual QA — candidate ${visualQa.attempt}`
                    : visualQa?.visual_status === "running"
                      ? `Rendering desktop, tablet and mobile — candidate ${visualQa.attempt}`
                      : visualQa?.visual_status === "failed"
                        ? `Revising after rendered visual QA — candidate ${visualQa.attempt}`
                        : progress.done === 0
                          ? "Designing the homepage — this is the slow, high-effort pass"
                          : `Building pages — ${progress.done} of ${progress.total} complete`}
                </span>
                <span className="text-muted-foreground">
                  {Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#e6e6f5]">
                <div
                  className="h-full rounded-full bg-[#533afd] transition-all duration-500"
                  style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                A candidate is saved only after its source checks and rendered visual review pass.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-[11px] text-muted-foreground">
              Builds the homepage from this brief and the design DNA above. Inner pages are linked but built after approval.
              {briefSaved === "saved" && <span className="ml-2 font-semibold text-emerald-600">Brief saved</span>}
              {briefSaved === "saving" && <span className="ml-2 text-muted-foreground">Saving brief...</span>}
            </span>

            <Button
              type="submit"
              disabled={generating}
              className="gap-2 font-bold bg-[#533afd] text-white hover:bg-[#432bd9] shadow-md px-6 py-2.5"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Building...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 text-[#ffd12d]" />
                  {artifact?.bespoke_homepage_html ? "Rebuild the homepage" : "Generate High-Value Bespoke Website"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* The rest of the site, once the homepage is right. Held back until
            then deliberately: every inner page is written to match the
            homepage, so building them first means rebuilding them all when
            the homepage changes. */}
        {artifact?.bespoke_homepage_html && (
          <div className="rounded-lg border border-[#c7d0fb] bg-[#fbfaff] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#533afd]" />
                  <h4 className="text-sm font-bold text-[#0d1738]">Build the rest of the pages</h4>
                  {(artifact?.generation_phase ?? 0) >= 2 && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Built
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
                  A page for every service and every area they serve, plus about, FAQ and contact — each written to match
                  the homepage above, in the same voice and the same design. This is the slow one: a page per step, several
                  minutes. Run it once the homepage is right, because changing the homepage means running it again.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleBuildRest}
                disabled={generating}
                variant="outline"
                className="gap-2 border-[#533afd] font-bold text-[#533afd] hover:bg-[#f0f3ff]"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4" />
                    {(artifact?.generation_phase ?? 0) >= 2 ? "Rebuild all pages" : "Build all pages"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
