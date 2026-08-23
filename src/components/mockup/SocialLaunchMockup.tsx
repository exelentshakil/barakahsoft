"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Check,
  RefreshCw,
  Sliders,
  Type,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type MockupHeadlineMode =
  | "proposed" // "REDESIGN PROPOSED"
  | "concept"  // "WEBSITE CONCEPT READY"
  | "upgrade"  // "HIGH-PERFORMANCE REDESIGN"
  | "preview"  // "PRIVATE DESIGN PREVIEW"
  | "launched"; // "NEW WEBSITE LAUNCHED"

export interface MockupData {
  businessName: string;
  tagline?: string | null;
  city?: string | null;
  trade?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
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
  availablePhotos?: string[];
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
    line1: "HIGH-PERFORMANCE",
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
    id: "olive",
    name: "Sage Olive (Ref 1)",
    gradient: "from-[#4a5a47] via-[#334131] to-[#1e271c]",
    ribbonColor: "#1a3320",
  },
  {
    id: "sky",
    name: "Azure Sky (Ref 2)",
    gradient: "from-[#75a6c8] via-[#48779b] to-[#254c6d]",
    ribbonColor: "#284a68",
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    gradient: "from-[#182845] via-[#0f1a2f] to-[#060c18]",
    ribbonColor: "#12223a",
  },
  {
    id: "charcoal",
    name: "Studio Charcoal",
    gradient: "from-[#30353e] via-[#1f2228] to-[#121418]",
    ribbonColor: "#1c2027",
  },
];

