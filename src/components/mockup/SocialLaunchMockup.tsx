"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  Image as ImageIcon,
  Layers,
  Sliders,
  Sparkles,
  Monitor,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";

export type MockupHeadlineMode =
  | "launched" // "NEW WEBSITE LAUNCHED"
  | "proposed" // "REDESIGN CONCEPT"
  | "concept"  // "WEBSITE CONCEPT"
  | "upgrade"  // "HIGH PERFORMANCE"
  | "preview"  // "PRIVATE DESIGN"
  | "rebuild"; // "BRAND REBUILD"

export type MockupStageMode = "rock" | "poster";

export interface MockupData {
  businessName: string;
  tagline?: string | null;
  city?: string | null;
  trade?: string | null;
  brandColor?: string | null;
  accentColor?: string | null;
  onPrimaryColor?: string | null;
  invertSurface?: string | null;
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
  stageMode?: MockupStageMode;
  bespokeHtml?: string | null;
  bespokeCss?: string | null;
  heroCaptureUrl?: string | null;
  aboutCaptureUrl?: string | null;
  aboutImageUrl?: string | null;
}

export const HEADLINE_OPTIONS: { id: MockupHeadlineMode; line1: string; line2: string; tag: string }[] = [
  {
    id: "launched",
    line1: "NEW WEBSITE",
    line2: "LAUNCHED",
    tag: "Official Launch",
  },
  {
    id: "proposed",
    line1: "REDESIGN",
    line2: "CONCEPT",
    tag: "Proposal Stage",
  },
  {
    id: "concept",
    line1: "WEBSITE",
    line2: "CONCEPT",
    tag: "Concept Review",
  },
  {
    id: "upgrade",
    line1: "HIGH",
    line2: "PERFORMANCE",
    tag: "Authority Pitch",
  },
  {
    id: "preview",
    line1: "PRIVATE",
    line2: "DESIGN",
    tag: "VIP Teaser",
  },
  {
    id: "rebuild",
    line1: "BRAND",
    line2: "REBUILD",
    tag: "Brand Upgrade",
  },
];

export const BG_THEMES = [
  {
    id: "skyblue",
    name: "Sky Blue Studio (Custom Painting)",
    gradient: "from-[#8faec7] via-[#abc2d6] to-[#cfdde8]",
    bgStart: "#8faec7",
    bgMid: "#abc2d6",
    bgEnd: "#cfdde8",
    spotlight: "#ffffff",
    watermarkColor: "rgba(13, 23, 56, 0.08)",
    isDark: false,
  },
  {
    id: "sage",
    name: "Sage Forest Studio (NYC Renovation)",
    gradient: "from-[#2d4436] via-[#486352] to-[#6d8a77]",
    bgStart: "#2d4436",
    bgMid: "#486352",
    bgEnd: "#6d8a77",
    spotlight: "#a7f3d0",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "brand",
    name: "Brand Studio (Auto-Color)",
    gradient: "from-[#080d18] via-[#0f172a] to-[#1e293b]",
    bgStart: "#080d18",
    bgMid: "#0f172a",
    bgEnd: "#1e293b",
    spotlight: "rgba(255, 217, 116, 0.35)",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "emerald",
    name: "Emerald Glow (Roof Ninja / Maycon)",
    gradient: "from-[#051c14] via-[#093022] to-[#124e39]",
    bgStart: "#051c14",
    bgMid: "#093022",
    bgEnd: "#124e39",
    spotlight: "#10b981",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "cobalt",
    name: "Electric Blue (Silver Ridge / Nexgen)",
    gradient: "from-[#051329] via-[#0d2752] to-[#194080]",
    bgStart: "#051329",
    bgMid: "#0d2752",
    bgEnd: "#194080",
    spotlight: "#38bdf8",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "viking",
    name: "Crimson Viking (Viking Capital)",
    gradient: "from-[#220709] via-[#3d0d12] to-[#63141c]",
    bgStart: "#220709",
    bgMid: "#3d0d12",
    bgEnd: "#63141c",
    spotlight: "#ef4444",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "amber",
    name: "Sunset Amber (Highpoint / Better Built)",
    gradient: "from-[#260e04] via-[#481d09] to-[#78300f]",
    bgStart: "#260e04",
    bgMid: "#481d09",
    bgEnd: "#78300f",
    spotlight: "#f97316",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "gravity",
    name: "Purple Orbit (Gravity Roofing)",
    gradient: "from-[#170526] via-[#2c0b48] to-[#4c157a]",
    bgStart: "#170526",
    bgMid: "#2c0b48",
    bgEnd: "#4c157a",
    spotlight: "#a855f7",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "panther",
    name: "Midnight Slate (Panther / 3DV / 787)",
    gradient: "from-[#080a0f] via-[#10141d] to-[#1a202c]",
    bgStart: "#080a0f",
    bgMid: "#10141d",
    bgEnd: "#1a202c",
    spotlight: "#64748b",
    watermarkColor: "rgba(255, 255, 255, 0.08)",
    isDark: true,
  },
  {
    id: "minimal",
    name: "Studio Minimal Gray (New York Roofers)",
    gradient: "from-[#2b303c] via-[#474f5e] to-[#717b8f]",
    bgStart: "#2b303c",
    bgMid: "#474f5e",
    bgEnd: "#717b8f",
    spotlight: "#cbd5e1",
    watermarkColor: "rgba(255, 255, 255, 0.12)",
    isDark: true,
  },
];

