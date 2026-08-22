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
  const fallbackServices = uniqueServices.length > 0 ? uniqueServices.slice(0, 6).join("\n") : "Core Service 1\nCore Service 2\nCore Service 3\nCore Service 4\nCore Service 5\nCore Service 6";

  // Auto-populated fields strictly from THAT specific lead's scraped facts
  const defaultBusinessName = schema.name || (typeof facts.business_name === "string" ? facts.business_name : null) || lead.business_name || "";
  const defaultFounder = schema.founder?.name || lead.contact_name || "";
  const defaultLogo = schema.logo || (typeof facts.logo_url === "string" ? facts.logo_url : "") || "";
  const defaultHero = primaryScrapedPhoto || "";
  const defaultCity = schema.address?.addressLocality ? `${schema.address.addressLocality}, ${schema.address.addressRegion || ""}`.trim() : typeof facts.town === "string" ? facts.town : "";
  const defaultIndustry = lead.industry || (typeof facts.industry === "string" ? facts.industry : "Services & Growth");

  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [founder, setFounder] = useState(defaultFounder);
  const [heroImage, setHeroImage] = useState(defaultHero);
  const [logoUrl, setLogoUrl] = useState(defaultLogo);
  const [city, setCity] = useState(defaultCity);
  const [industry, setIndustry] = useState(defaultIndustry);
  const [servicesText, setServicesText] = useState(fallbackServices);
  const [primaryColor, setPrimaryColor] = useState((facts.colors as any)?.primary || "#533AFD");
  const [accentColor, setAccentColor] = useState((facts.colors as any)?.accent || "#FFD12D");
  const [generating, setGenerating] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [rawJson, setRawJson] = useState("");

  const isScraping = lead.status === "scraping" || (!scrapeResults && lead.status === "new");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const services = servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = showJson && rawJson.trim()
        ? JSON.parse(rawJson)
        : {
            businessName: businessName || lead.source_url,
            founder,
            heroImage,
            logoUrl,
            city,
            industry,
            services,
            primaryColor,
            accentColor,
            phone: lead.phone || nap.phone || "",
            email: lead.email || nap.email || "",
          };

      const res = await fetch(`/api/leads/${lead.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Generation failed");
      router.refresh();
      onGenerated?.();
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      alert("Failed to generate website. Check input fields.");
    } finally {
      setGenerating(false);
    }
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

          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="text-xs font-semibold text-[#533afd] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showJson ? "Switch to Form Inputs" : "Direct branding.json Editor"}
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5 text-xs">
          {showJson ? (
            <div>
              <Label className="text-xs font-semibold">Raw branding.json Input</Label>
              <Textarea
                rows={10}
                placeholder='{"businessName": "Company Name", "founder": "Owner Name", "heroImage": "https://...", "services": ["Service 1", "Service 2"]}'
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="gen-business-name" className="text-xs font-bold">Business Name</Label>
                <Input
                  id="gen-business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. HeartCore Growth"
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
                  placeholder="e.g. Jim Sabellico"
                />
              </div>

              <div>
                <Label htmlFor="gen-city" className="text-xs font-bold">City / Target Territory</Label>
                <Input
                  id="gen-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. Farmingdale, NY"
                />
              </div>

              <div>
                <Label htmlFor="gen-industry" className="text-xs font-bold">Exact Industry / Tagline</Label>
                <Input
                  id="gen-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="e.g. AI Integration & Strategic Marketing"
                />
              </div>

              <div>
                <Label htmlFor="gen-hero" className="text-xs font-bold">Hero Photo / Cutout URL</Label>
                <Input
                  id="gen-hero"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="mt-1 h-8 text-xs bg-[#f9f9ff]"
                  placeholder="https://.../owner-headshot.jpeg"
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
                  rows={4}
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  className="mt-1 text-xs bg-[#f9f9ff] font-sans"
                  placeholder="Service 1&#10;Service 2&#10;Service 3"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-[11px] text-muted-foreground">
              Overrides default scrapers and builds a custom high-converting website live in real-time.
            </span>

            <Button
              type="submit"
              disabled={generating}
              className="gap-2 font-bold bg-[#533afd] text-white hover:bg-[#432bd9] shadow-md px-6 py-2.5"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Generating High-Value Website...
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
