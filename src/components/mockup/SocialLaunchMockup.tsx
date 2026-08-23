"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Download,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Check,
  RefreshCw,
  Sliders,
  Type,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type MockupHeadlineMode =
  | "proposed" // "REDESIGN PROPOSED"
  | "concept"  // "WEBSITE CONCEPT READY"
  | "upgrade"  // "HIGH-PERFORMANCE REDESIGN"
  | "launched" // "NEW WEBSITE LAUNCHED"
  | "preview"; // "PRIVATE REDESIGN PREVIEW"

export interface MockupData {
  businessName: string;
  tagline?: string | null;
  city?: string | null;
  trade?: string | null;
  brandColor?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  yearsExperience?: number | string | null;
  founderName?: string | null;
  founderTitle?: string | null;
  aboutHeadline?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  photoUrl?: string | null;
  secondaryPhotoUrl?: string | null;
  siteUrl?: string | null;
  previewUrl?: string | null;
  headlineMode?: MockupHeadlineMode;
}

const HEADLINE_OPTIONS: { id: MockupHeadlineMode; line1: string; line2: string; tag: string }[] = [
  {
    id: "proposed",
    line1: "REDESIGN",
    line2: "PROPOSED",
    tag: "Proposal Stage",
  },
  {
    id: "concept",
    line1: "WEBSITE CONCEPT",
    line2: "READY",
    tag: "Concept Review",
  },
  {
    id: "upgrade",
    line1: "HIGH-CONVERTING",
    line2: "REDESIGN",
    tag: "Authority Pitch",
  },
  {
    id: "preview",
    line1: "PRIVATE DESIGN",
    line2: "PREVIEW",
    tag: "VIP Teaser",
  },
  {
    id: "launched",
    line1: "NEW WEBSITE",
    line2: "LAUNCHED",
    tag: "Official Launch",
  },
];

const BG_THEMES = [
  {
    id: "brand",
    name: "Brand Forest",
    gradient: "from-[#3e5647] via-[#283d31] to-[#17251e]",
    glow: "rgba(62, 86, 71, 0.4)",
    cardBg: "#173628",
  },
  {
    id: "sage",
    name: "Sage Olive",
    gradient: "from-[#576953] via-[#3d4b3b] to-[#252f23]",
    glow: "rgba(87, 105, 83, 0.4)",
    cardBg: "#2f3f2d",
  },
  {
    id: "sky",
    name: "Sky Azure",
    gradient: "from-[#6397c0] via-[#3f6d93] to-[#224461]",
    glow: "rgba(99, 151, 192, 0.4)",
    cardBg: "#2b567d",
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    gradient: "from-[#1b2b48] via-[#101b31] to-[#070c17]",
    glow: "rgba(27, 43, 72, 0.5)",
    cardBg: "#162847",
  },
  {
    id: "charcoal",
    name: "Studio Charcoal",
    gradient: "from-[#343840] via-[#21242a] to-[#131519]",
    glow: "rgba(52, 56, 64, 0.4)",
    cardBg: "#22262e",
  },
];

