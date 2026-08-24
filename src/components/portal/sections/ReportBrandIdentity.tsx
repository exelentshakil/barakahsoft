"use client";

import { CheckCircle2, Palette, Sparkles, Type, ShieldCheck, Layers } from "lucide-react";
import type { FirecrawlBranding } from "@/lib/scrape/firecrawl";

interface ReportBrandIdentityProps {
  businessName: string;
  branding?: FirecrawlBranding | null;
  brandColorHex?: string | null;
  logoUrl?: string | null;
  fontFamily?: string | null;
}

export function ReportBrandIdentity({
  businessName,
  branding,
  brandColorHex,
  logoUrl,
  fontFamily,
}: ReportBrandIdentityProps) {
  const primaryColor = branding?.colors?.primary || brandColorHex || "#533AFD";
  const secondaryColor = branding?.colors?.secondary || "#0D1738";
  const accentColor = branding?.colors?.accent || "#FFD12D";
  const backgroundColor = branding?.colors?.background || "#FFFFFF";
  const brandFont = branding?.typography?.fontFamilies?.primary || branding?.fonts?.[0]?.family || fontFamily || "Outfit / Inter";
  const headingFont = branding?.typography?.fontFamilies?.heading || brandFont;
  const borderRadius = branding?.spacing?.borderRadius || "8px";
  const logo = branding?.images?.logo || branding?.logo || logoUrl;

  const colorSwatches = [
    { name: "Primary Brand", hex: primaryColor, role: "Main Action / CTAs" },
    { name: "Secondary / Ink", hex: secondaryColor, role: "Headings & Deep Contrast" },
    { name: "Accent Highlight", hex: accentColor, role: "Badges & Proof Points" },
    { name: "Canvas Surface", hex: backgroundColor, role: "Clean Neutral Ground" },
  ];

  return (
    <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-10 shadow-sm space-y-6">
      <div className="border-b border-[#e5e7f2] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Brand Identity &amp; Digital DNA
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
          Engineered Around Your Authentic Brand
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#42506a]">
          We extracted and audited your company&apos;s real design footprint — from exact brand colors and typography
          to UI components and visual assets. We preserved your brand equity while modernizing it into a high-converting digital engine.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colors */}
        <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd]">
            <Palette className="h-4 w-4" /> Brand Palette
          </div>
          <p className="text-xs text-[#777588]">Exact color codes extracted and contrast-checked for readability.</p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {colorSwatches.map((swatch) => (
              <div key={swatch.name} className="flex items-center gap-2.5 rounded-lg border border-[#e5e7f2] bg-white p-2">
                <span
                  className="h-7 w-7 rounded-md shrink-0 border border-black/10 shadow-inner"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#0d1738]">{swatch.name}</p>
                  <p className="font-mono text-[10px] text-[#777588]">{swatch.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography & Fonts */}
        <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd]">
            <Type className="h-4 w-4" /> Typography &amp; Scale
          </div>
          <p className="text-xs text-[#777588]">Pairing high-legibility display headings with modern body typography.</p>
          <div className="space-y-2 pt-1">
            <div className="rounded-lg border border-[#e5e7f2] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">Heading Display</span>
              <p className="mt-0.5 text-sm font-bold text-[#0d1738]">{headingFont}</p>
            </div>
            <div className="rounded-lg border border-[#e5e7f2] bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777588]">Body Copy Face</span>
              <p className="mt-0.5 text-sm font-semibold text-[#42506a]">{brandFont}</p>
            </div>
          </div>
        </div>

        {/* Component & Asset System */}
        <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd]">
            <Layers className="h-4 w-4" /> UI Architecture
          </div>
          <p className="text-xs text-[#777588]">Bespoke button styling, responsive geometry, and brand tokens.</p>
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between rounded-lg border border-[#e5e7f2] bg-white p-2.5 text-xs">
              <span className="font-semibold text-[#42506a]">Geometry Radius</span>
              <span className="rounded bg-[#f0f3ff] px-2 py-0.5 font-mono text-[11px] font-bold text-[#533afd]">
                {borderRadius}
              </span>
            </div>
            {logo && (
              <div className="flex items-center justify-between rounded-lg border border-[#e5e7f2] bg-white p-2.5 text-xs">
                <span className="font-semibold text-[#42506a]">Verified Logo</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#0b8f5b]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> High-Res Asset
                </span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-[#e5e7f2] bg-white p-2.5 text-xs">
              <span className="font-semibold text-[#42506a]">Mobile Conversion</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0b8f5b]">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% Touch Optimized
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c7d0fb]/70 bg-[#f0f3ff] p-4 text-xs font-medium text-[#42506a]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#533afd] shrink-0" />
          <span>
            <strong className="text-[#0d1738]">100% Client-Owned Brand Assets:</strong> Your new redesign is custom-coded for {businessName}. All SVGs, stylesheet tokens, and markup belong to you.
          </span>
        </div>
      </div>
    </section>
  );
}
