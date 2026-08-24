"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Sliders,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

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
  aboutBody?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  photoUrl?: string | null;
  secondaryPhotoUrl?: string | null;
  availablePhotos?: string[];
  siteUrl?: string | null;
  previewUrl?: string | null;
  headlineMode?: MockupHeadlineMode;
  themeId?: string;
  bespokeHtml?: string | null;
  bespokeCss?: string | null;
}

export const HEADLINE_OPTIONS: { id: MockupHeadlineMode; line1: string; line2: string; tag: string }[] = [
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

export const BG_THEMES = [
  {
    id: "olive",
    name: "Sage Olive (Ref 1)",
    gradient: "from-[#4a5a47] via-[#334131] to-[#1e271c]",
    bgStart: "#4a5a47",
    bgMid: "#334131",
    bgEnd: "#1e271c",
    cardBg: "#1b3824",
  },
  {
    id: "sky",
    name: "Azure Sky (Ref 2)",
    gradient: "from-[#75a6c8] via-[#48779b] to-[#254c6d]",
    bgStart: "#75a6c8",
    bgMid: "#48779b",
    bgEnd: "#254c6d",
    cardBg: "#284a68",
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    gradient: "from-[#182845] via-[#0f1a2f] to-[#060c18]",
    bgStart: "#182845",
    bgMid: "#0f1a2f",
    bgEnd: "#060c18",
    cardBg: "#12223a",
  },
  {
    id: "charcoal",
    name: "Studio Charcoal",
    gradient: "from-[#30353e] via-[#1f2228] to-[#121418]",
    bgStart: "#30353e",
    bgMid: "#1f2228",
    bgEnd: "#121418",
    cardBg: "#1c2027",
  },
];

// Helper: Convert any remote image to base64 via internal proxy so Canvas/html-to-image exports draw real photos reliably
async function urlToBase64(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  try {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.dataUri) return data.dataUri;
    }
  } catch (err) {
    console.warn("[urlToBase64] proxy fetch failed, trying direct fetch", err);
  }

  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Fallback ignored
  }

  return null;
}