export function SocialLaunchMockup({
  data,
  showControls = true,
  className = "",
}: {
  data: MockupData;
  showControls?: boolean;
  className?: string;
}) {
  const [themeId, setThemeId] = useState("brand");
  const [headlineMode, setHeadlineMode] = useState<MockupHeadlineMode>(data.headlineMode || "proposed");
  const [downloading, setDownloading] = useState<string | null>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const primaryColor = data.brandColor || "#1b4d3e";

  const businessShortName = data.businessName || "Your Business";
  const heroHeading =
    data.heroHeadline ||
    `PREMIER ${data.trade ? data.trade.toUpperCase() : "SERVICES"} IN ${data.city ? data.city.toUpperCase() : "YOUR CITY"}`;
  const aboutHeading =
    data.aboutHeadline ||
    `A PASSION FOR ${data.trade ? data.trade.toUpperCase() : "EXCELLENCE"} AND RENOVATION EXCELLENCE`;
  const founder = data.founderName || "Founder & Team";
  const founderRole = data.founderTitle || "Founder / CEO";
  const ratingText = data.rating ? `${data.rating}★` : "5.0★";
  const reviewsCountText = data.reviewCount ? `${data.reviewCount}+` : "100+";

  const activeHeadline = HEADLINE_OPTIONS.find((h) => h.id === headlineMode) || HEADLINE_OPTIONS[0];

  // Client-side high-resolution canvas export for FB & Instagram / After Effects
  async function downloadImage(format: "feed" | "story" | "transparent") {
    setDownloading(format);
    try {
      const width = 1080;
      const height = format === "story" ? 1920 : 1350; // 4:5 vertical feed vs 9:16 story
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw Background (unless transparent for After Effects)
      if (format !== "transparent") {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        if (themeId === "sky") {
          bgGradient.addColorStop(0, "#73a9d2");
          bgGradient.addColorStop(0.5, "#47789f");
          bgGradient.addColorStop(1, "#264866");
        } else if (themeId === "midnight") {
          bgGradient.addColorStop(0, "#1d2e50");
          bgGradient.addColorStop(0.5, "#101b33");
          bgGradient.addColorStop(1, "#070c17");
        } else if (themeId === "charcoal") {
          bgGradient.addColorStop(0, "#323740");
          bgGradient.addColorStop(0.5, "#202329");
          bgGradient.addColorStop(1, "#121417");
        } else if (themeId === "sage") {
          bgGradient.addColorStop(0, "#5a6e57");
          bgGradient.addColorStop(0.4, "#445542");
          bgGradient.addColorStop(1, "#2a3628");
        } else {
          // Brand forest dark luxury (exact match to target 1)
          bgGradient.addColorStop(0, "#486353");
          bgGradient.addColorStop(0.4, "#2d4236");
          bgGradient.addColorStop(1, "#18261e");
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Watermark ghost text behind laptop
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.055)";
        ctx.font = "900 130px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(businessShortName.toUpperCase(), width / 2, height * 0.72);
        ctx.restore();

        // 2. Draw Top Heading (Dynamic)
        const titleY = format === "story" ? 220 : 170;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "900 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        // Soft drop shadow / glow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = "#ffffff";
        ctx.fillText(activeHeadline.line1, width / 2, titleY);
        ctx.fillText(activeHeadline.line2, width / 2, titleY + 74);
        ctx.restore();
      }

      // Convert SVG/DOM of the exact 3D laptop & floating page into high-res Canvas raster
      if (mockupRef.current) {
        const svgData = generateMockupSvg({
          data,
          theme,
          width,
          height,
          format,
          primaryColor,
          businessShortName,
          heroHeading,
          aboutHeading,
          founder,
          founderRole,
          ratingText,
          reviewsCountText,
          headlineLine1: activeHeadline.line1,
          headlineLine2: activeHeadline.line2,
        });

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(true);
          };
          img.onerror = reject;
          img.src = url;
        });
      }

      // Trigger Instant Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const cleanName = businessShortName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.download = `${cleanName}-${headlineMode}-mockup-${format}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("[mockup] download failed", err);
      alert("Could not generate download. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 3D Mockup Container (Responsive 4:5 Poster Aspect Ratio) */}
      <div
        ref={mockupRef}
        className={`relative w-full max-w-[560px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${theme.gradient} select-none border border-white/10 flex flex-col justify-between p-6 sm:p-8`}
        style={{
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255,255,255,0.25)",
        }}
      >
        {/* Background Ghost Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
          <span className="font-black text-6xl sm:text-8xl tracking-widest text-white uppercase transform -rotate-12 translate-y-16">
            {businessShortName}
          </span>
        </div>

        {/* Top Header: DYNAMIC HEADLINE (Proposed / Concept / Upgrade / Launched) */}
        <div className="relative z-10 text-center pt-2 sm:pt-3">
          <h2
            className="text-2xl sm:text-4xl font-black tracking-wider text-white uppercase drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)] font-sans"
            style={{ textShadow: "0 4px 18px rgba(0,0,0,0.4)" }}
          >
            {activeHeadline.line1}
            <br />
            {activeHeadline.line2}
          </h2>
        </div>

        {/* 3D Composition Stage: Realistic MacBook 3D (Left) + Floating Story Sheet (Right) */}
        <div className="relative z-10 w-full flex-1 flex items-center justify-center mt-2 perspective-[1400px]">
          {/* Ground Soft Contact Shadow */}
          <div className="absolute bottom-6 left-6 right-6 h-10 bg-black/45 blur-2xl rounded-full transform scale-x-110 -rotate-3" />

          {/* LAYER 1: Realistic 3D Angled MacBook (Left Side) */}
          <div
            className="relative w-[85%] max-w-[430px] transition-transform duration-500"
            style={{
              transform: "rotateY(-19deg) rotateX(13deg) rotateZ(3.5deg) translateY(10px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Screen Bezel (Matte Aluminum Bezel with Webpage Viewport) */}
            <div className="relative rounded-t-2xl bg-[#1e2024] p-2 sm:p-2.5 pb-3 sm:pb-4 shadow-2xl border border-white/20 ring-1 ring-black/60">
              {/* Screen Glass & Real Hero Display */}
              <div className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/80 flex flex-col">
                {/* Real Website Top Nav Strip */}
                <div
                  className="h-5 sm:h-6 w-full flex items-center justify-between px-2 text-[6px] sm:text-[7.5px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/40 shadow-sm" />
                    <span className="truncate max-w-[100px] font-black">{businessShortName}</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-85 scale-90">
                    <span>Home</span>
                    <span>About</span>
                    <span>Services</span>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 font-bold">Call Now</span>
                  </div>
                </div>

                {/* Real Website Hero Section */}
                <div className="relative flex-1 bg-slate-900 p-2.5 sm:p-3.5 flex flex-col justify-center text-white overflow-hidden">
                  {/* Real Hero Photo Background */}
                  <div
                    className="absolute inset-0 opacity-45 bg-cover bg-center"
                    style={{
                      backgroundImage: data.photoUrl ? `url(${data.photoUrl})` : undefined,
                      backgroundColor: primaryColor,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />

                  {/* Real Hero Copy */}
                  <div className="relative z-10 space-y-1.5 max-w-[85%]">
                    <span className="inline-block rounded bg-emerald-500/30 px-1.5 py-0.5 text-[5px] sm:text-[6.5px] font-extrabold tracking-wider uppercase text-emerald-300 border border-emerald-400/30">
                      Serving {data.city || "NYC & Surrounding Areas"}
                    </span>
                    <h3 className="text-[8px] sm:text-[10px] font-black leading-tight line-clamp-2 uppercase text-white drop-shadow">
                      {heroHeading}
                    </h3>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span
                        className="rounded-md px-2 py-0.5 text-[5.5px] sm:text-[7px] font-bold text-white shadow-md"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Get a Free Quote →
                      </span>
                      <span className="text-[5.5px] sm:text-[6.5px] text-amber-400 font-bold">
                        ★★★★★ {ratingText} (5/5)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Aluminum Bottom Deck / Keyboard Base */}
            <div
              className="relative h-3.5 sm:h-4.5 w-[106%] -left-[3%] rounded-b-2xl bg-gradient-to-b from-[#e1e4ea] to-[#a8adb6] shadow-2xl border-t border-white/80 flex items-center justify-center"
              style={{
                transform: "rotateX(56deg) translateZ(-4px)",
                boxShadow: "0 18px 36px rgba(0,0,0,0.65), 0 2px 4px rgba(255,255,255,0.4) inset",
              }}
            >
              {/* Center Display Open Notch */}
              <div className="h-1 w-12 sm:w-16 bg-[#868c96] rounded-full mx-auto" />
            </div>
          </div>

          {/* LAYER 2: Floating Feature Sheet / Mobile Story Card (Right Foreground) */}
          <div
            className="absolute -right-2 sm:-right-4 top-1 sm:top-3 w-[66%] max-w-[290px] rounded-2xl bg-white shadow-2xl border border-white/90 overflow-hidden transition-transform duration-500"
            style={{
              transform: "rotateY(-13deg) rotateX(7deg) rotateZ(-2.5deg) translateZ(45px)",
              boxShadow: "0 25px 50px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            {/* Sheet Top Banner with Founder/Team Photo & Story */}
            <div className="p-3.5 sm:p-4 text-white shadow-inner" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-start gap-2.5">
                {/* Real Team / Founder Photo */}
                <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 border-2 border-white/40 shadow-lg">
                  {data.secondaryPhotoUrl || data.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.secondaryPhotoUrl || data.photoUrl || ""}
                      alt={founder}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black/30 text-white font-black text-sm">
                      {founder.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/70">
                    Our Story
                  </span>
                  <h4 className="text-[7.5px] sm:text-[9.5px] font-black leading-snug line-clamp-2 uppercase">
                    {aboutHeading}
                  </h4>
                  <p className="text-[6px] sm:text-[7.5px] text-white/90 line-clamp-1 font-bold">
                    {founder} · <span className="opacity-80 font-normal">{founderRole}</span>
                  </p>
                </div>
              </div>

              {/* Verified Trust Metrics Strip (4 Columns) */}
              <div className="mt-3 pt-2.5 border-t border-white/20 grid grid-cols-4 gap-1 text-center">
                <div>
                  <span className="block text-[8.5px] sm:text-[11px] font-black">{data.yearsExperience || "10+"}</span>
                  <span className="block text-[5px] sm:text-[6.5px] text-white/75 uppercase font-semibold">Experience</span>
                </div>
                <div>
                  <span className="block text-[8.5px] sm:text-[11px] font-black">{ratingText}</span>
                  <span className="block text-[5px] sm:text-[6.5px] text-white/75 uppercase font-semibold">Reviews</span>
                </div>
                <div>
                  <span className="block text-[8.5px] sm:text-[11px] font-black">1-Year</span>
                  <span className="block text-[5px] sm:text-[6.5px] text-white/75 uppercase font-semibold">Warranty</span>
                </div>
                <div>
                  <span className="block text-[8.5px] sm:text-[11px] font-black">100%</span>
                  <span className="block text-[5px] sm:text-[6.5px] text-white/75 uppercase font-semibold">Focus</span>
                </div>
              </div>
            </div>

            {/* Sheet Lower Area: Service Guarantee & CTA */}
            <div className="p-3 bg-[#fbfbfd] space-y-1.5">
              <span className="text-[5.5px] sm:text-[6.5px] font-black uppercase tracking-wider text-muted-foreground">
                Craftsmanship You Can Trust
              </span>
              <p className="text-[7.5px] sm:text-[9px] font-black text-[#0d1738] leading-tight">
                Expert {data.trade || "Local"} Services &amp; Dedicated Support
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[6px] sm:text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Verified Live
                </span>
                <span
                  className="rounded px-2.5 py-0.5 text-[6px] sm:text-[7.5px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Get Quote →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Brand Credit */}
        <div className="relative z-10 text-center pb-1">
          <p className="text-[9px] sm:text-[11px] font-bold tracking-widest text-white/60 uppercase">
            DESIGNED &amp; DELIVERED BY BARAKAHSOFT
          </p>
        </div>
      </div>

      {/* Admin / Export Controls */}
      {showControls && (
        <div className="w-full max-w-[560px] space-y-4 bg-white p-5 rounded-2xl border border-border shadow-sm">
          {/* 1. Headline Wording Switcher (Proposed vs Concept vs Launched) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-[#533afd]" /> Poster Headline Style
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Switch wording for ongoing content
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {HEADLINE_OPTIONS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHeadlineMode(h.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-left border transition text-xs ${
                    headlineMode === h.id
                      ? "border-[#533afd] bg-[#f0f3ff] text-[#533afd] font-bold shadow-sm"
                      : "border-border bg-white text-[#42506a] hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold truncate">{h.line1}</span>
                  <span className="text-[10px] text-muted-foreground block">{h.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Theme Color Selector */}
          <div className="flex items-center justify-between pt-1 border-t border-border/70">
            <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#533afd]" /> Poster Background Theme
            </span>
            <div className="flex items-center gap-1.5">
              {BG_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  title={t.name}
                  className={`h-5 w-5 rounded-full bg-gradient-to-br ${t.gradient} transition ring-offset-1 ${
                    themeId === t.id ? "ring-2 ring-[#533afd] scale-110" : "hover:scale-105 opacity-80"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3. Download Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/70">
            <Button
              type="button"
              size="sm"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage("feed")}
              className="gap-1.5 bg-[#533afd] text-white hover:bg-[#432bd9] text-xs font-bold"
            >
              {downloading === "feed" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {downloading === "feed" ? "Generating..." : "FB & Insta (4:5)"}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage("story")}
              className="gap-1.5 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff] hover:text-[#533afd]"
            >
              {downloading === "story" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {downloading === "story" ? "Generating..." : "Story / Reel (9:16)"}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage("transparent")}
              title="Transparent 3D Mockup layer for Adobe After Effects or Photoshop"
              className="gap-1.5 text-xs font-bold text-[#0d1738] hover:bg-[#f0f3ff] hover:text-[#533afd]"
            >
              {downloading === "transparent" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
              {downloading === "transparent" ? "Exporting..." : "After Effects (PNG)"}
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            💡 <strong>1-Click High-Res PNG Export</strong> — ready to post directly on social media or import into After Effects for motion graphics.
          </p>
        </div>
      )}
    </div>
  );
}

// Generate self-contained SVG for high-resolution 1080px Canvas rasterization
function generateMockupSvg({
  data,
  width,
  height,
  format,
  primaryColor,
  businessShortName,
  heroHeading,
  aboutHeading,
  founder,
  ratingText,
  reviewsCountText,
  headlineLine1,
  headlineLine2,
}: {
  data: MockupData;
  theme: (typeof BG_THEMES)[0];
  width: number;
  height: number;
  format: "feed" | "story" | "transparent";
  primaryColor: string;
  businessShortName: string;
  heroHeading: string;
  aboutHeading: string;
  founder: string;
  founderRole: string;
  ratingText: string;
  reviewsCountText: string;
  headlineLine1: string;
  headlineLine2: string;
}) {
  const isStory = format === "story";
  const contentYOffset = isStory ? 300 : 160;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="28" stdDeviation="38" flood-color="rgba(0,0,0,0.6)" />
      </filter>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="rgba(0,0,0,0.5)" />
      </filter>
      <linearGradient id="laptopGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2e35"/>
        <stop offset="100%" stop-color="#121418"/>
      </linearGradient>
      <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e2e5eb"/>
        <stop offset="100%" stop-color="#9ca1ab"/>
      </linearGradient>
    </defs>

    <g transform="translate(0, ${contentYOffset})">
      <!-- 1. REALISTIC 3D MACBOOK MOCKUP -->
      <g transform="translate(130, 230) rotate(3) skewY(-8) scale(0.96)" filter="url(#shadow)">
        <!-- Screen Outer Bezel -->
        <rect x="0" y="0" width="590" height="390" rx="20" fill="url(#laptopGrad)" stroke="rgba(255,255,255,0.22)" stroke-width="2.5"/>
        
        <!-- Screen Display Content -->
        <rect x="18" y="18" width="554" height="354" rx="10" fill="#0d1728"/>
        
        <!-- Website Header Strip -->
        <rect x="18" y="18" width="554" height="40" fill="${primaryColor}"/>
        <circle cx="34" cy="38" r="6" fill="rgba(255,255,255,0.4)" />
        <text x="48" y="43" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="15">${escapeXml(
          businessShortName
        )}</text>
        <text x="550" y="43" text-anchor="end" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="11">Home  ·  About  ·  Services  ·  Call Now</text>

        <!-- Screen Hero Content -->
        <rect x="18" y="58" width="554" height="314" fill="#0f172a"/>
        <text x="44" y="112" fill="#6ee7b7" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="12" letter-spacing="1.2">SERVING ${escapeXml(
          (data.city || "LOCAL AREA").toUpperCase()
        )}</text>
        <text x="44" y="148" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="23">${escapeXml(
          heroHeading.slice(0, 35)
        )}</text>
        <text x="44" y="180" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="23">${escapeXml(
          heroHeading.slice(35, 70) || "EXPERT SERVICES & GUARANTEE"
        )}</text>
        
        <!-- CTA Button on screen -->
        <rect x="44" y="218" width="160" height="38" rx="8" fill="${primaryColor}"/>
        <text x="124" y="242" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="13">Get A Free Quote →</text>
        <text x="225" y="242" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="14">★★★★★ ${ratingText}</text>

        <!-- Laptop Lower Aluminum Base -->
        <path d="M -25,390 L 615,390 L 575,432 L 15,432 Z" fill="url(#baseGrad)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
        <rect x="255" y="390" width="85" height="7" rx="3.5" fill="#6b7280"/>
      </g>

      <!-- 2. FLOATING FEATURE SHEET (Right Foreground) -->
      <g transform="translate(415, 140) rotate(-4) skewY(5.5) scale(0.99)" filter="url(#cardShadow)">
        <!-- Sheet Container Card -->
        <rect x="0" y="0" width="530" height="470" rx="26" fill="#ffffff" stroke="rgba(255,255,255,0.95)" stroke-width="2.5"/>
        
        <!-- Sheet Top Brand Banner -->
        <rect x="0" y="0" width="530" height="290" rx="26" fill="${primaryColor}"/>
        <rect x="0" y="260" width="530" height="30" fill="${primaryColor}"/>

        <!-- Photo Frame inside Sheet -->
        <rect x="32" y="36" width="136" height="136" rx="16" fill="#1e293b" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
        <text x="100" y="112" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="32">${escapeXml(
          founder.slice(0, 2).toUpperCase()
        )}</text>

        <!-- Story Heading in Sheet -->
        <text x="190" y="62" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="12" letter-spacing="1.5">OUR STORY</text>
        <text x="190" y="94" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19">${escapeXml(
          aboutHeading.slice(0, 25)
        )}</text>
        <text x="190" y="122" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19">${escapeXml(
          aboutHeading.slice(25, 52) || "CUSTOMER EXCELLENCE"
        )}</text>
        <text x="190" y="156" fill="#ffffff" opacity="0.95" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="14">${escapeXml(
          founder
        )}</text>

        <!-- Metrics Strip in Sheet -->
        <line x1="32" y1="198" x2="498" y2="198" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        
        <text x="85" y="235" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="26">${escapeXml(
          String(data.yearsExperience || "10+")
        )}</text>
        <text x="85" y="258" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">EXPERIENCE</text>

        <text x="205" y="235" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="26">${escapeXml(
          ratingText
        )}</text>
        <text x="205" y="258" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">REVIEWS</text>

        <text x="325" y="235" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="26">1-YEAR</text>
        <text x="325" y="258" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">WARRANTY</text>

        <text x="445" y="235" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="26">100%</text>
        <text x="445" y="258" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">FOCUS</text>

        <!-- Lower Section Content -->
        <text x="32" y="335" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12" letter-spacing="1">CRAFTSMANSHIP YOU CAN TRUST</text>
        <text x="32" y="370" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="20">EXPERT ${escapeXml(
          (data.trade || "LOCAL").toUpperCase()
        )} SERVICES</text>
        <text x="32" y="398" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="20">&amp; DEDICATED SUPPORT</text>

        <!-- Badges at bottom of sheet -->
        <rect x="32" y="420" width="135" height="30" rx="7" fill="#ecfdf5"/>
        <text x="99" y="440" text-anchor="middle" fill="#047857" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12.5">✓ Verified Live</text>

        <rect x="375" y="420" width="125" height="30" rx="7" fill="${primaryColor}"/>
        <text x="437" y="440" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12.5">Get Quote →</text>
      </g>
    </g>
  </svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
