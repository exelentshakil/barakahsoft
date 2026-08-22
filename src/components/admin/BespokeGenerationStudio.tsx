"use client";

import { useState } from "react";
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
  User,
  Wrench,
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

  // Extract detected services from scraped pages navigation & headings
  const pages = Array.isArray(facts.pages) ? (facts.pages as any[]) : [];
  const extractedNavServices = pages.flatMap((p) => (Array.isArray(p.navLinks) ? p.navLinks.map((n: any) => n.text) : []));
  const uniqueServices = Array.from(new Set(extractedNavServices)).filter((s) => s && s.length < 35 && !["Home", "Blog", "Contact", "About", "Privacy Policy", "Terms"].includes(s));

  // Extract previously saved generated assets from Supabase
  const extracted = (artifact?.extracted_assets as any) || {};

  const defaultBusinessName = extracted.business_name || schema.name || (typeof facts.business_name === "string" ? facts.business_name : null) || lead.business_name || "";
  const defaultFounder = extracted.founder_name || schema.founder?.name || lead.contact_name || "";
  const defaultLogo = extracted.branding?.logo || schema.logo || (typeof facts.logo_url === "string" ? facts.logo_url : "") || "";
  const defaultHero = extracted.hero_cutout || primaryScrapedPhoto || "";
  const defaultCity = extracted.city || (schema.address?.addressLocality ? `${schema.address.addressLocality}, ${schema.address.addressRegion || ""}`.trim() : typeof facts.town === "string" ? facts.town : "");
  const defaultIndustry = extracted.industry || lead.industry || (typeof facts.industry === "string" ? facts.industry : "");

  // No hardcoded fallback list. A previous version defaulted to a fixed
  // electrician service list, which meant a roofer or a salon whose scrape
  // was thin silently received an electrician's services -- one of the two
  // root causes of "bespoke" sites that looked identical.
  const defaultServices = Array.isArray(extracted.services_list) && extracted.services_list.length > 0
    ? extracted.services_list.join("\n")
    : uniqueServices.slice(0, 8).join("\n");

  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [founder, setFounder] = useState(defaultFounder);
  const [heroImage, setHeroImage] = useState(defaultHero);
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [city, setCity] = useState(defaultCity);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [servicesText, setServicesText] = useState(defaultServices);
  const [primaryColor, setPrimaryColor] = useState(extracted.branding?.colors?.primary || (facts.colors as any)?.primary || "#533AFD");
  const [accentColor, setAccentColor] = useState(extracted.branding?.colors?.accent || (facts.colors as any)?.accent || "#FFD12D");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genWarnings, setGenWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const isScraping = lead.status === "scraping" || (!scrapeResults && lead.status === "new");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGenWarnings([]);
    try {
      const services = (servicesText || "")
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
          city,
          industry,
          services,
          // Phone and email are deliberately NOT defaulted to a placeholder.
          // A generated page with someone else's phone number on it is worse
          // than one with no phone number at all.
          phone: lead.phone || nap.phone || undefined,
          email: lead.email || nap.email || undefined,
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

  // Generation is a multi-minute background job (several model calls plus a
  // critique pass), so the button reports real step progress rather than
  // spinning against a request that would have timed out anyway.
  function pollProgress() {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}/generate`);
        const data = await res.json().catch(() => ({}));
        const job = data.job;
        if (!job) return;

        setProgress({ done: job.pages_done ?? 0, total: job.pages_total ?? 1 });

        if (job.status === "complete" || job.status === "failed") {
          clearInterval(timer);
          setGenerating(false);
          if (job.status === "failed") {
            setGenError(job.error_message || "Generation failed — check the Inngest run for details.");
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
  }

  if (isScraping) {
    return (
      <Card className="border border-border bg-[#f0f3ff] shadow-sm">
        <CardContent className="p-8 text-center space-y-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#533afd] mx-auto" />
          <h3 className="font-bold text-base text-[#0d1738]">
            Firecrawl is analyzing {lead.source_url}...
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Extracting genuine brand colors, sitemaps, photos, reviews, and schema. The generation studio will auto-populate as soon as scraping completes.
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
                Bespoke Website Generation & Storytelling Studio
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verify Firecrawl extracted brand facts or customize the brief below, then click Generate to build a tailored high-converting website.
            </p>
          </div>

        </div>

        <InspirationPanel
          leadId={lead.id}
          initialUrl={artifact?.inspiration_url ?? null}
          initialBranding={(artifact?.inspiration_branding as never) ?? null}
        />

        <form onSubmit={handleGenerate} className="space-y-5 text-xs">
          {(
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="gen-business-name" className="text-xs font-bold">Business Name</Label>
                <Input
                  id="gen-business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
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
                  onChange={(e) => setFounder(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. David Karagounis"
                />
              </div>

              <div>
                <Label htmlFor="gen-city" className="text-xs font-bold">City / Target Territory</Label>
                <Input
                  id="gen-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. Flushing, NY"
                />
              </div>

              <div>
                <Label htmlFor="gen-industry" className="text-xs font-bold">Exact Industry / Tagline</Label>
                <Input
                  id="gen-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. Electrical & Solar Contractors"
                />
              </div>

              <div>
                <Label htmlFor="gen-hero" className="text-xs font-bold">Hero Photo / Cutout URL</Label>
                <Input
                  id="gen-hero"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="https://.../owner-headshot.png"
                />
              </div>

              <div>
                <Label htmlFor="gen-logo" className="text-xs font-bold">Brand Logo URL</Label>
                <Input
                  id="gen-logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="https://.../logo.png"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="gen-services" className="text-xs font-bold">Core Services / Products (1 per line)</Label>
                <Textarea
                  id="gen-services"
                  rows={5}
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  className="mt-1 text-xs bg-[#f9f9ff] font-sans"
                  placeholder="One real service per line, taken from the client&apos;s own site"
                />
              </div>
            </div>
          )}

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
                  {progress.done === 0
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
                The homepage is saved first, so you can review and send it while the inner pages finish.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-[11px] text-muted-foreground">
              Builds the homepage plus every service, about, FAQ and contact page from this brief and the design DNA above.
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
                  Generate High-Value Bespoke Website
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