function getContrastColor(hexColor?: string | null, fallbackDark = "#1e242d", fallbackLight = "#ffffff"): string {
  if (!hexColor) return fallbackDark;
  let hex = hexColor.replace("#", "").trim();
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return fallbackDark;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? fallbackDark : fallbackLight;
}

function unescapeText(str: string | null | undefined): string {
  if (!str) return "";
  let res = str;
  for (let i = 0; i < 3; i++) {
    const next = res
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&mdash;/gi, " ")
      .replace(/&ndash;/gi, " ")
      .replace(/&bull;/gi, " · ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&hellip;/gi, "...")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "-")
      .replace(/&#8212;/g, "--");
    if (next === res) break;
    res = next;
  }
  return res.replace(/^[–—•\-\s]+/, "").trim();
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function SocialLaunchMockup({
  data,
  className = "",
  showControls = true,
  onThemeChange,
  onHeadlineModeChange,
  onStageModeChange,
}: {
  data: MockupData;
  className?: string;
  showControls?: boolean;
  onThemeChange?: (themeId: string) => void;
  onHeadlineModeChange?: (mode: MockupHeadlineMode) => void;
  onStageModeChange?: (stage: MockupStageMode) => void;
}) {
  const [themeId, setThemeId] = useState<string>(data.themeId || "skyblue");
  const [headlineMode, setHeadlineMode] = useState<MockupHeadlineMode>(data.headlineMode || "launched");
  const [stageMode, setStageMode] = useState<MockupStageMode>(data.stageMode || "poster");
  const [downloading, setDownloading] = useState<string | null>(null);

  const mockupRef = useRef<HTMLDivElement>(null);
  const landscapeRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const transparentStageRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const landscapeScreenRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const feedScreenRef = useRef<HTMLDivElement>(null);
  const storyScreenRef = useRef<HTMLDivElement>(null);

  const [screenScale, setScreenScale] = useState(0.35);

  useEffect(() => {
    function updateScale() {
      if (screenRef.current) {
        const width = screenRef.current.clientWidth;
        setScreenScale(width / 1280);
      }
    }
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (screenRef.current) {
      observer.observe(screenRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (data.themeId && data.themeId !== themeId) {
      setThemeId(data.themeId);
    }
  }, [data.themeId, themeId]);

  useEffect(() => {
    if (data.headlineMode && data.headlineMode !== headlineMode) {
      setHeadlineMode(data.headlineMode);
    }
  }, [data.headlineMode, headlineMode]);

  const theme = BG_THEMES.find((t) => t.id === themeId) || BG_THEMES[0];

  // Core brand color tokens directly synchronized with the bespoke website
  const primaryColor = data.brandColor || "#1e40af";
  const onPrimaryColor = data.onPrimaryColor || getContrastColor(primaryColor, "#1e242d", "#ffffff");
  const isLightPrimary = onPrimaryColor !== "#ffffff";
  const invertSurface = data.invertSurface || "#0b0f19";

  const businessShortName = unescapeText(data.businessName || "Your Business");
  const city = data.city || "Orange County";
  const trade = data.trade || "Painting Contractor";
  const heroHeading = unescapeText(
    data.heroHeadline || `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`
  );
  const aboutEyebrow = unescapeText(
    data.aboutEyebrow || `ABOUT OUR LOCAL ${trade.toUpperCase()} COMPANY IN ${city.toUpperCase()}`
  );
  const aboutHeading = unescapeText(
    data.aboutHeadline || `About Our Local ${trade} Company In ${city}`
  );
  const aboutBody = unescapeText(
    data.aboutBody ||
    `When quality and craftsmanship matter, you need accountable local professionals who take pride in their work. Led by owner ${data.founderName || "our team"}, ${businessShortName} delivers premier results across ${city}.`
  );
  const ratingText = data.rating ? `${data.rating}★` : "4.9★";
  const reviewsCountText = data.reviewCount ? `${data.reviewCount}+` : "2,000+";
  const yearsExp = data.yearsExperience ? `${data.yearsExperience}+` : "2+";

  const activeHeadline = HEADLINE_OPTIONS.find((h) => h.id === headlineMode) || HEADLINE_OPTIONS[0];

  // Derive dynamic spotlight color for the theme
  const activeSpotlight = theme.id === "brand" ? primaryColor : theme.spotlight;

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

  async function downloadImage(format: "landscape" | "feed" | "story" | "transparent") {
    setDownloading(format);
    try {
      let targetEl: HTMLElement | null = null;

      if (format === "landscape") {
        targetEl = landscapeRef.current || mockupRef.current;
      } else if (format === "feed") {
        targetEl = feedRef.current || mockupRef.current;
      } else if (format === "story") {
        targetEl = storyRef.current;
      } else if (format === "transparent") {
        targetEl = transparentStageRef.current;
      }

      if (!targetEl) {
        throw new Error("Target export element not mounted.");
      }

      await prepareElementForExport(targetEl);

      const dataUrl = await toPng(targetEl, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: format === "transparent" ? "transparent" : undefined,
        filter: (node) => {
          if (node.tagName && node.tagName.toUpperCase() === "IFRAME") return false;
          return true;
        },
      });

      const cleanName = businessShortName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${cleanName}-${format}-mockup.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download mockup:", err);
    } finally {
      setDownloading(null);
    }
  }

  {/* Background Subtle Watermark & Circle Emblem */}
  const renderBackgroundWatermark = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 flex items-center justify-center">
      {/* Ghost Watermark Business Name in Lower Background */}
      <span
        className="absolute bottom-2 sm:bottom-4 left-6 text-6xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter opacity-[0.08] select-none"
        style={{
          color: theme.isDark ? "#ffffff" : "#0d1738",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {businessShortName}
      </span>
      {/* Subtle Circular Watermark Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full border border-white/5 opacity-30 pointer-events-none flex items-center justify-center">
        <div className="w-[85%] h-[85%] rounded-full border border-dashed border-white/10" />
      </div>
    </div>
  );

  const renderScreenContent = (customScale = screenScale, isExport = false) => {
    if (data.heroCaptureUrl) {
      return (
        <div className="relative w-full h-full overflow-hidden bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.heroCaptureUrl}
            alt="Hero Section Screenshot"
            className="w-full h-full object-cover object-top"
          />
          {/* Glass Glare Reflection Line */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none z-10" />
        </div>
      );
    }

    if (data.previewUrl && !isExport) {
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
              transform: `scale(${customScale})`,
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
          <span
            className="inline-block rounded px-1.5 py-0.5 text-[5px] sm:text-[6.5px] font-extrabold tracking-wider uppercase border"
            style={{
              backgroundColor: isLightPrimary ? "rgba(255,255,255,0.15)" : `${primaryColor}30`,
              borderColor: primaryColor,
              color: isLightPrimary ? primaryColor : "#ffffff",
            }}
          >
            SERVING {city.toUpperCase()}
          </span>
          <h3 className="text-[8px] sm:text-[10px] font-black leading-tight line-clamp-2 uppercase text-white drop-shadow">
            {heroHeading}
          </h3>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className="rounded px-2 py-0.5 text-[5.5px] sm:text-[7px] font-extrabold shadow"
              style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
            >
              GET A FREE QUOTE →
            </span>
            <span className="text-[5.5px] sm:text-[6.5px] font-bold text-amber-400">
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
          <span
            className="rounded px-1.5 py-0.5 text-[4.5px] sm:text-[5.5px] font-bold"
            style={{ backgroundColor: invertSurface, color: "#ffffff" }}
          >
            READ REVIEWS
          </span>
        </div>
      </div>
    );
  };

  {/* 3-Tier Layered 3D Floating Feature Blurb Card (Layered BEHIND the MacBook) */}
  const renderFloatingAboutCard = (opts?: {
    topOffset?: string;
    rightOffset?: string;
    widthClass?: string;
  }) => {
    const topClass = opts?.topOffset || "-top-12 sm:-top-16";
    const rightClass = opts?.rightOffset || "-right-1 sm:-right-2";
    const widthClass = opts?.widthClass || "w-[86%] max-w-[405px]";

    return (
      <div
        className={`absolute ${rightClass} ${topClass} ${widthClass} rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden transition-transform duration-500 z-0 select-none pointer-events-none`}
        style={{
          transform: "rotateY(-8deg) rotateX(5deg) rotateZ(-1.5deg) translateZ(-42px)",
          boxShadow: "0 35px 85px -15px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.35)",
        }}
      >
      {/* Dynamic Island Header Bar on Top of the Card */}
      <div className="w-full bg-slate-950 px-3 py-1.5 flex items-center justify-between border-b border-white/10 select-none">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 opacity-80" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 opacity-80" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-80" />
        </div>

        {/* Dynamic Island Pill with Live Pulse Dot */}
        <div className="h-3.5 sm:h-4 px-2 sm:px-2.5 rounded-full bg-black border border-white/20 shadow-inner flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-[5px] sm:text-[6px] font-extrabold tracking-wider uppercase text-white truncate max-w-[170px]">
            {businessShortName} · Verified Redesign
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-70">
          <span className="text-[5px] sm:text-[5.5px] text-white/90 font-mono font-bold">100%</span>
        </div>
      </div>

      {/* When an uploaded About capture screenshot is present, render it with crisp fidelity */}
      {data.aboutCaptureUrl ? (
        <div className="relative w-full aspect-[16/11] bg-slate-950 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.aboutCaptureUrl}
            alt={`${businessShortName} About Section Snapshot`}
            crossOrigin="anonymous"
            className="w-full h-full object-cover object-top"
          />
          {/* Subtle Glass Glare */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
        </div>
      ) : (
        <>
          {/* 3-Tier Layered Masterpiece About Card Synchronized to Website Colors */}
          <div className="p-3 sm:p-3.5 bg-white grid grid-cols-12 gap-2.5 items-start">
            {/* Left: Framed Photo of Founder / Team / Fleet with Bottom Name Badge Bar */}
            <div className="col-span-5 relative rounded-xl overflow-hidden shadow-md border border-slate-200 aspect-[4/4.8] bg-slate-900 flex flex-col justify-end">
              {data.aboutImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.aboutImageUrl}
                  alt={data.founderName || `${businessShortName} team`}
                  crossOrigin="anonymous"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-white text-[8px] font-black tracking-wider uppercase opacity-80">{businessShortName}</span>
                  <span className="text-[6px] font-bold uppercase mt-0.5" style={{ color: primaryColor }}>
                    Team &amp; Operations
                  </span>
                </div>
              )}
              {/* Bottom Founder & Leadership Name Badge Bar */}
              <div className="relative z-10 bg-slate-900/90 backdrop-blur-xs p-1.5 text-white flex items-center gap-1.5 border-t border-white/20">
                {data.logoUrl && (
                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block text-[6px] sm:text-[7.5px] font-black truncate leading-tight">
                    {data.founderName || "Local Leadership"}
                  </span>
                  <span className="block text-[4px] sm:text-[5px] font-medium text-slate-300 truncate">
                    {data.founderTitle || `Owner of ${businessShortName}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Story Eyebrow, Authoritative Title & Narrative */}
            <div className="col-span-7 space-y-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 border border-slate-200/80">
                <span className="text-[4.5px] sm:text-[5.5px] font-extrabold uppercase tracking-wider text-slate-800">
                  {aboutEyebrow}
                </span>
              </div>
              <h4 className="text-[8.5px] sm:text-[10.5px] font-black leading-tight text-slate-900 line-clamp-2">
                {aboutHeading}
              </h4>
              <p className="text-[5px] sm:text-[6px] text-slate-600 font-normal line-clamp-3 leading-relaxed">
                {aboutBody}
              </p>
              <div className="pt-0.5 flex items-center gap-1.5">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[4.5px] sm:text-[5.5px] font-extrabold shadow-xs"
                  style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                >
                  GET A FREE QUOTE →
                </span>
              </div>
            </div>
          </div>

          {/* ROW 2: FULL-WIDTH SOLID METRIC RIBBON BAND (4 STATS MATCHING WEBSITE BRAND COLOR) */}
          <div
            className="px-2 py-1.5 grid grid-cols-4 gap-0.5 text-center shadow-inner"
            style={{
              backgroundColor: primaryColor,
              color: onPrimaryColor,
              borderTop: isLightPrimary ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.2)",
              borderBottom: isLightPrimary ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div>
              <span className="block text-[7.5px] sm:text-[9.5px] font-black tracking-tight" style={{ color: onPrimaryColor }}>
                {yearsExp}
              </span>
              <span className="block text-[3.5px] sm:text-[4px] uppercase font-bold tracking-wider opacity-85" style={{ color: onPrimaryColor }}>
                Experience
              </span>
            </div>
            <div>
              <span className="block text-[7.5px] sm:text-[9.5px] font-black tracking-tight" style={{ color: onPrimaryColor }}>
                {reviewsCountText}
              </span>
              <span className="block text-[3.5px] sm:text-[4px] uppercase font-bold tracking-wider opacity-85" style={{ color: onPrimaryColor }}>
                Completed
              </span>
            </div>
            <div>
              <span className="block text-[7.5px] sm:text-[9.5px] font-black tracking-tight" style={{ color: onPrimaryColor }}>
                {ratingText}
              </span>
              <span className="block text-[3.5px] sm:text-[4px] uppercase font-bold tracking-wider opacity-85" style={{ color: onPrimaryColor }}>
                Avg Rating
              </span>
            </div>
            <div>
              <span className="block text-[7.5px] sm:text-[9.5px] font-black tracking-tight" style={{ color: onPrimaryColor }}>
                100%
              </span>
              <span className="block text-[3.5px] sm:text-[4px] uppercase font-bold tracking-wider opacity-85" style={{ color: onPrimaryColor }}>
                Guaranteed
              </span>
            </div>
          </div>

          {/* ROW 3: SECONDARY SERVICE / CRAFTSMANSHIP SNIPPET */}
          <div className="p-2 sm:p-2.5 bg-[#fafafc] flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h5 className="text-[6px] sm:text-[7.5px] font-black text-slate-900 leading-tight truncate">
                Professional Residential &amp; Commercial {trade} Services
              </h5>
              <p className="text-[4px] sm:text-[5px] text-slate-500 truncate">
                Dependable performance, direct insurance billing, and licensed experts across {city}.
              </p>
            </div>
            <span
              className="shrink-0 rounded px-2 py-0.5 text-[4.5px] sm:text-[5.5px] font-extrabold shadow-xs"
              style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
            >
              GET A FREE QUOTE →
            </span>
          </div>
        </>
      )}
    </div>
    );
  };

  {/* Integrated 3D MacBook Pro Resting on Organic Sculpted Slate Rock Pedestal */}
  const renderRockPedestalShowcase = (
    idPrefix = 'default',
    customScreenRef = screenRef,
    customScale = screenScale,
    containerClass = "w-[92%] max-w-[465px]",
    isExport = false,
    opts?: {
      cardTop?: string;
      cardRight?: string;
      widthClass?: string;
      macTranslateY?: string;
    }
  ) => (
    <div className={`relative flex flex-col items-center justify-center ${containerClass} mx-auto perspective-[1600px]`}>
      {/* 0. Layered Floating About Card Hovering BEHIND MacBook */}
      {renderFloatingAboutCard({
        topOffset: opts?.cardTop,
        rightOffset: opts?.cardRight,
        widthClass: opts?.widthClass,
      })}

      {/* 1. 3D MacBook Pro in Foreground */}
      <div
        className="relative z-20 w-full transition-transform duration-500"
        style={{
          transform: `rotateY(-12deg) rotateX(10deg) rotateZ(1.5deg) ${opts?.macTranslateY || "translateY(12px)"}`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Screen Bezel & Glass Lid */}
        <div className="relative rounded-t-2xl bg-[#0b0f17] p-2.5 sm:p-3 pb-4 sm:pb-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-white/25 ring-1 ring-black/90">
          {/* Top Center Camera Notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1.5 w-12 bg-black rounded-b-md z-20 flex items-center justify-center">
            <span className="h-0.5 w-0.5 rounded-full bg-[#334155]" />
          </div>

          {/* Screen Display Inner Frame */}
          <div
            ref={customScreenRef}
            className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/90 flex flex-col"
          >
            {renderScreenContent(customScale, isExport)}
          </div>
        </div>

        {/* Aluminum Laptop Base / Deck (Silver MacBook Pro) */}
        <div
          className="relative h-4 sm:h-5 w-[106%] -left-[3%] rounded-b-2xl bg-gradient-to-b from-[#f1f5f9] via-[#cbd5e1] to-[#94a3b8] shadow-2xl border-t border-white/95 flex items-center justify-between px-3 z-30"
          style={{
            transform: "rotateX(52deg) translateZ(-4px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 2px 4px rgba(255,255,255,0.8) inset",
          }}
        >
          <div className="flex items-center gap-1 opacity-70">
            <span className="h-1 w-1.5 rounded-xs bg-slate-600" />
            <span className="h-0.5 w-1 rounded-xs bg-slate-600" />
          </div>
          <div className="h-1 w-16 sm:w-28 bg-[#64748b] rounded-full mx-auto" />
          <div className="flex items-center gap-1 opacity-70">
            <span className="h-0.5 w-1 rounded-xs bg-slate-600" />
          </div>
        </div>
      </div>

      {/* 2. Sculpted Organic Mountain Slate Pedestal — Clean Bezels, Natural Ground Shadows */}
      <div className="relative z-10 -mt-3 sm:-mt-4 w-[116%] max-w-[620px] pointer-events-none">
        {/* Soft Ambient Contact Shadow Underneath Laptop Deck */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[86%] h-5 bg-black/75 blur-md rounded-full" />

        <svg
          viewBox="0 0 680 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.65)]"
        >
          <defs>
            {/* Slate Top Plateau Gradient */}
            <linearGradient id={`rockPlateau-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Rim Highlight */}
            <linearGradient id={`rockRim-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>

            {/* Main Chiseled Front Face */}
            <linearGradient id={`faceCenter-${idPrefix}`} x1="40%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#243044" />
              <stop offset="60%" stopColor="#141c2c" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            {/* Left Chiseled Shadow Facet */}
            <linearGradient id={`faceLeft-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Right Chiseled Shadow Facet */}
            <linearGradient id={`faceRight-${idPrefix}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#050811" />
            </linearGradient>
          </defs>

          {/* Under Base Contact Soft Blur */}
          <ellipse cx="340" cy="155" rx="260" ry="22" fill="#000000" opacity="0.5" filter="blur(8px)" />

          {/* Pedestal Bottom Base Facets */}
          <polygon
            points="60,65 140,140 540,140 620,65 570,38 110,38"
            fill={`url(#faceCenter-${idPrefix})`}
          />

          {/* Left Chiseled Slope */}
          <polygon points="60,65 140,140 250,148 220,68 110,38" fill={`url(#faceLeft-${idPrefix})`} opacity="0.9" />

          {/* Center Main Chiseled Facet */}
          <polygon points="220,68 250,148 440,148 460,68" fill={`url(#faceCenter-${idPrefix})`} />

          {/* Right Chiseled Slope */}
          <polygon points="460,68 440,148 540,140 620,65 570,38" fill={`url(#faceRight-${idPrefix})`} opacity="0.95" />

          {/* Top Rock Plateau (Clean Beveled Rim) */}
          <polygon
            points="110,38 240,24 440,24 570,38 620,65 530,76 150,76 60,65"
            fill={`url(#rockPlateau-${idPrefix})`}
            stroke={`url(#rockRim-${idPrefix})`}
            strokeWidth="1.75"
          />

          {/* Subtle Chiseled Ridge Lines */}
          <path d="M 220,68 L 250,148" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 460,68 L 440,148" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 330,75 L 345,145" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );

  const render3DMacBook = (customScreenRef = screenRef, customScale = screenScale, isExport = false) => (
    <div
      className="relative z-20 w-[92%] max-w-[475px] transition-transform duration-500"
      style={{
        transform: "rotateY(-16deg) rotateX(12deg) rotateZ(2deg) translateY(10px) translateZ(32px)",
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
          ref={customScreenRef}
          className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/90 flex flex-col"
        >
          {renderScreenContent(customScale, isExport)}
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
  );

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 3D Mockup Canvas (4:5 Feed Default View matching reference poster) */}
      <div
        ref={mockupRef}
        className={`relative w-full max-w-[560px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${theme.gradient} select-none border border-white/20 flex flex-col justify-between p-6 sm:p-7`}
        style={{
          boxShadow: "0 35px 75px -15px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
        }}
      >
        {/* Subtle Atmospheric Grid Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 select-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Brutalist Typographic Watermark */}
        {renderBackgroundWatermark()}

        {/* Ambient Radial Spotlight Halo Behind Mockup */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] sm:w-[540px] h-[320px] rounded-full blur-3xl pointer-events-none opacity-35"
          style={{
            background: `radial-gradient(circle, ${activeSpotlight} 0%, transparent 70%)`,
          }}
        />

        <div ref={transparentStageRef} className="w-full flex-1 flex flex-col items-center justify-between">
        {/* Top Centered 2-Line Bold Campaign Angle Typography */}
        <div className="relative z-10 text-center pt-1 sm:pt-2">
          <h2
            className="text-3xl sm:text-[44px] font-black tracking-tight uppercase font-sans leading-[0.93] text-white"
            style={{
              letterSpacing: "0.03em",
              textShadow: "0 2px 0 rgba(255,255,255,0.35), 0 6px 16px rgba(0, 0, 0, 0.75), 0 16px 36px rgba(0, 0, 0, 0.55)",
            }}
          >
            <span className="block drop-shadow-md">{activeHeadline.line1}</span>
            <span
              className="block drop-shadow-md"
              style={{
                color: headlineMode === "launched" ? "#ffffff" : isLightPrimary ? primaryColor : "#ffffff",
                textShadow:
                  isLightPrimary && headlineMode !== "launched"
                    ? `0 0 24px ${primaryColor}80, 0 6px 16px rgba(0, 0, 0, 0.75)`
                    : undefined,
              }}
            >
              {activeHeadline.line2}
            </span>
          </h2>
        </div>

        {/* 3D Composition Stage */}
        <div
          
          className="relative z-10 w-full flex-1 flex items-center justify-center mt-4 sm:mt-6 perspective-[1600px] translate-y-6 sm:translate-y-8"
        >
          {/* Dynamic 3D Studio Spotlight Glow Behind Laptop */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[480px] h-[280px] rounded-full blur-3xl pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(circle, ${activeSpotlight} 0%, transparent 70%)`,
            }}
          />

          {stageMode === "rock" ? (
            renderRockPedestalShowcase('preview', screenRef, screenScale, "w-[92%] max-w-[465px]", false, {
              cardTop: "-top-12 sm:-top-16",
              cardRight: "-right-1 sm:-right-2",
              macTranslateY: "translateY(12px)",
            })
          ) : (
            <>
              {/* Soft Ground Contact Shadow */}
              <div className="absolute bottom-1 sm:bottom-3 left-4 sm:left-8 right-4 sm:right-8 h-12 sm:h-16 bg-slate-950/70 blur-2xl rounded-full transform scale-x-115 -rotate-2" />
              {/* Layered Floating About Card Behind Laptop */}
              {renderFloatingAboutCard({ topOffset: "-top-12 sm:-top-16", rightOffset: "-right-1 sm:-right-2" })}
              {/* 3D MacBook Pro in Foreground */}
              {render3DMacBook()}
            </>
          )}
        </div>
      </div>
      </div>

      {/* Hidden 4:5 Feed HQ Container for Full-Bleed Social Feed Post Export (1080x1350) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={feedRef}
          className={`w-[1080px] h-[1350px] bg-gradient-to-b ${theme.gradient} pt-12 pb-8 px-12 flex flex-col justify-between items-center relative overflow-hidden`}
          style={{
            borderRadius: "0px",
          }}
        >
          {/* Background Watermark */}
          {renderBackgroundWatermark()}

          {/* Ambient Lighting */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[650px] rounded-full blur-3xl pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(circle, ${activeSpotlight} 0%, transparent 70%)`,
            }}
          />

          {/* Top Centered 2-Line Campaign Angle Typography */}
          <div className="relative z-10 text-center pt-2 mb-2">
            <h2
              className="text-5xl font-black tracking-tight uppercase font-sans leading-[0.95] text-white"
              style={{
                letterSpacing: "0.03em",
                textShadow: "0 3px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(0, 0, 0, 0.75), 0 20px 48px rgba(0, 0, 0, 0.55)",
              }}
            >
              <span className="block drop-shadow-md">{activeHeadline.line1}</span>
              <span
                className="block drop-shadow-md"
                style={{
                  color: headlineMode === "launched" ? "#ffffff" : isLightPrimary ? primaryColor : "#ffffff",
                  textShadow:
                    isLightPrimary && headlineMode !== "launched"
                      ? `0 0 28px ${primaryColor}80, 0 8px 24px rgba(0, 0, 0, 0.75)`
                      : undefined,
                }}
              >
                {activeHeadline.line2}
              </span>
            </h2>
          </div>

          {/* 3D Stage in Feed HQ */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center perspective-[1800px] mt-4 translate-y-12">
            {stageMode === "rock" ? (
              renderRockPedestalShowcase('feed', feedScreenRef, 0.65, "w-[840px]", true, {
                cardTop: "-top-16",
                cardRight: "-right-4",
                macTranslateY: "translateY(16px)",
              })
            ) : (
              <>
                <div className="absolute bottom-4 left-12 right-12 h-24 bg-slate-950/70 blur-3xl rounded-full transform scale-x-115 -rotate-2" />
                {renderFloatingAboutCard({ topOffset: "-top-16", rightOffset: "-right-4", widthClass: "w-[84%] max-w-[700px]" })}
                {render3DMacBook(feedScreenRef, 0.65, true)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden 16:9 Landscape Container for Widescreen Presentation Export (1280x720) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={landscapeRef}
          className={`w-[1280px] h-[720px] bg-gradient-to-b ${theme.gradient} pt-6 pb-4 px-8 flex flex-col justify-between items-center relative overflow-hidden`}
          style={{
            borderRadius: "0px",
          }}
        >
          {/* Background Watermark */}
          {renderBackgroundWatermark()}

          {/* Ambient Lighting */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] rounded-full blur-3xl pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(circle, ${activeSpotlight} 0%, transparent 70%)`,
            }}
          />

          {/* Centered Campaign Angle Headline in Landscape - Clean top placement with ample breathing room */}
          <div className="text-center z-20 mt-1 mb-2 max-w-4xl">
            <h2
              className="text-3xl font-black tracking-tight uppercase font-sans leading-none text-white"
              style={{
                letterSpacing: "0.04em",
                textShadow: "0 2px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(0, 0, 0, 0.75)",
              }}
            >
              <span className="inline-block text-white mr-3">{activeHeadline.line1}</span>
              <span
                className="inline-block"
                style={{
                  color: isLightPrimary ? primaryColor : "#ffffff",
                }}
              >
                {activeHeadline.line2}
              </span>
            </h2>
          </div>

          {/* 3D Stage in Landscape - Perfectly scaled to 500px width so Mac and Card never touch the top headline */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center perspective-[1800px] mt-1">
            {stageMode === "rock" ? (
              renderRockPedestalShowcase('landscape', landscapeScreenRef, 0.38, "w-[500px]", true, {
                cardTop: "-top-8",
                cardRight: "-right-2",
                macTranslateY: "translateY(16px)",
              })
            ) : (
              <>
                <div className="absolute bottom-2 left-8 right-8 h-14 bg-slate-950/70 blur-2xl rounded-full transform scale-x-115 -rotate-2" />
                {renderFloatingAboutCard({ topOffset: "-top-8", rightOffset: "-right-2", widthClass: "w-[80%] max-w-[360px]" })}
                {render3DMacBook(landscapeScreenRef, 0.38, true)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden 9:16 Story Container for Story/Reel Export */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={storyRef}
          className={`w-[540px] h-[960px] bg-gradient-to-b ${theme.gradient} p-8 flex flex-col justify-between items-center relative overflow-hidden`}
          style={{
            borderRadius: "0px",
          }}
        >
          {/* Background Watermark */}
          {renderBackgroundWatermark()}

          {/* Ambient Lighting */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full blur-3xl pointer-events-none opacity-35"
            style={{
              background: `radial-gradient(circle, ${activeSpotlight} 0%, transparent 70%)`,
            }}
          />

          {/* Dynamic Top Header */}
          <div className="relative z-20 w-full pt-8 text-center">
            <h2
              className="text-4xl font-black tracking-tight text-white uppercase font-sans leading-tight mt-4"
              style={{
                textShadow: "0 2px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(0, 0, 0, 0.75)",
              }}
            >
              <span className="block text-white">{activeHeadline.line1}</span>
              <span className="block" style={{ color: isLightPrimary ? primaryColor : "#ffffff" }}>
                {activeHeadline.line2}
              </span>
            </h2>
          </div>

          {/* 3D Stage */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center perspective-[1600px] mt-4 translate-y-12">
            {stageMode === "rock" ? (
              renderRockPedestalShowcase('story', storyScreenRef, 0.45, "w-[92%] max-w-[460px]", true, {
                cardTop: "-top-12",
                cardRight: "-right-2",
                macTranslateY: "translateY(12px)",
              })
            ) : (
              <>
                {renderFloatingAboutCard({ topOffset: "-top-12", rightOffset: "-right-2", widthClass: "w-[84%] max-w-[390px]" })}
                {render3DMacBook(storyScreenRef, 0.45, true)}
              </>
            )}
          </div>

          {/* Bottom Swipe Callout Card */}
          <div className="relative z-10 w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center mb-6">
            <span className="block text-xs font-black uppercase text-white tracking-wider">
              {businessShortName} · Tap to view live concept →
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      {showControls && (
        <div className="w-full max-w-[560px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
          {/* 1. Stage Mode Switcher (Rock Pedestal vs Clean Studio) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layout className="h-3.5 w-3.5 text-indigo-600" /> 3D Stage Composition
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {stageMode === "rock" ? "Rugged Mountain Slate Pedestal" : "Studio 3D Poster (Clean Ground)"}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStageMode("rock");
                  onStageModeChange?.("rock");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  stageMode === "rock"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Rock Pedestal Showcase
              </button>
              <button
                type="button"
                onClick={() => {
                  setStageMode("poster");
                  onStageModeChange?.("poster");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                  stageMode === "poster"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                Studio 3D Poster
              </button>
            </div>
          </div>

          {/* 2. Headline Hook Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-indigo-600" /> Campaign Angle
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {activeHeadline.tag}
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {HEADLINE_OPTIONS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setHeadlineMode(h.id);
                    onHeadlineModeChange?.(h.id);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-center border transition text-[11px] ${
                    headlineMode === h.id
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-bold truncate">{h.line1}</span>
                  <span className="text-[9px] text-slate-500 block truncate">{h.tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Theme Background Switcher */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-600" /> Lighting &amp; Studio Atmosphere
              </span>
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                {theme.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {BG_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setThemeId(t.id);
                    onThemeChange?.(t.id);
                  }}
                  className={`h-7 w-7 rounded-full shrink-0 border-2 transition transform ${
                    themeId === t.id
                      ? "scale-110 border-indigo-600 shadow-md ring-2 ring-indigo-200"
                      : "border-white hover:scale-105 shadow-xs"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.bgStart}, ${t.bgEnd})`,
                  }}
                  title={t.name}
                />
              ))}
            </div>
          </div>

          {/* 4. Action Export Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage("transparent")}
              className="gap-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
              {downloading === "transparent" ? "Exporting..." : "Transparent PNG"}
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(downloading)}
                onClick={() => downloadImage("story")}
                className="gap-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                {downloading === "story" ? "..." : "9:16 Story"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(downloading)}
                onClick={() => downloadImage("landscape")}
                className="gap-1 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                {downloading === "landscape" ? "..." : "16:9 Landscape"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={Boolean(downloading)}
                onClick={() => downloadImage("feed")}
                className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                {downloading === "feed" ? "Exporting..." : "4:5 Feed HQ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
