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
  aboutEyebrow?: string | null;
  aboutHeadline?: string | null;
  aboutBody?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  phone?: string | null;
  siteUrl?: string | null;
  previewUrl?: string | null;
  headlineMode?: MockupHeadlineMode;
  themeId?: string;
  bespokeHtml?: string | null;
  bespokeCss?: string | null;
  heroCaptureUrl?: string | null;
  aboutCaptureUrl?: string | null;
}

export const HEADLINE_OPTIONS: { id: MockupHeadlineMode; line1: string; line2: string; tag: string }[] = [
  {
    id: "launched",
    line1: "NEW WEBSITE",
    line2: "LAUNCHED",
    tag: "Official Launch (Ref)",
  },
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
];

export const BG_THEMES = [
  {
    id: "sky",
    name: "Azure Sky (Exact Ref)",
    gradient: "from-[#6fa6cb] via-[#94bedc] to-[#c7dfef]",
    bgStart: "#6fa6cb",
    bgMid: "#94bedc",
    bgEnd: "#c7dfef",
    watermarkColor: "rgba(30, 64, 95, 0.14)",
    ribbonBg: "#2b4c6f",
  },
  {
    id: "olive",
    name: "Sage Olive",
    gradient: "from-[#4a5a47] via-[#334131] to-[#1e271c]",
    bgStart: "#4a5a47",
    bgMid: "#334131",
    bgEnd: "#1e271c",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    ribbonBg: "#1b3824",
  },
  {
    id: "midnight",
    name: "Midnight Navy",
    gradient: "from-[#182845] via-[#0f1a2f] to-[#060c18]",
    bgStart: "#182845",
    bgMid: "#0f1a2f",
    bgEnd: "#060c18",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    ribbonBg: "#12223a",
  },
  {
    id: "charcoal",
    name: "Studio Charcoal",
    gradient: "from-[#30353e] via-[#1f2228] to-[#121418]",
    bgStart: "#30353e",
    bgMid: "#1f2228",
    bgEnd: "#121418",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    ribbonBg: "#1c2027",
  },
];

// Helper: Convert remote image to base64 proxy for reliable html-to-image export
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
    // Ignore fallback
  }

  return null;
}