export function SocialLaunchMockup({
  data,
  showControls = true,
  className = "",
  onSelectPhoto,
  onThemeChange,
  onHeadlineModeChange,
}: {
  data: MockupData;
  showControls?: boolean;
  className?: string;
  onSelectPhoto?: (url: string) => void;
  onThemeChange?: (themeId: string) => void;
  onHeadlineModeChange?: (mode: MockupHeadlineMode) => void;
}) {
  const [themeId, setThemeId] = useState(data.themeId || "olive");
  const [headlineMode, setHeadlineMode] = useState<MockupHeadlineMode>(data.headlineMode || "proposed");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(data.photoUrl || data.secondaryPhotoUrl || null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  // Synchronize when data props update
  useEffect(() => {
    if (data.themeId && data.themeId !== themeId) {
      setThemeId(data.themeId);
    }
  }, [data.themeId]);

  useEffect(() => {
    if (data.headlineMode && data.headlineMode !== headlineMode) {
      setHeadlineMode(data.headlineMode);
    }
  }, [data.headlineMode]);

  useEffect(() => {
    if (data.photoUrl && data.photoUrl !== selectedPhoto) {
      setSelectedPhoto(data.photoUrl);
    }
  }, [data.photoUrl]);

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const primaryColor = data.brandColor || theme.cardBg;

  const businessShortName = data.businessName || "Your Business";
  const city = data.city || "New York";
  const trade = data.trade || "Contractor";
  const heroHeading =
    data.heroHeadline || `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`;
  const aboutHeading =
    data.aboutHeadline || `A PASSION FOR ${trade.toUpperCase()} EXCELLENCE`;
  const aboutBody =
    data.aboutBody ||
    `Dedicated to providing premium ${trade.toLowerCase()} and expert craftsmanship across ${city} with verified customer satisfaction.`;
  const founder = data.founderName || "Dan Martin";
  const founderRole = data.founderTitle || "Founder / Operator";
  const ratingText = data.rating ? `${data.rating}★` : "5★";
  const reviewsCountText = data.reviewCount ? `${data.reviewCount}+` : "100+";
  const yearsExp = data.yearsExperience ? `${data.yearsExperience}+` : "10+";

  const activeHeadline = HEADLINE_OPTIONS.find((h) => h.id === headlineMode) || HEADLINE_OPTIONS[0];
  const featuredCardPhoto = selectedPhoto || data.photoUrl || data.secondaryPhotoUrl;

  // Pre-load all remote images as base64 before export to guarantee pixel-perfect zero-CORS capture
  async function prepareElementForExport(element: HTMLElement) {
    const images = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      images.map(async (img) => {
        if (img.src && !img.src.startsWith("data:")) {
          const base64 = await urlToBase64(img.src);
          if (base64) {
            img.src = base64;
          }
        }
      })
    );
  }

  // Pixel-Perfect High-Resolution Export
  async function downloadImage(format: "feed" | "story" | "transparent") {
    setDownloading(format);
    try {
      let targetEl: HTMLElement | null = null;

      if (format === "feed") {
        targetEl = mockupRef.current;
      } else if (format === "story") {
        targetEl = storyRef.current;
      } else if (format === "transparent") {
        targetEl = stageRef.current;
      }

      if (!targetEl) {
        throw new Error("Target element not found");
      }

      await prepareElementForExport(targetEl);

      const cleanName = businessShortName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const pixelRatio = format === "feed" ? 2.25 : format === "story" ? 2.0 : 2.5;

      const dataUrl = await toPng(targetEl, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: format === "transparent" ? "transparent" : undefined,
        style: {
          transform: "none",
          margin: "0",
        },
      });

      const a = document.createElement("a");
      a.download = `${cleanName}-${headlineMode}-mockup-${format}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("[mockup] export failed", err);
      alert("Could not generate download. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  const renderScreenContent = () => {
    if (data.bespokeHtml) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-white">
          <div
            className="absolute top-0 left-0 pointer-events-none origin-top-left select-none"
            style={{
              width: "1280px",
              height: "800px",
              transform: "scale(0.285)",
            }}
          >
            {data.bespokeCss && (
              <style dangerouslySetInnerHTML={{ __html: data.bespokeCss }} />
            )}
            <div
              className="bespoke-page"
              dangerouslySetInnerHTML={{ __html: data.bespokeHtml }}
            />
          </div>
          {/* Glass Reflection Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-10" />
        </div>
      );
    }

    if (data.previewUrl) {
      return (
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
          {/* Glass Reflection Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
        </div>
      );
    }

    return (
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
    );
  };

  const render3DStage = () => (
    <div
      ref={stageRef}
      className="relative z-10 w-full flex-1 flex items-center justify-center mt-2 perspective-[1400px]"
    >
      {/* Ground Ambient Shadow */}
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

          {/* Screen Inner Display */}
          <div className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/80 flex flex-col">
            {renderScreenContent()}
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
          <div className="h-1 w-14 sm:w-20 bg-[#7c828e] rounded-full mx-auto" />
        </div>
      </div>

      {/* 2. REALISTIC FLOATING ABOUT / FOUNDER CARD (Overlapping Right Foreground) */}
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
            {/* Photo with Real Logo & Name Overlay */}
            <div className="relative h-14 w-14 sm:h-18 sm:w-18 rounded-xl bg-slate-800 overflow-hidden shrink-0 border-2 border-white/40 shadow-md">
              {featuredCardPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featuredCardPhoto}
                  alt={founder}
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-black/30 text-white font-black text-sm">
                  {founder.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Real Logo Overlay Badge */}
              {data.logoUrl && (
                <div className="absolute top-1 left-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center border border-white/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.logoUrl} alt="Logo" crossOrigin="anonymous" className="h-full w-full object-contain" />
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
                {aboutBody}
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

          {/* 4-Column Metric Ribbon */}
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
  );

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 3D Mockup Stage (4:5 Aspect Ratio matching visible UI) */}
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

        {/* Dynamic Top Header */}
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

        {/* 3D Composition Stage */}
        {render3DStage()}
      </div>

      {/* Hidden 9:16 Story Container used specifically for Story/Reel Export */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={storyRef}
          className={`w-[540px] h-[960px] bg-gradient-to-b ${theme.gradient} p-8 flex flex-col justify-between items-center relative overflow-hidden`}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-10">
            <span className="font-black text-8xl tracking-widest text-white uppercase transform -rotate-12 translate-y-36">
              {businessShortName}
            </span>
          </div>

          {/* Dynamic Top Header */}
          <div className="relative z-10 text-center pt-8">
            <h2
              className="text-4xl font-black tracking-wider text-white uppercase drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] font-sans"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.45)" }}
            >
              {activeHeadline.line1}
              <br />
              {activeHeadline.line2}
            </h2>
          </div>

          {/* 3D Composition Stage (Scaled for 9:16) */}
          <div className="relative z-10 w-full flex items-center justify-center scale-110 my-auto">
            {render3DStage()}
          </div>
        </div>
      </div>

      {/* Control Panel for Operator */}
      {showControls && (
        <div className="w-full max-w-[560px] space-y-4 bg-white p-5 rounded-2xl border border-border shadow-sm">
          {/* 1. Featured Photo Selector */}
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
                {data.availablePhotos.slice(0, 8).map((url, idx) => (
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
                  onClick={() => {
                    setHeadlineMode(h.id);
                    onHeadlineModeChange?.(h.id);
                  }}
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
                  onClick={() => {
                    setThemeId(t.id);
                    onThemeChange?.(t.id);
                  }}
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
            💡 <strong>1-Click High-Res PNG Export</strong> — captures the exact visible 3D composition for social media or video editors.
          </p>
        </div>
      )}
    </div>
  );
}
