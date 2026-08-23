"use client";

import React, { useRef, useState } from "react";
import { Download, Sparkles, Image as ImageIcon, Layers, Eye, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const BG_THEMES = [
  {
    id: "brand",
    name: "Brand Theme",
    gradient: "from-[#2b4436] via-[#1c2e24] to-[#121f18]",
    glow: "rgba(50, 90, 70, 0.4)",
    textColor: "#ffffff",
  },
  {
    id: "sage",
    name: "Sage Olive",
    gradient: "from-[#52634f] via-[#3a4738] to-[#252f24]",
    glow: "rgba(82, 99, 79, 0.4)",
    textColor: "#ffffff",
  },
  {
    id: "sky",
    name: "Sky Azure",
    gradient: "from-[#6ba3cb] via-[#4678a0] to-[#285072]",
    glow: "rgba(107, 163, 203, 0.4)",
    textColor: "#ffffff",
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    gradient: "from-[#1a2b4c] via-[#0f1b33] to-[#080d1a]",
    glow: "rgba(26, 43, 76, 0.5)",
    textColor: "#ffffff",
  },
  {
    id: "charcoal",
    name: "Studio Charcoal",
    gradient: "from-[#2d3139] via-[#1f2227] to-[#14161a]",
    glow: "rgba(45, 49, 57, 0.4)",
    textColor: "#ffffff",
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
  const [themeId, setThemeId] = useState("sage");
  const [downloading, setDownloading] = useState<string | null>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const primaryColor = data.brandColor || "#1b4d3e";

  const businessShortName = data.businessName || "Your Business";
  const heroHeading =
    data.heroHeadline ||
    `PREMIER ${data.trade ? data.trade.toUpperCase() : "SERVICES"} IN ${data.city ? data.city.toUpperCase() : "YOUR AREA"}`;
  const aboutHeading =
    data.aboutHeadline ||
    `A PASSION FOR ${data.trade ? data.trade.toUpperCase() : "EXCELLENCE"} AND CUSTOMER SATISFACTION`;
  const founder = data.founderName || "Founder & Team";
  const founderRole = data.founderTitle || "Owner & Operator";
  const ratingText = data.rating ? `${data.rating}★` : "5.0★";
  const reviewsCountText = data.reviewCount ? `${data.reviewCount}+` : "100+";

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
        } else {
          // Sage/Olive default (exact match to image 1)
          bgGradient.addColorStop(0, "#5a6e57");
          bgGradient.addColorStop(0.4, "#445542");
          bgGradient.addColorStop(1, "#2a3628");
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Watermark ghost text behind laptop
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.font = "900 130px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(businessShortName.toUpperCase(), width / 2, height * 0.72);
        ctx.restore();

        // 2. Draw Top Heading "NEW WEBSITE LAUNCHED"
        const titleY = format === "story" ? 220 : 170;
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "900 68px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        // Soft drop shadow / glow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = "#ffffff";
        ctx.fillText("NEW WEBSITE", width / 2, titleY);
        ctx.fillText("LAUNCHED", width / 2, titleY + 74);
        ctx.restore();
      }

      // Convert SVG/DOM of the exact 3D mockup into high-res Canvas raster
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
      a.download = `${cleanName}-website-mockup-${format}.png`;
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
        className={`relative w-full max-w-[540px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${theme.gradient} select-none border border-white/10 flex flex-col justify-between p-6 sm:p-8`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.2)",
        }}
      >
        {/* Background Ghost Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
          <span className="font-black text-6xl sm:text-8xl tracking-widest text-white uppercase transform -rotate-12 translate-y-16">
            {businessShortName}
          </span>
        </div>

        {/* Top Header: NEW WEBSITE LAUNCHED */}
        <div className="relative z-10 text-center pt-2 sm:pt-4">
          <h2
            className="text-2xl sm:text-4xl font-black tracking-wider text-white uppercase drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)] font-sans"
            style={{ textShadow: "0 4px 18px rgba(0,0,0,0.4)" }}
          >
            NEW WEBSITE
            <br />
            LAUNCHED
          </h2>
        </div>

        {/* 3D Composition Stage: Laptop (Left) + Floating Feature Sheet (Right) */}
        <div className="relative z-10 w-full flex-1 flex items-center justify-center mt-2 perspective-[1200px]">
          {/* Ground Ambient Shadow */}
          <div className="absolute bottom-4 left-8 right-8 h-8 bg-black/40 blur-xl rounded-full transform scale-x-110 -rotate-2" />

          {/* LAYER 1: 3D Perspective MacBook Laptop */}
          <div
            className="relative w-[82%] max-w-[420px] transition-transform duration-500"
            style={{
              transform: "rotateY(-18deg) rotateX(12deg) rotateZ(3deg) translateY(8px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Screen Bezel */}
            <div className="relative rounded-t-xl bg-[#1a1a1a] p-2 sm:p-2.5 pb-3 sm:pb-4 shadow-2xl border border-white/10 ring-1 ring-black/40">
              {/* Screen Glass */}
              <div className="relative aspect-[16/10] w-full rounded bg-[#0e1626] overflow-hidden shadow-inner border border-black/60 flex flex-col">
                {/* Website Navigation Bar */}
                <div
                  className="h-4 sm:h-5 w-full flex items-center justify-between px-2 text-[6px] sm:text-[7px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-white/30" />
                    <span className="truncate max-w-[90px]">{businessShortName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80 scale-90">
                    <span>Home</span>
                    <span>About</span>
                    <span>Services</span>
                  </div>
                </div>

                {/* Website Hero Section on Laptop Screen */}
                <div className="relative flex-1 bg-slate-900 p-2 sm:p-3 flex flex-col justify-center text-white overflow-hidden">
                  {/* Hero background image/color */}
                  <div
                    className="absolute inset-0 opacity-40 bg-cover bg-center"
                    style={{
                      backgroundImage: data.photoUrl ? `url(${data.photoUrl})` : undefined,
                      backgroundColor: primaryColor,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

                  {/* Hero Content */}
                  <div className="relative z-10 space-y-1 max-w-[85%]">
                    <span className="inline-block rounded bg-white/20 px-1 py-0.5 text-[5px] sm:text-[6px] font-bold tracking-wider uppercase text-emerald-300">
                      {data.city || "Top Rated Local"}
                    </span>
                    <h3 className="text-[7px] sm:text-[9px] font-black leading-tight line-clamp-2 uppercase">
                      {heroHeading}
                    </h3>
                    <div className="flex items-center gap-1 pt-1">
                      <span
                        className="rounded px-1.5 py-0.5 text-[5px] sm:text-[6px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Get a Free Quote
                      </span>
                      <span className="text-[5px] sm:text-[6px] text-amber-400 font-bold">{ratingText} (5/5)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Base / Keyboard Deck */}
            <div
              className="relative h-3 sm:h-4 w-[106%] -left-[3%] rounded-b-xl bg-[#c5c8cf] shadow-xl border-t border-white/60 flex items-center justify-center"
              style={{
                transform: "rotateX(55deg) translateZ(-4px)",
                boxShadow: "0 12px 24px rgba(0,0,0,0.6)",
              }}
            >
              {/* Notch */}
              <div className="h-1 w-10 sm:w-14 bg-[#9aa0a6] rounded-full mx-auto" />
            </div>
          </div>

          {/* LAYER 2: Floating Feature Card / Viewport Sheet (Right Foreground) */}
          <div
            className="absolute -right-2 sm:-right-4 top-2 sm:top-4 w-[65%] max-w-[280px] rounded-2xl bg-white shadow-2xl border border-white/80 overflow-hidden transition-transform duration-500"
            style={{
              transform: "rotateY(-12deg) rotateX(6deg) rotateZ(-2deg) translateZ(40px)",
              boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            {/* Sheet Header Area: Theme Colored Banner & Founder Story */}
            <div className="p-3 sm:p-4 text-white" style={{ backgroundColor: primaryColor }}>
              <div className="flex items-start gap-2.5">
                {/* Team / Founder Photo */}
                <div className="relative h-11 w-11 sm:h-14 sm:w-14 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-white/30 shadow-md">
                  {data.secondaryPhotoUrl || data.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.secondaryPhotoUrl || data.photoUrl || ""}
                      alt={founder}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-black/20 text-white font-bold text-xs">
                      {founder.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[6px] sm:text-[7px] uppercase font-bold tracking-widest text-white/70">
                    Our Story
                  </span>
                  <h4 className="text-[7px] sm:text-[9px] font-bold leading-snug line-clamp-2 uppercase">
                    {aboutHeading}
                  </h4>
                  <p className="text-[6px] sm:text-[7px] text-white/80 line-clamp-1 font-semibold">{founder}</p>
                </div>
              </div>

              {/* Trust Metric Numbers Strip */}
              <div className="mt-2.5 pt-2 border-t border-white/20 grid grid-cols-4 gap-1 text-center">
                <div>
                  <span className="block text-[8px] sm:text-[10px] font-black">{data.yearsExperience || "10+"}</span>
                  <span className="block text-[5px] sm:text-[6px] text-white/70 uppercase">Experience</span>
                </div>
                <div>
                  <span className="block text-[8px] sm:text-[10px] font-black">{ratingText}</span>
                  <span className="block text-[5px] sm:text-[6px] text-white/70 uppercase">Reviews</span>
                </div>
                <div>
                  <span className="block text-[8px] sm:text-[10px] font-black">1-Year</span>
                  <span className="block text-[5px] sm:text-[6px] text-white/70 uppercase">Warranty</span>
                </div>
                <div>
                  <span className="block text-[8px] sm:text-[10px] font-black">100%</span>
                  <span className="block text-[5px] sm:text-[6px] text-white/70 uppercase">Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Sheet Lower Area: Service Card */}
            <div className="p-2.5 sm:p-3 bg-[#fbfbfd] space-y-1.5">
              <span className="text-[5px] sm:text-[6px] font-bold uppercase tracking-wider text-muted-foreground">
                Craftsmanship You Can Trust
              </span>
              <p className="text-[7px] sm:text-[8px] font-bold text-[#0d1738] leading-tight">
                Expert {data.trade || "Local Service"} & Dedicated Customer Support
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[6px] sm:text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ✓ Verified Live
                </span>
                <span
                  className="rounded px-2 py-0.5 text-[6px] sm:text-[7px] font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Call Now
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Brand Watermark */}
        <div className="relative z-10 text-center pb-1">
          <p className="text-[9px] sm:text-[11px] font-bold tracking-widest text-white/60 uppercase">
            DESIGNED & DELIVERED BY BARAKAHSOFT
          </p>
        </div>
      </div>

      {/* Admin / Export Controls */}
      {showControls && (
        <div className="w-full max-w-[540px] space-y-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
          {/* Theme Color Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0d1738] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#533afd]" /> Poster Background Theme
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

          {/* Download Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
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
}) {
  const isStory = format === "story";
  const contentYOffset = isStory ? 300 : 160;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="25" stdDeviation="35" flood-color="rgba(0,0,0,0.55)" />
      </filter>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="rgba(0,0,0,0.45)" />
      </filter>
      <linearGradient id="laptopGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2a2a"/>
        <stop offset="100%" stop-color="#141414"/>
      </linearGradient>
      <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d6d9e0"/>
        <stop offset="100%" stop-color="#a0a5ad"/>
      </linearGradient>
    </defs>

    <g transform="translate(0, ${contentYOffset})">
      <!-- 1. LAPTOP 3D MOCKUP -->
      <g transform="translate(140, 240) rotate(2.5) skewY(-8) scale(0.95)" filter="url(#shadow)">
        <!-- Screen Outer Bezel -->
        <rect x="0" y="0" width="580" height="380" rx="18" fill="url(#laptopGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
        
        <!-- Screen Display Content -->
        <rect x="18" y="18" width="544" height="344" rx="8" fill="#0d1728"/>
        
        <!-- Website Header Strip -->
        <rect x="18" y="18" width="544" height="38" fill="${primaryColor}"/>
        <text x="36" y="42" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="14">${escapeXml(
          businessShortName
        )}</text>
        <text x="540" y="42" text-anchor="end" fill="#ffffff" opacity="0.8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" font-size="11">Home  ·  About  ·  Services  ·  Contact</text>

        <!-- Screen Hero Content -->
        <rect x="18" y="56" width="544" height="306" fill="#111827"/>
        <text x="42" y="110" fill="#6ee7b7" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="12" letter-spacing="1">SERVING ${escapeXml(
          (data.city || "LOCAL AREA").toUpperCase()
        )}</text>
        <text x="42" y="145" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="22">${escapeXml(
          heroHeading.slice(0, 36)
        )}</text>
        <text x="42" y="175" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="22">${escapeXml(
          heroHeading.slice(36, 72) || "EXPERT SERVICES & GUARANTEE"
        )}</text>
        
        <!-- CTA Button on screen -->
        <rect x="42" y="210" width="150" height="36" rx="6" fill="${primaryColor}"/>
        <text x="117" y="233" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="13">Get A Free Quote</text>
        <text x="210" y="233" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="14">★★★★★ ${ratingText}</text>

        <!-- Laptop Lower Aluminum Base -->
        <path d="M -25,380 L 605,380 L 565,420 L 15,420 Z" fill="url(#baseGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
        <rect x="250" y="380" width="80" height="6" rx="3" fill="#71717a"/>
      </g>

      <!-- 2. FLOATING FEATURE SHEET (Right Foreground) -->
      <g transform="translate(420, 150) rotate(-4) skewY(5) scale(0.98)" filter="url(#cardShadow)">
        <!-- Sheet Container Card -->
        <rect x="0" y="0" width="520" height="460" rx="24" fill="#ffffff" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
        
        <!-- Sheet Top Brand Banner -->
        <rect x="0" y="0" width="520" height="280" rx="24" fill="${primaryColor}"/>
        <rect x="0" y="250" width="520" height="30" fill="${primaryColor}"/> <!-- square bottom for banner -->

        <!-- Photo Frame inside Sheet -->
        <rect x="30" y="35" width="130" height="130" rx="14" fill="#334155" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        <text x="95" y="105" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="28">${escapeXml(
          founder.slice(0, 2).toUpperCase()
        )}</text>

        <!-- Story Heading in Sheet -->
        <text x="185" y="60" fill="#ffffff" opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="12" letter-spacing="1.5">OUR STORY</text>
        <text x="185" y="90" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="18">${escapeXml(
          aboutHeading.slice(0, 26)
        )}</text>
        <text x="185" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="18">${escapeXml(
          aboutHeading.slice(26, 54) || "CUSTOMER EXCELLENCE"
        )}</text>
        <text x="185" y="150" fill="#ffffff" opacity="0.9" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="14">${escapeXml(
          founder
        )}</text>

        <!-- Metrics Strip in Sheet -->
        <line x1="30" y1="190" x2="490" y2="190" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
        
        <text x="80" y="225" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">${escapeXml(
          String(data.yearsExperience || "10+")
        )}</text>
        <text x="80" y="248" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">EXPERIENCE</text>

        <text x="195" y="225" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">${escapeXml(
          ratingText
        )}</text>
        <text x="195" y="248" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">REVIEWS</text>

        <text x="315" y="225" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">1-YEAR</text>
        <text x="315" y="248" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">WARRANTY</text>

        <text x="435" y="225" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="24">100%</text>
        <text x="435" y="248" text-anchor="middle" fill="#ffffff" opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="10">GUARANTEED</text>

        <!-- Lower Section Content -->
        <text x="30" y="325" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12" letter-spacing="1">CRAFTSMANSHIP YOU CAN TRUST</text>
        <text x="30" y="360" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19">EXPERT ${escapeXml(
          (data.trade || "NYC").toUpperCase()
        )} SERVICES</text>
        <text x="30" y="388" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="19">&amp; DEDICATED SATISFACTION</text>

        <!-- Badges at bottom of sheet -->
        <rect x="30" y="410" width="130" height="28" rx="6" fill="#ecfdf5"/>
        <text x="95" y="429" text-anchor="middle" fill="#047857" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12">✓ Verified Live</text>

        <rect x="370" y="410" width="120" height="28" rx="6" fill="${primaryColor}"/>
        <text x="430" y="429" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" font-size="12">Call Now</text>
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