export function SocialLaunchMockup({
  data,
  showControls = true,
  className = "",
  onThemeChange,
  onHeadlineModeChange,
}: {
  data: MockupData;
  showControls?: boolean;
  className?: string;
  onThemeChange?: (themeId: string) => void;
  onHeadlineModeChange?: (mode: MockupHeadlineMode) => void;
}) {
  const [themeId, setThemeId] = useState(data.themeId || "sky");
  const [headlineMode, setHeadlineMode] = useState<MockupHeadlineMode>(data.headlineMode || "launched");
  const [downloading, setDownloading] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [screenScale, setScreenScale] = useState(0.315);

  useEffect(() => {
    if (!screenRef.current) return;
    const updateScale = () => {
      if (screenRef.current) {
        const width = screenRef.current.clientWidth;
        if (width > 0) {
          setScreenScale(width / 1280);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(screenRef.current);
    return () => observer.disconnect();
  }, []);

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

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];
  const primaryColor = data.brandColor || theme.ribbonBg;

  const businessShortName = data.businessName || "Your Business";
  const city = data.city || "New York";
  const trade = data.trade || "Contractor";
  const heroHeading =
    data.heroHeadline || `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`;
  const aboutEyebrow =
    data.aboutEyebrow || `BUILT ON CRAFTSMANSHIP & VALUES`;
  const aboutHeading =
    data.aboutHeadline || `About Our Local ${trade} Company In ${city}`;
  const aboutBody =
    data.aboutBody ||
    `${businessShortName} provides expert ${trade.toLowerCase()} and dependable performance across ${city}. Our team delivers personalized service and craftsmanship from start to finish.`;
  const ratingText = data.rating ? `${data.rating}★` : null;
  const reviewsCountText = data.reviewCount ? String(data.reviewCount) : null;
  const yearsExp = data.yearsExperience ? `${data.yearsExperience}+` : null;

  const activeHeadline = HEADLINE_OPTIONS.find((h) => h.id === headlineMode) || HEADLINE_OPTIONS[0];

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
      const pixelRatio = format === "feed" ? 2.5 : format === "story" ? 2.0 : 2.5;

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
    if (data.heroCaptureUrl) {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.heroCaptureUrl}
            alt={`${businessShortName} homepage hero and navigation`}
            crossOrigin="anonymous"
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
        </div>
      );
    }

    if (data.bespokeHtml) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-white">
          <div
            className="absolute top-0 left-0 pointer-events-none origin-top-left select-none"
            style={{
              width: "1280px",
              height: "800px",
              transform: `scale(${screenScale})`,
              transformOrigin: "top left",
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
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none z-10" />
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
              transform: `scale(${screenScale})`,
              transformOrigin: "top left",
            }}
          />
          {/* Glass Reflection Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
        </div>
      );
    }

    return (
      /* High-Fidelity Website Viewport Fallback */
      <div className="relative flex-1 bg-slate-900 p-3 sm:p-4 flex flex-col justify-between text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-45 bg-cover bg-center"
          style={{
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
              {ratingText ? `${ratingText} customer rating` : businessShortName}
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
      className="relative z-10 w-full flex-1 flex items-center justify-center mt-2 perspective-[1500px]"
    >
      {/* Soft Ground Contact Shadow Under Laptop */}
      <div className="absolute bottom-2 sm:bottom-4 left-4 sm:left-8 right-4 sm:right-8 h-12 sm:h-16 bg-slate-900/45 blur-2xl rounded-full transform scale-x-115 -rotate-2" />

      {/* 1. REALISTIC 3D MACBOOK PRO (Angled Left 3/4 Perspective) */}
      <div
        className="relative w-[90%] max-w-[460px] transition-transform duration-500"
        style={{
          transform: "rotateY(-16deg) rotateX(12deg) rotateZ(2deg) translateY(14px)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Screen Bezel & Glass Lid */}
        <div className="relative rounded-t-2xl bg-[#0f1217] p-2 sm:p-2.5 pb-3.5 sm:pb-4 shadow-2xl border border-white/30 ring-1 ring-black/80">
          {/* Top Center Camera Notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-12 bg-black rounded-b-md z-20 flex items-center justify-center">
            <span className="h-0.5 w-0.5 rounded-full bg-[#334155]" />
          </div>

          {/* Screen Display Inner Frame */}
          <div
            ref={screenRef}
            className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/90 flex flex-col"
          >
            {renderScreenContent()}
          </div>
        </div>

        {/* Aluminum Laptop Deck & Ports (Silver MacBook Pro Style) */}
        <div
          className="relative h-4 sm:h-5 w-[108%] -left-[4%] rounded-b-2xl bg-gradient-to-b from-[#e8ecf2] via-[#ced3dc] to-[#a2a8b4] shadow-2xl border-t border-white/95 flex items-center justify-between px-3"
          style={{
            transform: "rotateX(56deg) translateZ(-4px)",
            boxShadow: "0 24px 50px rgba(0,0,0,0.55), 0 2px 4px rgba(255,255,255,0.7) inset",
          }}
        >
          {/* Left Ports (MagSafe + Thunderbolt) */}
          <div className="flex items-center gap-1 opacity-70">
            <span className="h-1 w-1.5 rounded-xs bg-slate-600" />
            <span className="h-0.5 w-1 rounded-xs bg-slate-600" />
          </div>

          {/* Center Thumb Groove */}
          <div className="h-1 w-16 sm:w-24 bg-[#7a818d] rounded-full mx-auto" />

          {/* Right Ports */}
          <div className="flex items-center gap-1 opacity-70">
            <span className="h-0.5 w-1 rounded-xs bg-slate-600" />
          </div>
        </div>
      </div>

      {/* 2. FLOATING WEBSITE ABOUT & METRIC SHEET (Exact Match to Reference Poster) */}
      <div
        className="absolute -right-2 sm:-right-4 top-[-10px] sm:top-[-4px] w-[78%] max-w-[365px] rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden transition-transform duration-500"
        style={{
          transform: "rotateY(-12deg) rotateX(8deg) rotateZ(-2deg) translateZ(65px)",
          boxShadow: "0 35px 70px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {data.aboutCaptureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.aboutCaptureUrl}
            alt={`${businessShortName} about section`}
            crossOrigin="anonymous"
            className="block h-auto w-full"
          />
        ) : (
          <>
        {/* Factual fallback used only until an exact About capture is uploaded. */}
        <div className="p-4 sm:p-5 bg-white space-y-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 border border-slate-200/80">
                <span className="text-[5px] sm:text-[6px] font-extrabold uppercase tracking-wider text-slate-700">
                  {aboutEyebrow}
                </span>
              </div>
               <h4 className="text-[10px] sm:text-[13px] font-black leading-tight text-slate-900 line-clamp-3">
                {aboutHeading}
              </h4>
               <p className="text-[6px] sm:text-[7px] text-slate-600 font-normal line-clamp-4 leading-relaxed">
                {aboutBody}
              </p>
              <div className="pt-0.5">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[5px] sm:text-[6px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  GET A FREE QUOTE →
                </span>
              </div>
            </div>
        </div>

        {/* ROW 2: FULL-WIDTH SOLID METRIC RIBBON BAND */}
        {(yearsExp || reviewsCountText || ratingText) && <div
          className="px-3 py-2 text-white grid grid-cols-3 gap-1 text-center border-y border-white/20 shadow-inner"
          style={{ backgroundColor: primaryColor }}
        >
          {yearsExp && <div>
            <span className="block text-[8.5px] sm:text-[11px] font-black tracking-tight">{yearsExp}</span>
            <span className="block text-[4px] sm:text-[5px] uppercase font-bold text-white/80 tracking-wider">
              Experience
            </span>
          </div>}
          {reviewsCountText && <div>
            <span className="block text-[8.5px] sm:text-[11px] font-black tracking-tight">{reviewsCountText}</span>
            <span className="block text-[4px] sm:text-[5px] uppercase font-bold text-white/80 tracking-wider">
              Reviews
            </span>
          </div>}
          {ratingText && <div>
            <span className="block text-[8.5px] sm:text-[11px] font-black tracking-tight">{ratingText}</span>
            <span className="block text-[4px] sm:text-[5px] uppercase font-bold text-white/80 tracking-wider">
              Avg Rating
            </span>
          </div>}
        </div>}

        {/* ROW 3: SECONDARY SERVICE / CRAFTSMANSHIP SNIPPET */}
        <div className="p-2.5 sm:p-3 bg-[#fafafc] flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h5 className="text-[6.5px] sm:text-[8px] font-black text-slate-900 leading-tight truncate">
              Professional Residential &amp; Commercial {trade} Services
            </h5>
            <p className="text-[4.5px] sm:text-[5.5px] text-slate-500 truncate">
              Providing craftsmanship and dependable performance across {city}.
            </p>
          </div>
          <span
            className="shrink-0 rounded px-2 py-1 text-[5px] sm:text-[6px] font-bold text-white shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            GET A FREE QUOTE →
          </span>
        </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 3D Mockup Stage (4:5 Aspect Ratio matching reference image exactly) */}
      <div
        ref={mockupRef}
        className={`relative w-full max-w-[560px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${theme.gradient} select-none border border-white/20 flex flex-col justify-between p-6 sm:p-8`}
        style={{
          boxShadow: "0 35px 75px -15px rgba(15, 23, 42, 0.45), inset 0 1px 2px rgba(255,255,255,0.5)",
        }}
      >
        {/* Background Watermark Text Behind MacBook */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
          <span
            className="font-black text-6xl sm:text-8xl tracking-widest uppercase text-center max-w-full px-4 transform translate-y-36"
            style={{ color: theme.watermarkColor }}
          >
            {businessShortName}
          </span>
        </div>

        {/* Big 3D Headline at Top */}
        <div className="relative z-10 text-center pt-2 sm:pt-4">
          <h2
            className="text-3xl sm:text-5xl font-black tracking-wider text-white uppercase font-sans"
            style={{
              textShadow: "0 8px 24px rgba(24, 48, 77, 0.45), 0 2px 6px rgba(0,0,0,0.3)",
              letterSpacing: "0.05em",
            }}
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
            <span
              className="font-black text-7xl tracking-widest uppercase text-center max-w-full px-4 transform translate-y-48"
              style={{ color: theme.watermarkColor }}
            >
              {businessShortName}
            </span>
          </div>

          {/* Dynamic Top Header */}
          <div className="relative z-10 text-center pt-10">
            <h2
              className="text-4xl sm:text-5xl font-black tracking-wider text-white uppercase font-sans"
              style={{
                textShadow: "0 8px 24px rgba(24, 48, 77, 0.45), 0 2px 6px rgba(0,0,0,0.3)",
              }}
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
        <div className="w-full max-w-[560px] space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {/* 1. Headline Wording Switcher */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-indigo-600" /> Poster Headline Style
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                Match stage (Launched vs Proposed)
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
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold truncate">{h.line1}</span>
                  <span className="text-[10px] text-slate-500 block">{h.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Theme Background Switcher */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-indigo-600" /> Background Palette
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
                    themeId === t.id ? "ring-2 ring-indigo-600 scale-110 shadow-sm" : "hover:scale-105 opacity-80"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 4. High-Res Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
            <Button
              type="button"
              size="sm"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage("feed")}
              className="gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-sm"
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
              className="gap-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
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
              className="gap-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              {downloading === "transparent" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
              {downloading === "transparent" ? "Exporting..." : "After Effects (PNG)"}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            💡 <strong>1-Click High-Res PNG Export</strong> — matches the studio reference composition for Facebook, Instagram, and motion graphics.
          </p>
        </div>
      )}
    </div>
  );
}
