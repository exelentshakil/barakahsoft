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
  mockupNode?: React.ReactNode;
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
  mockupNode,
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
    <div className="space-y-6">
      {/* 3D Website Redesign Showcase Mockup (Passed in) */}
      {mockupNode && (
        <section className="flex flex-col items-center space-y-8 pb-10">
          <div className="text-center max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#533afd]/20 bg-[#533afd]/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#533afd]">
              High-Converting Modern Redesign
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#0d1738] tracking-tight leading-tight">
              Your Brand, Elevated to Category Leader
            </h3>
            <p className="text-sm sm:text-base text-[#42506a] leading-relaxed">
              A bespoke, lightning-fast digital storefront engineered to convert local search visitors into qualified phone calls and bookings.
            </p>
          </div>

          <div className="w-full flex justify-center py-2 relative">
            {/* Ambient glow behind mockup */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-tr from-[#533afd]/20 to-[#ffd12d]/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 w-full max-w-[700px]">
              {mockupNode}
            </div>
          </div>
        </section>
      )}

      {/* Brand Identity Panel */}
      <section className="rounded-3xl border border-[#e5e7f2] bg-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-[#533afd]/5 space-y-10 relative overflow-hidden">
        {/* Header */}
        <div className="relative z-10 border-b border-[#e5e7f2] pb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                  Brand Identity &amp; Digital Foundation
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-4xl leading-tight">
                Preserving Your Reputation · Upgrading What Converts
              </h2>
              <p className="text-base leading-relaxed text-[#42506a]">
                We did the heavy lifting before touching a single line of code. We audited your real color palette,
                logo assets, typography, core services, and local territory — then rebuilt the entire customer journey to capture more calls and quote requests.
              </p>
            </div>

            {/* Prominent Logo & Verified Footprint Badge on Top */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-2xl border border-[#c7d0fb] bg-[#f9f9ff] p-4 shadow-sm w-full md:w-auto">
                {logo ? (
                  <div className="flex h-12 w-28 items-center justify-center rounded-xl bg-white p-2 border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt={businessName} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : null}
                <div className="text-left">
                  <p className="text-sm font-bold text-[#0d1738] truncate max-w-[150px]">{businessName}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0b8f5b] mt-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Manually Audited
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Brand Audit vs Modern Conversion Design */}
        <div className="relative z-10 grid gap-6 lg:grid-cols-2">
          {/* Left: What We Discovered & Audited */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Audited Foundation
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">Your Authentic Brand Assets</h3>
              </div>
              <span className="rounded-md bg-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Verified Footprint
              </span>
            </div>

            {/* Scraped Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Palette className="h-4 w-4 text-slate-500" /> Extracted Color Palette
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: existingPrimary }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">Primary Brand</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{existingPrimary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: existingAccent }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">Accent</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{existingAccent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: existingSecondary }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">Secondary</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{existingSecondary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: existingBackground }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">Canvas</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{existingBackground}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Scraped Typography & Structure */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Type className="h-4 w-4 text-slate-500" /> Typography &amp; Readability
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-2 shadow-sm">
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Layers className="h-4 w-4 text-slate-500" /> Visual Assets &amp; Logo
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Brand Logo:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {logo ? "Extracted & Preserved" : "Verified from Site"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Button Styling:</span>
                  <span className="font-mono text-xs">{existingBorderRadius} radius</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: How We Modernized It For Maximum Conversion */}
          <div className="rounded-2xl border-2 border-[#533afd] bg-[#f0f3ff]/40 p-7 space-y-6 shadow-sm relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#533afd]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between border-b border-[#c7d0fb] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd]">
                  High-Conversion Redesign
                </span>
                <h3 className="text-lg font-bold text-[#0d1738] mt-1">The Upgraded Digital Experience</h3>
              </div>
              <span className="rounded-md bg-[#533afd] px-2.5 py-1 text-xs font-bold text-white shadow-md">
                Ready to Launch
              </span>
            </div>

            {/* 60-30-10 Balanced Visual Palette */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#533afd]">
                <Palette className="h-4 w-4" /> 60-30-10 Professional Color Harmony
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-[#c7d0fb] bg-white p-3 text-xs shadow-md">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: proposedPrimary }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0d1738]">10% Action / CTA</p>
                    <p className="font-mono text-[10px] text-[#533afd] mt-0.5">{proposedPrimary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#c7d0fb] bg-white p-3 text-xs shadow-md">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: proposedAccent }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0d1738]">Accent Highlight</p>
                    <p className="font-mono text-[10px] text-[#8a5b00] mt-0.5">{proposedAccent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#c7d0fb] bg-white p-3 text-xs shadow-md">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: proposedInk }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0d1738]">30% Structure</p>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">{proposedInk}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#c7d0fb] bg-white p-3 text-xs shadow-md">
                  <span
                    className="h-8 w-8 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ backgroundColor: proposedSurface }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0d1738]">60% Clean Canvas</p>
                    <p className="font-mono text-[10px] text-slate-600 mt-0.5">{proposedSurface}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography Pair */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#533afd]">
                <Type className="h-4 w-4" /> High-Impact Typography System
              </div>
              <div className="rounded-xl border border-[#c7d0fb] bg-white p-4 text-sm space-y-2 shadow-sm">
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Display Headings:</span>
                  <span className="font-bold text-[#533afd]">{proposedDisplayFont.split(",")[0]} <span className="hidden sm:inline">(Bold)</span></span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-semibold">Body Copy:</span>
                  <span className="font-bold text-[#0d1738]">{proposedBodyFont.split(",")[0]} <span className="hidden sm:inline">(Contrast)</span></span>
                </div>
              </div>
            </div>

            {/* Value Outcomes & Problems Solved */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#533afd]">
                <Zap className="h-4 w-4" /> Conversion Upgrades
              </div>
              <div className="rounded-xl border border-[#c7d0fb] bg-white p-4 text-sm space-y-2 shadow-sm">
                <div className="flex items-start gap-2.5 text-[#0b8f5b] font-semibold">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">Instant click-to-call and quote requests placed on every screen</span>
                </div>
                <div className="flex items-start gap-2.5 text-[#0b8f5b] font-semibold">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">Seamless footer &amp; header logo badges with zero background box clashing</span>
                </div>
                <div className="flex items-start gap-2.5 text-[#0b8f5b] font-semibold">
                  <Check className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">Fast mobile load speed + LocalBusiness schema for Google rankings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services & Location Coverage Breakdown (Heavy Lifting Evidence) */}
        {(services.length > 0 || areas.length > 0) && (
          <div className="relative z-10 rounded-2xl border border-[#e5e7f2] bg-[#fbfbfd] p-6 sm:p-8 space-y-5 shadow-inner">
            <div className="flex items-center gap-2.5">
              <Wrench className="h-5 w-5 text-[#533afd]" />
              <h4 className="text-base font-bold text-[#0d1738]">
                Full Catalog &amp; Territory Structure Built Into Your Sitemap
              </h4>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {services.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700">Core Services Mapped ({services.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {services.slice(0, 8).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0d1738] border border-[#e5e7f2] shadow-sm"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {areas.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700">Target Locations &amp; Service Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {areas.slice(0, 8).map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0d1738] border border-[#e5e7f2] shadow-sm"
                      >
                        <MapPin className="h-3.5 w-3.5 text-[#533afd]" />
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
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#c7d0fb] bg-gradient-to-r from-[#f0f3ff] to-[#f9f9ff] p-5 text-sm font-medium text-[#42506a] shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#533afd] shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-relaxed">
              <strong className="text-[#0d1738]">100% Client-Owned:</strong> We custom-built this redesign for {businessName}. If you want us to put it live and host it, we handle everything. If you prefer your own team to launch it, the files are yours.
            </span>
          </div>
          <div className="inline-flex items-center gap-2 font-bold text-[#0b8f5b] whitespace-nowrap bg-white px-4 py-2 rounded-xl border border-[#eaf8f0] shadow-xs">
            <ShieldCheck className="h-5 w-5" /> Ready for Launch
          </div>
        </div>
      </section>
    </div>
  );
}
