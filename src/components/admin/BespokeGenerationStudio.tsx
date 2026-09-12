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
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InspirationPanel } from "@/components/admin/InspirationPanel";
import { resolveLogoUrl, resolveHeroImage } from "@/lib/brand-assets";
import type { Lead, Artifact, ScrapeResults } from "@/types/database";

// The footer field is the one place that must NOT fall back to the header
// logo: this is the box the operator types the transparent version into, and
// pre-filling it with the header logo would save that as the footer mark the
// moment anything else on the form changed.
function operatorFooterLogo(assets: Record<string, unknown>): string | null {
  const stored = assets.footer_logo_url;
  if (typeof stored === "string") return stored;
  const override = (assets.brief_overrides as Record<string, unknown> | undefined)?.footerLogoUrl;
  return typeof override === "string" ? override : null;
}

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

  const classifiedServices = Array.isArray(facts.derived_services) ? (facts.derived_services as string[]) : [];
  const classifiedAreas = Array.isArray(facts.derived_areas) ? (facts.derived_areas as string[]) : [];

  const extracted = (artifact?.extracted_assets as any) || {};

  const defaultBusinessName = extracted.business_name || schema.name || (typeof facts.business_name === "string" ? facts.business_name : null) || lead.business_name || "";
  const defaultFounder = extracted.founder_name || schema.founder?.name || lead.contact_name || "";
  // Through resolveLogoUrl rather than reading a key directly: this field
  // wrote to extracted_assets.logo_url and read back from
  // extracted_assets.branding.logo, so an uploaded logo saved correctly and
  // then vanished on the next render, replaced by the scraped one.
  const defaultLogo = resolveLogoUrl(extracted, facts, schema.logo) ?? "";
  const defaultFooterLogo = operatorFooterLogo(extracted) ?? "";
  const defaultHero = resolveHeroImage(extracted, primaryScrapedPhoto) ?? "";
  const defaultCity = extracted.city || (schema.address?.addressLocality ? `${schema.address.addressLocality}, ${schema.address.addressRegion || ""}`.trim() : typeof facts.town === "string" ? facts.town : "");
  const defaultIndustry = extracted.industry || lead.industry || (typeof facts.industry === "string" ? facts.industry : "");
  const defaultAboutContent = extracted.about_content || (typeof facts.about_content === "string" ? facts.about_content : "") || "";

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
  const [aboutContent, setAboutContent] = useState(defaultAboutContent);
  // Facebook proof is typed in, not scraped: Facebook puts review counts
  // behind a login wall, so the operator reads them off the client's page.
  // Left empty, the hero shows one combined badge carrying both marks rather
  // than a real Google rating beside a hollow Facebook one.
  // Read from what the last generate persisted, falling back to `mockup`
  // where older leads still hold it. Before overrides were stored, these
  // fields came back empty after every build and had to be retyped.
  const savedOverrides = (extracted.brief_overrides ?? {}) as Record<string, unknown>;
  const savedMockup = (extracted.mockup ?? {}) as Record<string, unknown>;
  const savedNumber = (key: string) => {
    const value = savedOverrides[key] ?? savedMockup[key];
    return typeof value === "number" && value > 0 ? String(value) : "";
  };

  // The Google Business Profile this lead is pinned to.
  //
  // It resolves automatically during the scrape and is refused now when it
  // cannot be verified, but a wrong or missing match is invisible until it is
  // already on the client's homepage — which is how a Wyoming roofer shipped a
  // Florida company's rating, reviews and town. Shown here so it is checked
  // before generating rather than discovered afterwards.
  const placesRaw = (scrapeResults?.places_raw ?? null) as {
    name?: string; website?: string; formatted_address?: string;
    formatted_phone_number?: string; rating?: number; review_count?: number; user_ratings_total?: number;
  } | null;

  const leadHost = (() => {
    try { return new URL(lead.source_url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
  })();
  const placeHost = (() => {
    try { return placesRaw?.website ? new URL(placesRaw.website).hostname.replace(/^www\./, "").toLowerCase() : null; } catch { return null; }
  })();
  const placeVerified = Boolean(leadHost && placeHost && leadHost === placeHost);

  const [placeIdInput, setPlaceIdInput] = useState(lead.place_id ?? "");
  const [placeBusy, setPlaceBusy] = useState(false);
  const [placeMsg, setPlaceMsg] = useState<string | null>(null);

  async function applyPlaceId() {
    // A Maps URL is what an operator actually has to hand, so take the id out
    // of it rather than making them find it.
    const raw = placeIdInput.trim();
    const fromUrl = raw.match(/placeid=([A-Za-z0-9_-]+)/) || raw.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    const placeId = fromUrl ? fromUrl[1] : raw;
    if (!placeId) return;

    setPlaceBusy(true);
    setPlaceMsg(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_id: placeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load that profile");
      setPlaceMsg(`Now pinned to ${data.place.name} — ${data.place.rating} from ${data.place.reviewCount}, ${data.place.reviewsPulled} reviews pulled. Reload to see it.`);
    } catch (err) {
      setPlaceMsg(err instanceof Error ? err.message : "Could not load that profile");
    } finally {
      setPlaceBusy(false);
    }
  }

  const [facebookRating, setFacebookRating] = useState(savedNumber("facebookRating"));
  const [facebookReviewCount, setFacebookReviewCount] = useState(savedNumber("facebookReviewCount"));
  const [servicesText, setServicesText] = useState(defaultServices);
  const [areasText, setAreasText] = useState(defaultAreas);
  const [primaryColor, setPrimaryColor] = useState(extracted.branding?.colors?.primary || (facts.colors as any)?.primary || "#533AFD");

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
    setAboutContent(defaultAboutContent);
    setServicesText(defaultServices);
    setAreasText(defaultAreas);
    setFounder(defaultFounder);
    setHeroImage(defaultHero);
    setLogoUrl(defaultLogo);
    setFooterLogoUrl(defaultFooterLogo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSignature]);

    const [model, setModel] = useState("");
      
  const [generating, setGenerating] = useState(false);
  // Whether the SERVER thinks a build is in flight. Local `generating` is lost
  // on any refresh, so the button came back enabled while Inngest was still
  // mid-build and a second click queued a second run over the first.
  const [jobError, setJobError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [genWarnings, setGenWarnings] = useState<string[]>([]);
  const [visualQa, setVisualQa] = useState<{
    visual_status?: "queued" | "running" | "passed" | "failed";
    attempt?: number;
  } | null>(null);

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  async function handleDirectUpload(slot: "hero" | "logo" | "footerLogo", file?: File) {
    if (!file) return;
    setUploadingSlot(slot);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lead_id", lead.id);
      formData.append("slot", slot);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (slot === "hero") setHeroImage(data.url);
      else if (slot === "logo") setLogoUrl(data.url);
      else if (slot === "footerLogo") setFooterLogoUrl(data.url);

      markTouched();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingSlot(null);
    }
  }

  
  // Whether a build is in flight.
  //
  // There is no job table to poll any more. The generate route does the work
  // inline and answers with the finished page, so the request itself is the
  // progress indicator: in flight until it returns, and then either a page or
  // an error. A build takes 60-180 seconds.
  const submitting = useRef(false);

  const notAnalysed = !scrapeResults;
  const isScraping = lead.status === "scraping";

  const busy = generating;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    // Checked against a ref as well as state. Two clicks inside one render
    // pass both see the old `busy`, and the cost of letting the second one
    // through is an entire duplicate build.
    if (busy || submitting.current) return;
    submitting.current = true;
    setGenerating(true);
    setGenError(null);
    setGenWarnings([]);

    try {
      const res = await fetch(`/api/leads/${lead.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          founder,
          city,
          industry,
          aboutContent: aboutContent.trim() || undefined,
          services: servicesText.split("\n").map((x: string) => x.trim()).filter(Boolean),
          areas: areasText.split("\n").map((x: string) => x.trim()).filter(Boolean),
          heroImage: heroImage.trim() || undefined,
          facebookRating: Number(facebookRating) > 0 ? Number(facebookRating) : null,
          facebookReviewCount: Number(facebookReviewCount) > 0 ? Number(facebookReviewCount) : null,
          logoUrl: logoUrl.trim() || undefined,
          footerLogoUrl: footerLogoUrl.trim() || undefined,
                  }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenWarnings(data.warnings ?? []);
        throw new Error(data.error || "Generation could not start");
      }

      setGenWarnings(data.warnings ?? []);
      // The page exists the moment this resolves, so the surrounding screen is
      // reloaded rather than left showing the previous build.
      router.refresh();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      submitting.current = false;
      setGenerating(false);
    }
  }

  const briefRef = useRef({ businessName, founder, city, industry, aboutContent, servicesText, areasText, heroImage, logoUrl, footerLogoUrl });
  briefRef.current = { businessName, founder, city, industry, aboutContent, servicesText, areasText, heroImage, logoUrl, footerLogoUrl };

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
          aboutContent: b.aboutContent.trim() || undefined,
          services: b.servicesText.split("\n").map((x: string) => x.trim()).filter(Boolean),
          areas: b.areasText.split("\n").map((x: string) => x.trim()).filter(Boolean),
        }),
      });
      setBriefSaved("saved");
    } catch {
      setBriefSaved("idle");
    }
  }, [lead.id]);

  useEffect(() => {
    if (briefSaved === "saving") return;
    // Nothing is written until the operator actually changes something.
    //
    // This effect also runs on mount, so simply OPENING a lead wrote the
    // scraped defaults into extracted_assets as though an operator had typed
    // them — which is why logo_url held the scraped logo on leads nobody had
    // edited, and why an empty stored value could not be told apart from a
    // field deliberately cleared. `touched` already existed for exactly this
    // and the autosave was the one place not consulting it.
    if (!touched.current) return;
    const timer = setTimeout(saveBrief, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, founder, city, industry, aboutContent, servicesText, areasText, heroImage, logoUrl, footerLogoUrl]);

  const STALE_AFTER_MS = 15 * 60 * 1000;

  const isStalled = (job: { status?: string; updated_at?: string } | null | undefined) =>
    job?.status === "running" &&
    !!job.updated_at &&
    Date.now() - new Date(job.updated_at).getTime() > STALE_AFTER_MS;

  const STALLED_MESSAGE =
    "The last build stopped without finishing — most likely the model returned nothing. Press Generate to start it again.";

  
  
  if (isScraping) {
    return (
      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100/80 text-[#533afd] mx-auto shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">
            Reading {lead.source_url}...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Mapping sitemap pages, extracting brand colours, photography, reviews and schema. This studio fills in automatically as each fact lands.
          </p>
        </div>
      </div>
    );
  }

  if (notAnalysed) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 mx-auto">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">This lead has not been analysed yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Press <b>Read site (2 pages)</b> above to ingest their facts, extract brand assets, and prepare the custom redesign brief.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6">
        {/* Studio Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-[#533afd] font-black text-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                Build Their Website Brief
              </h3>
              <p className="text-xs text-slate-500">
                Extracted from their live website. Edit anything to customize before generating the high-converting homepage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {briefSaved === "saved" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="h-3 w-3" strokeWidth={3} /> Brief Autosaved
              </span>
            )}
            {briefSaved === "saving" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
          </div>
        </div>

        {/* Design Direction & Reference Look */}
        <InspirationPanel
          leadId={lead.id}
          initialUrl={artifact?.inspiration_url ?? null}
          initialBranding={(artifact?.inspiration_branding as never) ?? null}
          industry={industry}
        />

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="space-y-6 text-xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="gen-business-name" className="text-xs font-bold text-slate-800">
                Business Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="gen-business-name"
                value={businessName}
                onChange={(e) => { markTouched(); setBusinessName(e.target.value); }}
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                placeholder="e.g. Pinnacle Restoration"
                required
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs font-bold text-slate-800">Google Business Profile</Label>
                {placesRaw ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      placeVerified
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-900 border border-amber-300"
                    }`}
                  >
                    {placeVerified ? "Domain verified" : "Unverified match"}
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    No profile matched
                  </span>
                )}
              </div>

              {placesRaw ? (
                <div className="mt-2.5 space-y-1 text-xs">
                  <p className="font-bold text-slate-900">{placesRaw.name}</p>
                  <p className="text-slate-600">{placesRaw.formatted_address}</p>
                  <p className={placeVerified ? "text-slate-600" : "font-bold text-amber-800"}>
                    {placesRaw.website || "no website on the listing"}
                    {!placeVerified && leadHost ? ` — this lead is ${leadHost}` : ""}
                  </p>
                  <p className="font-bold text-slate-900">
                    {placesRaw.rating ?? "—"} from {placesRaw.review_count ?? placesRaw.user_ratings_total ?? "—"} reviews
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  No verified listing, so this build carries no rating, reviews or review link. Paste the right one below.
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  value={placeIdInput}
                  onChange={(e) => setPlaceIdInput(e.target.value)}
                  placeholder="Paste a place id or a Google reviews URL"
                  className="h-9 flex-1 min-w-[240px] border-slate-300 text-xs"
                />
                <Button
                  type="button"
                  onClick={applyPlaceId}
                  disabled={placeBusy || !placeIdInput.trim()}
                  className="h-9 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-700"
                >
                  {placeBusy ? "Pulling…" : "Pin this profile"}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Pulls the rating, review count, latest reviews, hours and town from that listing and repoints the
                &ldquo;read all reviews&rdquo; link. Find it by searching the business on Google Maps and copying
                the URL.
              </p>
              {placeMsg && <p className="mt-2 text-xs font-bold text-slate-800">{placeMsg}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-slate-800">Facebook reviews (optional)</Label>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Facebook hides review counts from scrapers — read them off the client&apos;s page and type them here.
                Leave blank and the hero shows one badge with both marks and the Google rating.
              </p>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="gen-fb-rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={facebookRating}
                  onChange={(e) => { markTouched(); setFacebookRating(e.target.value); }}
                  className="h-9 w-24 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                  placeholder="4.9"
                  aria-label="Facebook rating out of five"
                />
                <Input
                  id="gen-fb-count"
                  type="number"
                  min="0"
                  value={facebookReviewCount}
                  onChange={(e) => { markTouched(); setFacebookReviewCount(e.target.value); }}
                  className="h-9 w-32 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                  placeholder="reviews"
                  aria-label="Number of Facebook reviews"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gen-founder" className="text-xs font-bold text-slate-800">
                Founder / Owner Name
              </Label>
              <Input
                id="gen-founder"
                value={founder}
                onChange={(e) => { markTouched(); setFounder(e.target.value); }}
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                placeholder="e.g. Shakil Ahmed"
              />
            </div>

            <div>
              <Label htmlFor="gen-city" className="text-xs font-bold text-slate-800">
                City / Target Territory
              </Label>
              <Input
                id="gen-city"
                value={city}
                onChange={(e) => { markTouched(); setCity(e.target.value); }}
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                placeholder="e.g. Las Vegas, NV"
              />
            </div>

            <div>
              <Label htmlFor="gen-industry" className="text-xs font-bold text-slate-800">
                Exact Industry / Tagline
              </Label>
              <Input
                id="gen-industry"
                value={industry}
                onChange={(e) => { markTouched(); setIndustry(e.target.value); }}
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                placeholder="e.g. Property Damage Restoration Contractor"
              />
            </div>

            {/* Hero Cutout */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gen-hero" className="text-xs font-bold text-slate-800">
                  Hero Photo / Cutout
                </Label>
                <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                  {uploadingSlot === "hero" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  <span>Upload</span>
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
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl font-mono text-[11px]"
                placeholder="https://.../hero.png"
              />
              {heroImage && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImage}
                      alt="Hero preview"
                      className="h-9 w-14 rounded-lg object-cover border border-black/10 bg-white"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate">Hero Photo Active</span>
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

            {/* Brand Logo */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gen-logo" className="text-xs font-bold text-slate-800">
                  Brand Logo
                </Label>
                <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                  {uploadingSlot === "logo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  <span>Upload</span>
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
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl font-mono text-[11px]"
                placeholder="https://.../logo.png"
              />
              {logoUrl && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Brand logo preview"
                      className="h-8 max-w-[100px] rounded object-contain border border-black/10 bg-white p-1"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate">Logo Active</span>
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

            {/* Footer Logo */}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gen-footer-logo" className="text-xs font-bold text-slate-800">
                  Footer Logo (Transparent PNG / SVG)
                </Label>
                <label className="cursor-pointer text-[11px] font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                  {uploadingSlot === "footerLogo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  <span>Upload</span>
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
                className="mt-1.5 h-9 text-xs bg-slate-50/70 border-slate-200 rounded-xl font-mono text-[11px]"
                placeholder="Optional transparent footer logo URL"
              />
            </div>

            {/* Services, Areas & About Content */}
            <div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="gen-services" className="text-xs font-bold text-slate-800">
                    Core Services / Products
                  </Label>
                  <span className="text-[10px] text-slate-400 font-semibold">1 per line</span>
                </div>
                <Textarea
                  id="gen-services"
                  rows={6}
                  value={servicesText}
                  onChange={(e) => { markTouched(); setServicesText(e.target.value); }}
                  className="text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white font-sans leading-relaxed"
                  placeholder="Water extraction&#10;Structural drying&#10;Mold remediation..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="gen-areas" className="text-xs font-bold text-slate-800">
                    Service Areas / Locations
                  </Label>
                  <span className="text-[10px] text-slate-400 font-semibold">1 per line</span>
                </div>
                <Textarea
                  id="gen-areas"
                  rows={6}
                  value={areasText}
                  onChange={(e) => { markTouched(); setAreasText(e.target.value); }}
                  className="text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white font-sans leading-relaxed"
                  placeholder="Las Vegas, NV&#10;Henderson, NV&#10;Summerlin, NV..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="gen-about-content" className="text-xs font-bold text-slate-800">
                    About Page Content
                  </Label>
                  <span className="text-[10px] text-slate-400 font-semibold">Existing copy</span>
                </div>
                <Textarea
                  id="gen-about-content"
                  rows={6}
                  value={aboutContent}
                  onChange={(e) => { markTouched(); setAboutContent(e.target.value); }}
                  className="text-xs bg-slate-50/70 border-slate-200 rounded-xl focus:bg-white font-sans leading-relaxed"
                  placeholder="Paste existing about page content here to build a rich, grounded about section..."
                />
              </div>
            </div>
          </div>

          

          {genError && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">{genError}</p>
          )}

          {genWarnings.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              {genWarnings.map((w) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          )}

          {/* In flight.
              There are no steps to report any more — one request writes one
              page — so this says what is true rather than animating a bar
              against a number nothing updates. */}
          {busy && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#533afd]" />
              <div>
                <p className="text-xs font-bold text-slate-900">Designing the homepage</p>
                <p className="text-[11px] text-slate-500">
                  One pass, writing the whole page. Usually 60–180 seconds — keep this tab open.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <span className="text-[11px] text-slate-500">
              {busy
                ? "Writing the page. This tab has to stay open — the request is the build."
                : "Builds the complete homepage from this brief, the curated photos and their brand colour."}
            </span>

            <Button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="gap-2 font-bold bg-[#533afd] hover:bg-[#432ec4] text-white shadow-md shadow-indigo-500/20 px-7 py-2.5 rounded-xl text-xs disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Building the homepage...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Rebuild the Homepage
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
}
