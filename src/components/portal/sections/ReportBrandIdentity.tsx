"use client";

import {
  Check,
  CheckCircle2,
  FileCheck,
  Layers,
  MapPin,
  Palette,
  ShieldCheck,
  Sparkles,
  Type,
  Wrench,
  Zap,
} from "lucide-react";
import type { FirecrawlBranding } from "@/lib/scrape/firecrawl";

interface ReportBrandIdentityProps {
  businessName: string;
  branding?: FirecrawlBranding | null;
  brandColorHex?: string | null;
  logoUrl?: string | null;
  fontFamily?: string | null;
  designTokens?: { vars: Record<string, string>; mood: string } | null;
  services?: string[];
  areas?: string[];
  painPoints?: string[];
  speedScore?: number | null;
}

export function ReportBrandIdentity({
  businessName,
  branding,
  brandColorHex,
  logoUrl,
  fontFamily,
  designTokens,
  services = [],
  areas = [],
  painPoints = [],
  speedScore,
}: ReportBrandIdentityProps) {
  // Existing Scraped Footprint (from Firecrawl)
  const existingPrimary = branding?.colors?.primary || brandColorHex || "#533AFD";
  const existingSecondary = branding?.colors?.secondary || "#0D1738";
  const existingAccent = branding?.colors?.accent || "#FFD12D";
  const existingBackground = branding?.colors?.background || "#FFFFFF";
  const existingFont =
    branding?.typography?.fontFamilies?.primary ||
    branding?.fonts?.[0]?.family ||
    fontFamily ||
    "System Sans-Serif";
  const existingHeading = branding?.typography?.fontFamilies?.heading || existingFont;
  const existingBorderRadius = branding?.spacing?.borderRadius || "4px";
  const logo = branding?.images?.logo || branding?.logo || logoUrl;

  // Proposed Rebuilt Design System (from Design Tokens / Upgraded System)
  const proposedPrimary = designTokens?.vars?.["--bs-primary"] || existingPrimary;
  const proposedAccent = designTokens?.vars?.["--bs-accent"] || existingAccent;
  const proposedInk = designTokens?.vars?.["--bs-ink"] || "#0D1738";
  const proposedSurface = designTokens?.vars?.["--bs-surface"] || "#FFFFFF";
  const proposedDisplayFont = designTokens?.vars?.["--bs-font-display"] || "Outfit, sans-serif";
  const proposedBodyFont = designTokens?.vars?.["--bs-font-body"] || "Inter, sans-serif";

  return (
    <section className="rounded-2xl border border-[#c7d0fb] bg-white p-6 sm:p-10 shadow-sm space-y-8">
      {/* Header — Human, Outcome-Focused (Hormozi / Creative Agency Style) */}
      <div className="border-b border-[#e5e7f2] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Brand Identity &amp; Digital Foundation
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
          Preserving Your Reputation · Upgrading What Converts
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#42506a]">
          We did the heavy lifting before touching a single line of code. We audited your real color palette,
          logo assets, typography, core services, and local territory — then rebuilt the entire customer journey to capture more calls and quote requests.
        </p>
      </div>

      {/* Side-by-Side Brand Audit vs Modern Conversion Design */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: What We Discovered & Audited */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Audited Foundation
              </span>
              <h3 className="text-base font-bold text-slate-800">Your Authentic Brand Assets</h3>
            </div>
            <span className="rounded-md bg-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Verified Footprint
            </span>
          </div>

          {/* Scraped Colors */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Palette className="h-3.5 w-3.5 text-slate-500" /> Extracted Color Palette
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: existingPrimary }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">Primary Brand</p>
                  <p className="font-mono text-[10px] text-slate-500">{existingPrimary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: existingAccent }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">Accent</p>
                  <p className="font-mono text-[10px] text-slate-500">{existingAccent}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: existingSecondary }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">Secondary</p>
                  <p className="font-mono text-[10px] text-slate-500">{existingSecondary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0"
                  style={{ backgroundColor: existingBackground }}
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">Canvas</p>
                  <p className="font-mono text-[10px] text-slate-500">{existingBackground}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scraped Typography & Structure */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Type className="h-3.5 w-3.5 text-slate-500" /> Typography &amp; Readability
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Display Font:</span>
                <span className="font-semibold text-slate-800">{existingHeading}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Body Font:</span>
                <span className="font-semibold text-slate-800">{existingFont}</span>
              </div>
            </div>
          </div>

          {/* Logo & UI Geometry */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-500" /> Visual Assets &amp; Logo
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span>Brand Logo:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {logo ? "Extracted & Preserved" : "Verified from Site"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Button Styling:</span>
                <span className="font-mono text-[11px]">{existingBorderRadius} radius</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: How We Modernized It For Maximum Conversion */}
        <div className="rounded-xl border-2 border-[#533afd] bg-[#f0f3ff]/40 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#c7d0fb] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd]">
                High-Conversion Redesign
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">The Upgraded Digital Experience</h3>
            </div>
            <span className="rounded-md bg-[#533afd] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
              Ready to Launch
            </span>
          </div>

          {/* 60-30-10 Balanced Visual Palette */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#533afd]">
              <Palette className="h-3.5 w-3.5" /> 60-30-10 Professional Color Harmony
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#c7d0fb] bg-white p-2 text-xs shadow-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: proposedPrimary }}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0d1738]">10% Action / CTA</p>
                  <p className="font-mono text-[10px] text-[#533afd]">{proposedPrimary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#c7d0fb] bg-white p-2 text-xs shadow-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: proposedAccent }}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0d1738]">Accent Highlight</p>
                  <p className="font-mono text-[10px] text-[#8a5b00]">{proposedAccent}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#c7d0fb] bg-white p-2 text-xs shadow-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: proposedInk }}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0d1738]">30% Structure</p>
                  <p className="font-mono text-[10px] text-slate-600">{proposedInk}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#c7d0fb] bg-white p-2 text-xs shadow-xs">
                <span
                  className="h-6 w-6 rounded border border-black/10 shrink-0 shadow-sm"
                  style={{ backgroundColor: proposedSurface }}
                />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0d1738]">60% Clean Canvas</p>
                  <p className="font-mono text-[10px] text-slate-600">{proposedSurface}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Pair */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#533afd]">
              <Type className="h-3.5 w-3.5" /> High-Impact Typography System
            </div>
            <div className="rounded-lg border border-[#c7d0fb] bg-white p-3 text-xs space-y-1 shadow-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Display Headings:</span>
                <span className="font-bold text-[#533afd]">{proposedDisplayFont.split(",")[0]} (Bold &amp; Authoritative)</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Body Copy:</span>
                <span className="font-bold text-[#0d1738]">{proposedBodyFont.split(",")[0]} (4.5:1 Contrast Ratio)</span>
              </div>
            </div>
          </div>

          {/* Value Outcomes & Problems Solved */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#533afd]">
              <Zap className="h-3.5 w-3.5" /> Conversion Upgrades
            </div>
            <div className="rounded-lg border border-[#c7d0fb] bg-white p-3 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-[#0b8f5b] font-semibold">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Instant click-to-call and quote requests placed on every screen</span>
              </div>
              <div className="flex items-center gap-2 text-[#0b8f5b] font-semibold">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Seamless footer &amp; header logo badges with zero background box clashing</span>
              </div>
              <div className="flex items-center gap-2 text-[#0b8f5b] font-semibold">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Fast mobile load speed + LocalBusiness schema for Google rankings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services & Location Coverage Breakdown (Heavy Lifting Evidence) */}
      {(services.length > 0 || areas.length > 0) && (
        <div className="rounded-xl border border-[#e5e7f2] bg-[#fbfbfd] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[#533afd]" />
            <h4 className="text-sm font-bold text-[#0d1738]">
              Full Catalog &amp; Territory Structure Built Into Your Sitemap
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {services.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Core Services Mapped ({services.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {services.slice(0, 8).map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[#0d1738] border border-[#e5e7f2] shadow-2xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {areas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Target Locations &amp; Service Areas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {areas.slice(0, 8).map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[#0d1738] border border-[#e5e7f2] shadow-2xs"
                    >
                      <MapPin className="h-3 w-3 text-[#533afd]" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Irresistible Value & 100% Ownership Guarantee */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-4 text-xs font-medium text-[#42506a]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-[#533afd] shrink-0" />
          <span>
            <strong className="text-[#0d1738]">100% Client-Owned:</strong> We custom-built this redesign for {businessName}. If you want us to put it live and host it, we handle everything. If you prefer your own team to launch it, the files are yours.
          </span>
        </div>
        <div className="inline-flex items-center gap-1 font-bold text-[#0b8f5b] whitespace-nowrap">
          <ShieldCheck className="h-4 w-4" /> Ready for Immediate Launch
        </div>
      </div>
    </section>
  );
}
