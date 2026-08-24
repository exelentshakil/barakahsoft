"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Zap,
  Target,
  BookOpen,
  Film,
  Palette,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SocialLaunchMockup,
  type MockupData,
  type MockupHeadlineMode,
} from "@/components/mockup/SocialLaunchMockup";
import type { Lead, Artifact } from "@/types/database";
import { extractMockupData } from "@/lib/mockup-data";
import type { SocialCaptionAngle, SocialContent } from "@/lib/social-content";

export function SocialMockupPanel({
  lead,
  artifact,
  facts,
}: {
  lead: Lead;
  artifact: Artifact | null;
  facts: Record<string, unknown> | null;
}) {
  const initialMockupData = useMemo(() => {
    return extractMockupData({
      lead,
      artifact,
      scrapeResults: null,
      facts,
      isPaid: Boolean(lead.paid_at) || lead.status === "paid" || lead.status === "live",
    });
  }, [lead, artifact, facts]);

  const [mockupData, setMockupData] = useState<MockupData>(initialMockupData);
  const [uploadingCapture, setUploadingCapture] = useState<"hero" | "about" | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const savedSocialContent = (((artifact?.extracted_assets as Record<string, unknown> | null)?.mockup as Record<string, unknown> | undefined)?.socialContent ?? null) as SocialContent | null;
  const savedSocialMotion = (((artifact?.extracted_assets as Record<string, unknown> | null)?.mockup as Record<string, unknown> | undefined)?.socialMotion ?? null) as { status?: string; videoUrl?: string; error?: string } | null;
  const [socialContent, setSocialContent] = useState<SocialContent | null>(savedSocialContent);
  const [socialMotion, setSocialMotion] = useState(savedSocialMotion);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [startingMotion, setStartingMotion] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  useEffect(() => {
    setMockupData(initialMockupData);
  }, [initialMockupData]);

  useEffect(() => {
    setSocialContent(savedSocialContent);
    setSocialMotion(savedSocialMotion);
  }, [artifact]);

  useEffect(() => {
    if (!socialMotion || !["starting", "generating"].includes(socialMotion.status || "")) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/leads/${lead.id}/social-motion`);
      const result = await res.json().catch(() => ({}));
      if (res.ok) setSocialMotion(result.motion);
    }, 5000);
    return () => clearInterval(timer);
  }, [lead.id, socialMotion?.status]);

  async function saveMockupConfig(update: {
    themeId?: string;
    headlineMode?: MockupHeadlineMode;
  }) {
    try {
      await fetch(`/api/leads/${lead.id}/mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    } catch (err) {
      console.error("[mockup] auto-save failed", err);
    }
  }

  function handleThemeChange(themeId: string) {
    setMockupData((prev) => ({
      ...prev,
      themeId,
    }));
    saveMockupConfig({ themeId });
  }

  function handleHeadlineModeChange(mode: MockupHeadlineMode) {
    setMockupData((prev) => ({
      ...prev,
      headlineMode: mode,
    }));
    saveMockupConfig({ headlineMode: mode });
  }

  async function handleCaptureUpload(slot: "hero" | "about", file: File | undefined) {
    if (!file) return;
    setUploadingCapture(slot);
    setCaptureError(null);
    try {
      const form = new FormData();
      form.set("slot", slot);
      form.set("file", file);
      const res = await fetch(`/api/leads/${lead.id}/mockup`, { method: "POST", body: form });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Could not upload capture");
      const key = slot === "hero" ? "heroCaptureUrl" : "aboutCaptureUrl";
      setMockupData((prev) => ({ ...prev, [key]: result.mockup?.[key] }));
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : "Could not upload capture");
    } finally {
      setUploadingCapture(null);
    }
  }

  async function handleClearCapture(slot: "hero" | "about") {
    const key = slot === "hero" ? "heroCaptureUrl" : "aboutCaptureUrl";
    try {
      await fetch(`/api/leads/${lead.id}/mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: null }),
      });
      setMockupData((prev) => ({ ...prev, [key]: null }));
    } catch (err) {
      console.error("Failed to clear capture", err);
    }
  }

  const businessName = mockupData.businessName;
  const city = mockupData.city || "the local area";
  const trade = mockupData.trade || "Home Services";
  const brandColorHex = mockupData.brandColor || "#1b4d3e";

  // Panel View Tabs: Captions | Motion Guidelines | Moodboard
  const [activeTab, setActiveTab] = useState<"caption" | "motion" | "moodboard">("caption");

  // -------------------------------------------------------------
  // Meta Andromeda-Compliant Caption Engine
  // -------------------------------------------------------------
  const [captionStyle, setCaptionStyle] = useState<SocialCaptionAngle>("redesign_proposed");
  const [copied, setCopied] = useState(false);
  const [copiedMotion, setCopiedMotion] = useState(false);
  const [customCaption, setCustomCaption] = useState<string>("");

  const generatedCaptions = socialContent?.captions;
  const activeCaption = customCaption || generatedCaptions?.[captionStyle] || "Generate a fact-grounded content kit to create captions for this lead.";
  const motionScriptPrompt = socialContent
    ? `${socialContent.motion.title}\n\nCREATIVE DIRECTION\n${socialContent.motion.creativeDirection}\n\nVOICEOVER\n${socialContent.motion.voiceover}\n\nEDITOR BRIEF\n${socialContent.motion.editorBrief}\n\nVEO PROMPT\n${socialContent.motion.veoPrompt}`
    : "Generate the content kit to create a lead-specific motion brief, voiceover and Veo prompt.";

  async function handleGenerateSocial() {
    setGeneratingSocial(true);
    setSocialError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/social-content`, { method: "POST" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.content) throw new Error(result.error || "Could not generate social content");
      setSocialContent(result.content);
      setSocialMotion({ status: "needs-generation" });
      setCustomCaption("");
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "Could not generate social content");
    } finally {
      setGeneratingSocial(false);
    }
  }

  async function handleGenerateMotion() {
    setStartingMotion(true);
    setSocialError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/social-motion`, { method: "POST" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Could not start motion generation");
      setSocialMotion(result.motion || { status: "starting" });
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : "Could not start motion generation");
    } finally {
      setStartingMotion(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(activeCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleCopyMotion() {
    navigator.clipboard.writeText(motionScriptPrompt);
    setCopiedMotion(true);
    setTimeout(() => setCopiedMotion(false), 2500);
  }

  function handleStyleChange(style: SocialCaptionAngle) {
    setCaptionStyle(style);
    setCustomCaption(generatedCaptions?.[style] || "");
  }

  return (
    <Card className="border border-border bg-white shadow-sm overflow-hidden">
      <CardContent className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Share2 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Social Media Launch Studio (3D Poster & Motion Kit)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
              High-converting 3D perspective mockup asset + AI-generated Facebook/Instagram captions engineered for Meta&apos;s Andromeda algorithm + Motion Design storyboard.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateSocial}
            disabled={generatingSocial}
            className="gap-1.5 bg-[#533afd] text-xs font-bold text-white hover:bg-[#432bd9]"
          >
            {generatingSocial ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generatingSocial ? "Gemini is directing..." : socialContent ? "Regenerate content kit" : "Generate content kit"}
          </Button>
        </div>
        {socialError && <p className="rounded-lg bg-red-50 p-3 text-[11px] font-medium text-red-700">{socialError}</p>}

        <div className="rounded-xl border border-[#c7d0fb] bg-[#fbfaff] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#0d1738]">Exact website captures</h4>
              <p className="mt-0.5 max-w-xl text-[11px] text-muted-foreground">
                Upload clean desktop screenshots from the preview. Hero should include the menu; About should contain only the full About section. These exact images sync to the client portal and exported poster.
              </p>
            </div>
            <a
              href={`/s/${lead.slug}?view=preview`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-[#533afd] hover:underline"
            >
              Open clean preview
            </a>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["hero", "about"] as const).map((slot) => {
              const hasCapture = slot === "hero" ? mockupData.heroCaptureUrl : mockupData.aboutCaptureUrl;
              return (
                <div key={slot} className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
                  <div className="min-w-0 pr-2">
                    <span className="block text-xs font-bold capitalize text-[#0d1738]">{slot} snapshot</span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {hasCapture ? "Custom capture active" : "Using native 3D vector"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasCapture && (
                      <button
                        type="button"
                        onClick={() => handleClearCapture(slot)}
                        className="text-[10px] font-semibold text-rose-600 hover:underline"
                        title="Revert to crisp vector rendering"
                      >
                        Clear
                      </button>
                    )}
                    <label className="flex cursor-pointer items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-[#533afd] hover:bg-indigo-50">
                      {uploadingCapture === slot ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      <span>{hasCapture ? "Replace" : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={Boolean(uploadingCapture)}
                        onChange={(event) => handleCaptureUpload(slot, event.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          {captureError && <p className="mt-2 text-[11px] font-medium text-red-700">{captureError}</p>}
        </div>

        {/* 3D Mockup Visual Stage */}
        <div className="flex justify-center">
          <SocialLaunchMockup
            data={mockupData}
            showControls={true}
            onThemeChange={handleThemeChange}
            onHeadlineModeChange={handleHeadlineModeChange}
          />
        </div>

        {/* Studio Content Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("caption")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "caption"
                  ? "bg-[#533afd] text-white shadow-sm"
                  : "text-[#42506a] hover:bg-[#f0f3ff] hover:text-[#533afd]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Meta Andromeda Captions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("motion")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "motion"
                  ? "bg-[#533afd] text-white shadow-sm"
                  : "text-[#42506a] hover:bg-[#f0f3ff] hover:text-[#533afd]"
              }`}
            >
              <Film className="h-3.5 w-3.5" /> Motion Design Storyboard (AE)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("moodboard")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "moodboard"
                  ? "bg-[#533afd] text-white shadow-sm"
                  : "text-[#42506a] hover:bg-[#f0f3ff] hover:text-[#533afd]"
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> Moodboard & Style Guide
            </button>
          </div>

          {/* TAB 1: Meta Andromeda Captions */}
          {activeTab === "caption" && (
            <div className="rounded-2xl border border-[#c7d0fb] bg-[#f9f9ff] p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c7d0fb]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#533afd] text-white shadow-sm">
                    <Zap className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#0d1738]">Fact-grounded Meta content</h4>
                    <p className="text-[11px] text-muted-foreground">Gemini 3.1 Pro writes each angle from the lead&apos;s real facts and current project stage</p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!socialContent}
                  className={`gap-1.5 font-bold text-xs shadow-sm transition ${
                    copied ? "bg-[#0b8f5b] text-white hover:bg-[#0b8f5b]" : "bg-[#533afd] text-white hover:bg-[#432bd9]"
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied to Clipboard! ✓" : "Copy Caption"}
                </Button>
              </div>

              {/* Style Selector Tabs (5 Andromeda-Optimized Angles) */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStyleChange("redesign_proposed")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    captionStyle === "redesign_proposed"
                      ? "bg-[#533afd] text-white shadow-sm"
                      : "bg-white text-[#42506a] border border-border hover:bg-[#f0f3ff]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Concept / Proposed Redesign
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange("concept_teaser")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    captionStyle === "concept_teaser"
                      ? "bg-[#533afd] text-white shadow-sm"
                      : "bg-white text-[#42506a] border border-border hover:bg-[#f0f3ff]"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" /> Sneak Peek Teaser
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange("transformation")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    captionStyle === "transformation"
                      ? "bg-[#533afd] text-white shadow-sm"
                      : "bg-white text-[#42506a] border border-border hover:bg-[#f0f3ff]"
                  }`}
                >
                  <Target className="h-3.5 w-3.5" /> Transformation Case Study
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange("authority")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    captionStyle === "authority"
                      ? "bg-[#533afd] text-white shadow-sm"
                      : "bg-white text-[#42506a] border border-border hover:bg-[#f0f3ff]"
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5" /> Design Authority
                </button>

                <button
                  type="button"
                  onClick={() => handleStyleChange("contrarian")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    captionStyle === "contrarian"
                      ? "bg-[#533afd] text-white shadow-sm"
                      : "bg-white text-[#42506a] border border-border hover:bg-[#f0f3ff]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" /> Contrarian Design View
                </button>
              </div>

              {/* Editable Caption Box */}
              <div className="relative">
                <Textarea
                  rows={11}
                  value={activeCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  className="bg-white font-mono text-xs leading-relaxed text-[#0d1738] border-border shadow-inner p-4 rounded-xl"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {activeCaption.length} characters · {activeCaption.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCaption("");
                      setCaptionStyle("transformation");
                    }}
                    className="text-[#533afd] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Reset to default
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Motion Design Guidelines & After Effects Storyboard */}
          {activeTab === "motion" && (
            <div className="rounded-2xl border border-border bg-[#fbfbfd] p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0d1738] text-white shadow-sm">
                    <Film className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#0d1738]">Motion film and voiceover direction</h4>
                    <p className="text-[11px] text-muted-foreground">A lead-specific storyboard unifying the exact captures, moodboard, native audio and final CTA</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyMotion}
                    disabled={!socialContent}
                    className="gap-1.5 text-xs font-bold"
                  >
                    {copiedMotion ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedMotion ? "Copied" : "Copy editor brief"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateMotion}
                    disabled={!socialContent || startingMotion || ["starting", "generating"].includes(socialMotion?.status || "")}
                    className="gap-1.5 bg-[#0d1738] text-xs font-bold text-white hover:bg-[#1b2a5c]"
                  >
                    {(startingMotion || ["starting", "generating"].includes(socialMotion?.status || "")) ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
                    {["starting", "generating"].includes(socialMotion?.status || "") ? "Veo generating..." : socialMotion?.videoUrl ? "Regenerate video" : "Generate video + voiceover"}
                  </Button>
                </div>
              </div>

              {socialMotion?.error && <p className="rounded-lg bg-red-50 p-3 text-[11px] font-medium text-red-700">{socialMotion.error}</p>}
              {socialMotion?.videoUrl && (
                <div className="rounded-xl border border-border bg-[#0d1738] p-3">
                  <video src={socialMotion.videoUrl} controls playsInline className="mx-auto max-h-[520px] rounded-lg" />
                  <a href={socialMotion.videoUrl} download className="mt-2 block text-center text-xs font-bold text-white hover:underline">Download vertical MP4 with native voiceover</a>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-white p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd]">Creative direction</span>
                  <p className="mt-2 text-xs leading-relaxed text-[#42506a]">{socialContent?.motion.creativeDirection || "Generate the content kit to create this direction."}</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd]">Voiceover script</span>
                  <p className="mt-2 text-xs leading-relaxed text-[#0d1738]">{socialContent?.motion.voiceover || "The factual voiceover will appear here."}</p>
                </div>
              </div>

              {/* Copyable Motion Prompt for Editors */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Full After Effects Brief (Ready for Video Editors / AI Prompting)
                </span>
                <Textarea
                  readOnly
                  rows={8}
                  value={motionScriptPrompt}
                  className="bg-white font-mono text-[11px] leading-relaxed text-[#0d1738] border-border p-3 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Visual Moodboard & Brand Style Guide */}
          {activeTab === "moodboard" && (
            <div className="rounded-2xl border border-border bg-[#fbfbfd] p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#533afd] text-white shadow-sm">
                  <Palette className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#0d1738]">Visual Moodboard & Creative Aesthetic</h4>
                  <p className="text-[11px] text-muted-foreground">Gemini-directed visual system tailored to {businessName} and the motion film</p>
                </div>
              </div>

              {/* Palette swatches */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Color Palette Hierarchy</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {(socialContent?.moodboard.palette || [brandColorHex]).map((color, index) => (
                    <div key={`${color}-${index}`} className="rounded-xl border border-border bg-white p-3 space-y-2">
                      <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: color }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aesthetic Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">Art direction</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {socialContent?.moodboard.artDirection || "Generate the content kit to establish a lead-specific art direction."}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">Lighting and texture</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {socialContent ? `${socialContent.moodboard.lighting} ${socialContent.moodboard.texture}` : "Lighting and texture direction will appear here."}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">Typography</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {socialContent?.moodboard.typography || "Typography direction will appear here."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
