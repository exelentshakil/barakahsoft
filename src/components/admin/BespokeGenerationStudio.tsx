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

  const classifiedServices = Array.isArray(facts.derived_services) ? (facts.derived_services as string[]) : [];
  const classifiedAreas = Array.isArray(facts.derived_areas) ? (facts.derived_areas as string[]) : [];

  const extracted = (artifact?.extracted_assets as any) || {};

  const defaultBusinessName = extracted.business_name || schema.name || (typeof facts.business_name === "string" ? facts.business_name : null) || lead.business_name || "";
  const defaultFounder = extracted.founder_name || schema.founder?.name || lead.contact_name || "";
  const defaultLogo = extracted.branding?.logo || schema.logo || (typeof facts.logo_url === "string" ? facts.logo_url : "") || "";
  const defaultFooterLogo = extracted.footer_logo_url || "";
  const defaultHero = extracted.hero_cutout || primaryScrapedPhoto || "";
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

  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<{ id: string; provider: "openai" | "gemini"; recommended: boolean; note?: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load models");
      const modelList = Array.isArray(data.models)
        ? data.models
        : [...(Array.isArray(data.openai) ? data.openai : []), ...(Array.isArray(data.gemini) ? data.gemini : [])];
      setModels(modelList);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Could not reach the models endpoint.");
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const notAnalysed = !scrapeResults;
  const isScraping = lead.status === "scraping";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGenWarnings([]);
    setProgress({ done: 0, total: 1 });

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
          logoUrl: logoUrl.trim() || undefined,
          footerLogoUrl: footerLogoUrl.trim() || undefined,
          provider,
          model: model || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGenWarnings(data.warnings ?? []);
        throw new Error(data.error || "Generation could not start");
      }

      setGenWarnings(data.warnings ?? []);
      
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
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

          {/* AI Model Settings Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#533afd]" />
                <Label className="text-xs font-bold text-slate-900">AI Design Model</Label>
              </div>
              <span className="text-[11px] text-slate-500">Writes grounded HTML, typography &amp; CSS</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {([
                { id: "openai", name: "OpenAI", note: "House chain (GPT-4.5 / Pro)" },
                { id: "gemini", name: "Gemini", note: "House chain (Gemini 3.1 Pro)" },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={generating}
                  onClick={() => setProvider(option.id)}
                  className={`rounded-xl border p-3 text-left transition flex items-center justify-between ${
                    provider === option.id
                      ? "border-[#533afd] bg-white shadow-xs ring-1 ring-[#533afd]"
                      : "border-slate-200 bg-white/80 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{option.name}</span>
                    <span className="text-[10px] text-slate-500 block">{option.note}</span>
                  </div>
                  {provider === option.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#533afd] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Model Select Dropdown */}
            <div className="pt-2 border-t border-slate-200/60">
              <select
                id="model-pick"
                value={model}
                disabled={generating}
                onChange={(e) => setModel(e.target.value)}
                onFocus={() => { if (models.length === 0 && !modelsLoading) void loadModels(); }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#533afd] shadow-2xs"
              >
                <option value="">House chain (recommended default)</option>
                {models
                  .filter((m) => m.provider === provider)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.recommended ? "★ " : ""}
                      {m.id}
                      {m.note ? ` — ${m.note}` : ""}
                    </option>
                  ))}
              </select>
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

          {/* Progress Bar */}
          {generating && progress && (
            <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>
                  {visualQa?.visual_status === "queued"
                    ? `Waiting for local visual QA — candidate ${visualQa.attempt}`
                    : visualQa?.visual_status === "running"
                      ? `Rendering desktop, tablet and mobile — candidate ${visualQa.attempt}`
                      : visualQa?.visual_status === "failed"
                        ? `Revising after rendered visual QA — candidate ${visualQa.attempt}`
                        : progress.done === 0
                          ? "Designing the homepage — high-effort batch pass..."
                          : `Building pages — ${progress.done} of ${progress.total} complete`}
                </span>
                <span className="text-indigo-700">
                  {Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
                <div
                  className="h-full rounded-full bg-[#533afd] transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Bottom Action Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <span className="text-[11px] text-slate-500">
              Builds the complete homepage from this brief and the selected design archetype.
            </span>

            <Button
              type="submit"
              disabled={generating}
              className="gap-2 font-bold bg-[#533afd] hover:bg-[#432ec4] text-white shadow-md shadow-indigo-500/20 px-7 py-2.5 rounded-xl text-xs"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Generating Homepage...
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

      {/* Inner Pages Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Build the rest of the pages</h4>
            <p className="text-[11px] text-slate-500">
              A page for every service and area they serve (about, contact, FAQ) matching the approved homepage.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            if (!artifact?.bespoke_homepage_html) {
              alert("Homepage must be generated first before building inner pages.");
              return;
            }
            if (generating) return;
            setGenerating(true);
            setGenError(null);
            
            try {
              const res = await fetch(`/api/leads/${lead.id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phase: 2 }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to start generation");
              
            } catch (err) {
              setGenError(err instanceof Error ? err.message : "Failed to start inner page generation");
              setGenerating(false);
            }
          }}
          className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FolderTree className="h-3.5 w-3.5 mr-1.5" />
              Build All Pages
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