export function SocialLaunchMockup({
  data,
  showControls = true,
  className = "",
  onSelectPhoto,
}: {
  data: MockupData;
  showControls?: boolean;
  className?: string;
  onSelectPhoto?: (url: string) => void;
}) {
  const [themeId, setThemeId] = useState("olive");
  const [headlineMode, setHeadlineMode] = useState<MockupHeadlineMode>(data.headlineMode || "proposed");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(data.photoUrl || data.secondaryPhotoUrl || null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const primaryColor = data.brandColor || theme.ribbonColor;

  const businessShortName = data.businessName || "Your Business";
  const city = data.city || "New York";
  const trade = data.trade || "Contractor";
  const heroHeading =
    data.heroHeadline || `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`;
  const aboutHeading =
    data.aboutHeadline || `A PASSION FOR ${trade.toUpperCase()} AND RENOVATION EXCELLENCE`;
  const founder = data.founderName || "Founder & Team";
  const founderRole = data.founderTitle || "Founder / CEO";
  const ratingText = data.rating ? `${data.rating}★` : "5★";
  const reviewsCountText = data.reviewCount ? `${data.reviewCount}+` : "100+";
  const yearsExp = data.yearsExperience ? `${data.yearsExperience}+` : "10+";

  const activeHeadline = HEADLINE_OPTIONS.find((h) => h.id === headlineMode) || HEADLINE_OPTIONS[0];

  const featuredCardPhoto = selectedPhoto || data.photoUrl || data.secondaryPhotoUrl;

  // High-Resolution 1080px Canvas Export (4:5 Feed, 9:16 Story, Transparent PNG)
  async function downloadImage(format: "feed" | "story" | "transparent") {
    setDownloading(format);
    try {
      const width = 1080;
      const height = format === "story" ? 1920 : 1350;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Background
      if (format !== "transparent") {
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        if (themeId === "sky") {
          bgGradient.addColorStop(0, "#75a6c8");
          bgGradient.addColorStop(0.45, "#48779b");
          bgGradient.addColorStop(1, "#254c6d");
        } else if (themeId === "midnight") {
          bgGradient.addColorStop(0, "#182845");
          bgGradient.addColorStop(0.45, "#0f1a2f");
          bgGradient.addColorStop(1, "#060c18");
        } else if (themeId === "charcoal") {
          bgGradient.addColorStop(0, "#30353e");
          bgGradient.addColorStop(0.45, "#1f2228");
          bgGradient.addColorStop(1, "#121418");
        } else {
          // Sage Olive (Exact match to Reference 1)
          bgGradient.addColorStop(0, "#4a5a47");
          bgGradient.addColorStop(0.45, "#334131");
          bgGradient.addColorStop(1, "#1e271c");
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Watermark ghost text behind laptop
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.font = "900 140px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(businessShortName.toUpperCase(), width / 2, height * 0.72);
        ctx.restore();

        // Top Heading (Dynamic with soft glow)
        const titleY = format === "story" ? 210 : 160;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "900 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(activeHeadline.line1, width / 2, titleY);
        ctx.fillText(activeHeadline.line2, width / 2, titleY + 76);
        ctx.restore();
      }

      // Render the complete 3D realistic composition
      const svgData = generateRealisticMockupSvg({
        data,
        theme,
        width,
        height,
        format,
        primaryColor,
        businessShortName,
        city,
        trade,
        heroHeading,
        aboutHeading,
        founder,
        founderRole,
        ratingText,
        reviewsCountText,
        yearsExp,
        featuredPhoto: featuredCardPhoto,
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
      {/* 3D Mockup Stage Container (4:5 Aspect Ratio matching references) */}
      <div
        ref={mockupRef}
        className={`relative w-full max-w-[560px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${theme.gradient} select-none border border-white/15 flex flex-col justify-between p-6 sm:p-8`}
        style={{
          boxShadow: "0 35px 70px -15px rgba(0, 0, 0, 0.65), inset 0 1px 2px rgba(255,255,255,0.3)",
        }}
      >
        {/* Background Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
          <span className="font-black text-7xl sm:text-9xl tracking-widest text-white uppercase transform -rotate-12 translate-y-24">
            {businessShortName}
          </span>
        </div>

        {/* Dynamic Top Header: NEW WEBSITE LAUNCHED / REDESIGN PROPOSED */}
        <div className="relative z-10 text-center pt-2 sm:pt-3">
          <h2
            className="text-2xl sm:text-4xl font-black tracking-wider text-white uppercase drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] font-sans"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
          >
            {activeHeadline.line1}
            <br />
            {activeHeadline.line2}
          </h2>
        </div>

        {/* 3D Realistic Composition Stage */}
        <div className="relative z-10 w-full flex-1 flex items-center justify-center mt-2 perspective-[1400px]">
          {/* Ground Soft Ambient Shadow */}
          <div className="absolute bottom-4 left-6 right-6 h-12 bg-black/50 blur-2xl rounded-full transform scale-x-110 -rotate-2" />

          {/* 1. PHOTOREALISTIC 3D MACBOOK (Angled Left 3/4 Perspective) */}
          <div
            className="relative w-[88%] max-w-[450px] transition-transform duration-500"
            style={{
              transform: "rotateY(-18deg) rotateX(14deg) rotateZ(3deg) translateY(12px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Screen Glass & Aluminum Bezel */}
            <div className="relative rounded-t-2xl bg-[#14161a] p-2 sm:p-2.5 pb-3 sm:pb-4 shadow-2xl border border-white/25 ring-1 ring-black/70">
              {/* Screen Top Camera Notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-10 bg-[#000] rounded-b-md z-20 flex items-center justify-center">
                <span className="h-0.5 w-0.5 rounded-full bg-[#1e293b]" />
              </div>

              {/* Screen Inner Display: Embeds the LIVE Website Viewport */}
              <div className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/80 flex flex-col">
                {data.previewUrl ? (
                  <div className="relative w-full h-full overflow-hidden bg-white">
                    <iframe
                      src={data.previewUrl}
                      title="Live Generated Website Mockup Preview"
                      tabIndex={-1}
                      className="absolute top-0 left-0 border-0 pointer-events-none"
                      style={{
                        width: "1280px",
                        height: "800px",
                        transform: "scale(0.285)",
                        transformOrigin: "top left",
                      }}
                    />
                    {/* Glass Reflection Glare Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
                  </div>
                ) : (
                  /* Fallback High-Fidelity Website Viewport */
                  <div className="relative flex-1 bg-slate-900 p-2.5 sm:p-3.5 flex flex-col justify-between text-white overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-45 bg-cover bg-center"
                      style={{
                        backgroundImage: data.photoUrl ? `url(${data.photoUrl})` : undefined,
                        backgroundColor: primaryColor,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />

                    <div className="relative z-10 space-y-1 max-w-[80%]">
                      <span className="inline-block rounded bg-emerald-500/30 px-1.5 py-0.5 text-[5px] sm:text-[6.5px] font-extrabold tracking-wider uppercase text-emerald-300 border border-emerald-400/30">
                        SERVING {city.toUpperCase()}
                      </span>
                      <h3 className="text-[8px] sm:text-[10px] font-black leading-tight line-clamp-2 uppercase text-white drop-shadow">
                        {heroHeading}
                      </h3>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span
                          className="rounded px-2 py-0.5 text-[5.5px] sm:text-[7px] font-bold text-white shadow"
                          style={{ backgroundColor: primaryColor }}
                        >
                          GET A FREE QUOTE →
                        </span>
                        <span className="text-[5.5px] sm:text-[6.5px] text-amber-400 font-bold">
                          ★★★★★ {ratingText}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 bg-white/95 rounded p-1.5 text-[#0d1738] flex items-center justify-between shadow-sm">
                      <div>
                        <span className="block text-[4.5px] sm:text-[5.5px] font-bold uppercase text-muted-foreground">
                          Trusted Across {city}
                        </span>
                        <span className="block text-[6px] sm:text-[7px] font-black truncate max-w-[150px]">
                          {trade.toUpperCase()} EXPERTS WITH 5-STAR REPUTATION
                        </span>
                      </div>
                      <span className="rounded bg-[#0d1738] px-1.5 py-0.5 text-[4.5px] sm:text-[5.5px] font-bold text-white">
                        READ REVIEWS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Aluminum Keyboard Deck & Chassis Base */}
            <div
              className="relative h-4 sm:h-5 w-[108%] -left-[4%] rounded-b-2xl bg-gradient-to-b from-[#e3e6ec] via-[#c6cbd4] to-[#999fa9] shadow-2xl border-t border-white/90 flex items-center justify-center"
              style={{
                transform: "rotateX(56deg) translateZ(-4px)",
                boxShadow: "0 22px 45px rgba(0,0,0,0.7), 0 2px 4px rgba(255,255,255,0.5) inset",
              }}
            >
              {/* Center Display Open Notch */}
              <div className="h-1 w-14 sm:w-20 bg-[#7c828e] rounded-full mx-auto" />
            </div>
          </div>

          {/* 2. REALISTIC FLOATING FEATURE SHEET / BROWSER WINDOW (Overlapping Right Foreground) */}
          <div
            className="absolute -right-1 sm:-right-3 top-0 sm:top-2 w-[68%] max-w-[310px] rounded-2xl bg-white shadow-2xl border border-white/95 overflow-hidden transition-transform duration-500"
            style={{
              transform: "rotateY(-12deg) rotateX(8deg) rotateZ(-2.5deg) translateZ(50px)",
              boxShadow: "0 28px 55px -10px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            {/* Sheet Top Notch */}
            <div className="h-1.5 w-12 bg-slate-300 rounded-full mx-auto my-1 opacity-60" />

            {/* Sheet Main Header with Founder Story & Real Logo */}
            <div className="p-3 sm:p-4 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-start gap-2.5">
                {/* Photo with Real Logo & Name Overlay (Exact Match to References) */}
                <div className="relative h-14 w-14 sm:h-18 sm:w-18 rounded-xl bg-slate-800 overflow-hidden shrink-0 border-2 border-white/40 shadow-md">
                  {featuredCardPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featuredCardPhoto}
                      alt={founder}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black/30 text-white font-black text-sm">
                      {founder.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Real Logo Overlay Tag */}
                  {data.logoUrl && (
                    <div className="absolute top-1 left-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center border border-white/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={data.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                  )}

                  {/* Founder Name Tag Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 text-[#0d1738] p-0.5 text-center shadow-sm">
                    <span className="block text-[5px] sm:text-[6px] font-black truncate">{founder}</span>
                    <span className="block text-[4px] sm:text-[5px] text-muted-foreground truncate">{founderRole}</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[6px] sm:text-[7px] uppercase font-black tracking-widest text-white/75">
                    OUR STORY
                  </span>
                  <h4 className="text-[8px] sm:text-[10px] font-black leading-snug line-clamp-2 uppercase">
                    {aboutHeading}
                  </h4>
                  <p className="text-[5.5px] sm:text-[6.5px] text-white/80 line-clamp-2 leading-tight">
                    Dedicated to providing premium {trade.toLowerCase()} and expert craftsmanship across {city} with verified satisfaction.
                  </p>
                  <div className="pt-1 flex items-center gap-1">
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[5px] sm:text-[6px] font-bold">
                      GET A FREE QUOTE →
                    </span>
                    <span className="rounded bg-white/10 px-1 py-0.5 text-[5px] sm:text-[6px] font-bold">
                      FOLLOW US
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Column Metric Ribbon (Exact Match to References) */}
              <div className="mt-3 pt-2.5 border-t border-white/25 grid grid-cols-4 gap-1 text-center">
                <div>
                  <span className="block text-[9px] sm:text-[11.5px] font-black">{yearsExp}</span>
                  <span className="block text-[4.5px] sm:text-[6px] text-white/80 uppercase font-bold">Experience</span>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[11.5px] font-black">{ratingText}</span>
                  <span className="block text-[4.5px] sm:text-[6px] text-white/80 uppercase font-bold">Reviews</span>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[11.5px] font-black">1-YEAR</span>
                  <span className="block text-[4.5px] sm:text-[6px] text-white/80 uppercase font-bold">Guarantee</span>
                </div>
                <div>
                  <span className="block text-[9px] sm:text-[11.5px] font-black">100%</span>
                  <span className="block text-[4.5px] sm:text-[6px] text-white/80 uppercase font-bold">Focus</span>
                </div>
              </div>
            </div>

            {/* Sheet Lower Area: Service Callout */}
            <div className="p-3 bg-[#fbfbfd] space-y-1">
              <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-wider text-muted-foreground">
                CRAFTSMANSHIP YOU CAN TRUST
              </span>
              <p className="text-[7.5px] sm:text-[9.5px] font-black text-[#0d1738] leading-tight uppercase">
                EXPERT {city.toUpperCase()} {trade.toUpperCase()} SERVICES
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[6px] sm:text-[7px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Verified Live
                </span>
                <span
                  className="rounded px-2.5 py-0.5 text-[6px] sm:text-[7px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Call Now
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-center pb-1">
          <p className="text-[9px] sm:text-[11px] font-bold tracking-widest text-white/60 uppercase">
            DESIGNED &amp; DELIVERED BY BARAKAHSOFT
          </p>
        </div>
      </div>

      {/* Control Panel for Operator */}
      {showControls && (
        <div className="w-full max-w-[560px] space-y-4 bg-white p-5 rounded-2xl border border-border shadow-sm">
          {/* 1. Featured Photo Selector from Scraped Photos */}
          {data.availablePhotos && data.availablePhotos.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#533afd]" /> Featured Card Photo
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Pick the best hero / team shot
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {data.availablePhotos.slice(0, 7).map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(url);
                      onSelectPhoto?.(url);
                    }}
                    className={`relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      featuredCardPhoto === url
                        ? "border-[#533afd] scale-105 shadow-md ring-2 ring-[#533afd]/20"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Option ${idx + 1}`} className="h-full w-full object-cover" />
                    {featuredCardPhoto === url && (
                      <span className="absolute top-0.5 right-0.5 h-3 w-3 bg-[#533afd] rounded-full flex items-center justify-center text-white text-[8px]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Headline Wording Switcher */}
          <div className="space-y-1.5 pt-1 border-t border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-[#533afd]" /> Poster Headline Style
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Match stage (Proposed vs Launched)
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

          {/* 3. Theme Background Switcher */}
          <div className="flex items-center justify-between pt-1 border-t border-border/70">
            <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#533afd]" /> Background Palette (Reference Match)
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

          {/* 4. High-Res Export Buttons */}
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

// Generate self-contained SVG for 1080px Canvas rasterization matching the reference images
function generateRealisticMockupSvg({
  data,
  width,
  height,
  format,
  primaryColor,
  businessShortName,
  city,
  trade,
  heroHeading,
  aboutHeading,
  founder,
  founderRole,
  ratingText,
  reviewsCountText,
  yearsExp,
  featuredPhoto,
}: {
  data: MockupData;
  theme: (typeof BG_THEMES)[0];
  width: number;
  height: number;
  format: "feed" | "story" | "transparent";
  primaryColor: string;
  businessShortName: string;
  city: string;
  trade: string;
  heroHeading: string;
  aboutHeading: string;
  founder: string;
  founderRole: string;
  ratingText: string;
  reviewsCountText: string;
  yearsExp: string;
  featuredPhoto?: string | null;
}) {
  const isStory = format === "story";
  const contentYOffset = isStory ? 320 : 180;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="macShadow" x="-15%" y="-15%" width="135%" height="135%">
        <feDropShadow dx="0" dy="32" stdDeviation="42" flood-color="rgba(0,0,0,0.65)" />
      </filter>
      <filter id="sheetShadow" x="-20%" y="-20%" width="145%" height="145%">
        <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="rgba(0,0,0,0.55)" />
      </filter>
      <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#242830"/>
        <stop offset="100%" stop-color="#0f1115"/>
      </linearGradient>
      <linearGradient id="deckGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e3e6ec"/>
        <stop offset="40%" stop-color="#c6cbd4"/>
        <stop offset="100%" stop-color="#9197a3"/>
      </linearGradient>
    </defs>

    <g transform="translate(0, ${contentYOffset})">
      <!-- 1. MACBOOK PRO 3D CHASSIS (LEFT) -->
      <g transform="translate(120, 220) rotate(3) skewY(-8) scale(0.96)" filter="url(#macShadow)">
        <!-- Outer Lid Bezel -->
        <rect x="0" y="0" width="610" height="400" rx="22" fill="url(#lidGrad)" stroke="rgba(255,255,255,0.28)" stroke-width="2.5"/>
        
        <!-- Screen Glass -->
        <rect x="18" y="18" width="574" height="364" rx="12" fill="#0b111e"/>
        
        <!-- Webpage Nav Header Strip -->
        <rect x="18" y="18" width="574" height="42" fill="${primaryColor}"/>
        <circle cx="36" cy="39" r="6.5" fill="rgba(255,255,255,0.4)" />
        <text x="50" y="44" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="15">${escapeXml(
          businessShortName
        )}</text>
        <text x="570" y="44" text-anchor="end" fill="#ffffff" opacity="0.88" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="700" font-size="11.5">Home  ·  About  ·  Services  ·  Call Now</text>

        <!-- Webpage Hero Body on Screen -->
        <rect x="18" y="60" width="574" height="322" fill="#0f172a"/>
        <text x="44" y="116" fill="#6ee7b7" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="12.5" letter-spacing="1.5">SERVING ${escapeXml(
          city.toUpperCase()
        )}</text>
        <text x="44" y="152" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">${escapeXml(
          heroHeading.slice(0, 34)
        )}</text>
        <text x="44" y="186" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">${escapeXml(
          heroHeading.slice(34, 68) || "EXPERT SERVICES & GUARANTEE"
        )}</text>
        
        <!-- CTA & Rating on Screen -->
        <rect x="44" y="222" width="165" height="38" rx="8" fill="${primaryColor}"/>
        <text x="126" y="246" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="13">GET A FREE QUOTE →</text>
        <text x="230" y="246" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="14">★★★★★ ${ratingText}</text>

        <!-- Below Fold Section Preview on Screen (Exact match to Reference 1) -->
        <rect x="44" y="276" width="522" height="70" rx="8" fill="rgba(255,255,255,0.96)"/>
        <text x="60" y="298" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="9" letter-spacing="1">TRUSTED ACROSS ${escapeXml(
          city.toUpperCase()
        )}</text>
        <text x="60" y="322" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="14">${escapeXml(
          trade.toUpperCase()
        )} EXPERTS WITH A REPUTATION FOR EXCELLENCE</text>
        <rect x="430" y="300" width="120" height="28" rx="6" fill="#0f172a"/>
        <text x="490" y="318" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10.5">READ REVIEWS →</text>

        <!-- Aluminum Laptop Deck / Base -->
        <path d="M -30,400 L 640,400 L 595,445 L 15,445 Z" fill="url(#deckGrad)" stroke="rgba(255,255,255,0.75)" stroke-width="1.5"/>
        <rect x="260" y="400" width="90" height="8" rx="4" fill="#6b7280"/>
      </g>

      <!-- 2. REALISTIC FLOATING FEATURE SHEET (RIGHT FOREGROUND) -->
      <g transform="translate(420, 130) rotate(-4) skewY(5.5) scale(1.0)" filter="url(#sheetShadow)">
        <!-- Sheet White Outer Border -->
        <rect x="0" y="0" width="540" height="480" rx="28" fill="#ffffff" stroke="rgba(255,255,255,0.98)" stroke-width="2.5"/>
        
        <!-- Sheet Top Brand Banner -->
        <rect x="0" y="0" width="540" height="300" rx="28" fill="${primaryColor}"/>
        <rect x="0" y="270" width="540" height="30" fill="${primaryColor}"/>

        <!-- Photo Frame with Name Overlay -->
        <rect x="34" y="36" width="144" height="144" rx="18" fill="#1e293b" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
        <text x="106" y="112" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="34">${escapeXml(
          founder.slice(0, 2).toUpperCase()
        )}</text>
        <rect x="34" y="145" width="144" height="35" rx="4" fill="rgba(255,255,255,0.95)"/>
        <text x="106" y="162" text-anchor="middle" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="11">${escapeXml(
          founder
        )}</text>
        <text x="106" y="174" text-anchor="middle" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="9">${escapeXml(
          founderRole
        )}</text>

        <!-- Story Copy in Sheet -->
        <text x="198" y="64" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="12" letter-spacing="1.5">OUR STORY</text>
        <text x="198" y="96" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19.5">${escapeXml(
          aboutHeading.slice(0, 26)
        )}</text>
        <text x="198" y="124" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19.5">${escapeXml(
          aboutHeading.slice(26, 52) || "CUSTOMER EXCELLENCE"
        )}</text>
        <text x="198" y="152" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="500" font-size="10.5">Dedicated to expert ${escapeXml(
          trade.toLowerCase()
        )} and quality service across ${escapeXml(city)}.</text>
        
        <!-- Story Buttons -->
        <rect x="198" y="166" width="115" height="24" rx="4" fill="rgba(255,255,255,0.2)"/>
        <text x="255" y="182" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="9">GET A FREE QUOTE →</text>
        <rect x="322" y="166" width="85" height="24" rx="4" fill="rgba(255,255,255,0.12)"/>
        <text x="364" y="182" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="9">FOLLOW US</text>

        <!-- 4-Column Metric Ribbon -->
        <line x1="34" y1="206" x2="506" y2="206" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        
        <text x="88" y="244" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="28">${escapeXml(
          yearsExp
        )}</text>
        <text x="88" y="268" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10.5">EXPERIENCE</text>

        <text x="210" y="244" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="28">${escapeXml(
          ratingText
        )}</text>
        <text x="210" y="268" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10.5">REVIEWS</text>

        <text x="330" y="244" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="28">1-YEAR</text>
        <text x="330" y="268" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10.5">GUARANTEE</text>

        <text x="450" y="244" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="28">100%</text>
        <text x="450" y="268" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10.5">FOCUS</text>

        <!-- Lower Section Content -->
        <text x="34" y="345" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12" letter-spacing="1">CRAFTSMANSHIP YOU CAN TRUST</text>
        <text x="34" y="380" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="21">EXPERT ${escapeXml(
          city.toUpperCase()
        )} ${escapeXml(trade.toUpperCase())} SERVICES</text>

        <!-- Badges at bottom of sheet -->
        <rect x="34" y="426" width="140" height="32" rx="8" fill="#ecfdf5"/>
        <text x="104" y="447" text-anchor="middle" fill="#047857" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="13">✓ Verified Live</text>

        <rect x="380" y="426" width="130" height="32" rx="8" fill="${primaryColor}"/>
        <text x="445" y="447" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="13">Call Now</text>
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
