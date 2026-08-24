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
  Clock,
  Volume2,
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
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingCapture, setUploadingCapture] = useState<"hero" | "about" | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    setMockupData(initialMockupData);
  }, [initialMockupData]);

  async function saveMockupConfig(update: {
    themeId?: string;
    headlineMode?: MockupHeadlineMode;
    featuredPhotoUrl?: string;
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

  function handleSelectPhoto(url: string) {
    setMockupData((prev) => ({
      ...prev,
      photoUrl: url,
    }));
    saveMockupConfig({ featuredPhotoUrl: url });
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

  async function handleGenerateAvatar() {
    setGeneratingAvatar(true);
    setAvatarError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not generate owner portrait");
      }
      setMockupData((prev) => ({
        ...prev,
        photoUrl: data.url,
        availablePhotos: [data.url, ...(prev.availablePhotos || [])],
      }));
      saveMockupConfig({ featuredPhotoUrl: data.url });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGeneratingAvatar(false);
    }
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

  const businessName = mockupData.businessName;
  const city = mockupData.city || "New York";
  const trade = mockupData.trade || "Home Services";
  const brandColorHex = mockupData.brandColor || "#1b4d3e";
  const reviewCount = mockupData.reviewCount || 100;

  // Panel View Tabs: Captions | Motion Guidelines | Moodboard
  const [activeTab, setActiveTab] = useState<"caption" | "motion" | "moodboard">("caption");

  // -------------------------------------------------------------
  // Meta Andromeda-Compliant Caption Engine
  // -------------------------------------------------------------
  const [captionStyle, setCaptionStyle] = useState<"redesign_proposed" | "concept_teaser" | "transformation" | "authority" | "contrarian">("redesign_proposed");
  const [copied, setCopied] = useState(false);
  const [copiedMotion, setCopiedMotion] = useState(false);
  const [customCaption, setCustomCaption] = useState<string>("");

  const generatedCaptions = useMemo(() => {
    const cleanTrade = trade.toLowerCase();
    const tradeHashtag = trade.replace(/[^a-zA-Z0-9]/g, "");
    const cityHashtag = city.replace(/[^a-zA-Z0-9]/g, "");

    return {
      redesign_proposed: `Here is a custom website concept we just designed for ${businessName} in ${city} ⚡

When local homeowners in ${city} search for a trusted ${cleanTrade}, they judge your quality in under 3 seconds.

We took their real-world 5-star reputation and built a bespoke, high-converting digital storefront around it:

• 🚀 Sub-second mobile load time
• ⭐ Prominent Google Reviews & verified warranty proof
• 📍 Suburb-by-suburb service routing across ${city}
• 📞 1-tap estimate funnel engineered for mobile callers

Take a look at the 3D redesign concept above.

Should they make this live? Drop your thoughts below 👇

(If you run a local ${cleanTrade} company and want to see what your site could look like, comment "PREVIEW" or DM us for a free redesign concept).

#${tradeHashtag} #${cityHashtag} #WebDesign #HomeServices #RedesignConcept #BarakahSoft`,

      concept_teaser: `Sneak peek at a new website proposal for ${businessName} 👀

Most ${cleanTrade} websites in ${city} lose 60%+ of their visitors because of slow loading speeds, cluttered menus, and hidden phone numbers.

This concept was engineered from the ground up to do one thing: turn local traffic into booked high-ticket estimates.

Highlights:
✅ Modern mobile-first architecture
✅ Instant pricing & guarantee trust signals
✅ Built specifically for ${city} local search intent

Would you hire a ${cleanTrade} with a website like this? 

Comment "CONCEPT" below if you want us to put together a private redesign for your business.

#LocalBusiness #${tradeHashtag} #${cityHashtag}Business #UIUX #BarakahSoft`,

      transformation: `Most local ${cleanTrade} companies don't have a lead problem.

They have a trust leak. 🛑

When someone in ${city} searches for "${cleanTrade} near me", they click 2–3 websites. 
If your site takes 4+ seconds to load, looks outdated on a phone, or buries your phone number... they bounce straight to your competitor.

Here is the brand new digital storefront we just designed & proposed for ${businessName} in ${city}:

⚡ Sub-second mobile loading speed (zero bounce rate)
⭐ 5-star Google review & verified reputation integration
📍 Dedicated neighbourhood routes across ${city}
📱 One-tap instant quote booking engineered for mobile callers

The result? Visitors immediately recognize them as the #1 category leader before even picking up the phone.

Drop a comment below with "SITE" or send us a DM if you want a free custom redesign concept for your trade business. 🚀

.
.
#${tradeHashtag} #${cityHashtag}Business #LocalSEO #WebDesign #HomeServices #BarakahSoft`,

      authority: `🚨 NEW WEBSITE LAUNCH: ${businessName} (${city}) 🚨

${businessName} already had the craftsmanship and ${reviewCount > 0 ? `${reviewCount}+ 5-star customer reviews` : "an outstanding reputation"} to back it up.

What they needed was a high-converting digital storefront that matched their real-world caliber.

Here’s what we engineered into their new build:
✅ Custom modern design built specifically for high-ticket ${cleanTrade} jobs
✅ Crystal-clear pricing transparency & trust signals
✅ Fast-loading mobile architecture built on Next.js
✅ Local search visibility optimized to dominate ${city}

When quality craftsmanship meets conversion-first design, you stop competing on price and start winning the best jobs in town.

Want to see what your business would look like with a modern makeover? 
👉 Comment "PREVIEW" or DM us your website URL for a complimentary redesign concept.

#WebDesign #${tradeHashtag} #BusinessGrowth #${cityHashtag} #BarakahSoft`,

      contrarian: `Stop spending money on Facebook ads or Google LSA if your website looks like it was built in 2014. 📉

Here is what actually happens:
You pay $40–$100 for a local homeowner to click your ad.
They land on a slow, cluttered site with unclickable phone numbers.
They get confused, hit "Back", and call the next business on Google Maps.

Fix the bucket before pouring in more water. 🪣

We just rebuilt the complete web presence for ${businessName} in ${city}.
Everything is built around one single metric: turning high-intent local visitors into booked estimates.

Take a look at the live concept mockup above 👆

If you run a local ${cleanTrade} or home service company and want to fix your conversion leaks, comment "AUDIT" below and we'll send you a private speed & website breakdown.

#ConversionRate #DigitalMarketing #${tradeHashtag} #${cityHashtag}WebDesign #BarakahSoft`,
    };
  }, [businessName, city, trade, reviewCount]);

  const activeCaption = customCaption || generatedCaptions[captionStyle];

  const motionScriptPrompt = useMemo(() => {
    return `=== AFTER EFFECTS / PREMIERE MOTION DESIGN BRIEF ===
Project: 3D Website Launch Reel for ${businessName} (${trade} in ${city})
Format: 1080x1920 (9:16 Reel/Story) & 1080x1350 (4:5 Feed)
Frame Rate: 60 FPS
Duration: 6.0 Seconds (Seamless Loop)

--- 1. TIMELINE & KEYFRAME STORYBOARD ---
• 0.0s – 1.2s (Hook & 3D Parallax Entry):
  - 3D Camera zoom-in from Scale 112% -> 100% with easing (easeOutQuart).
  - Background gradient subtle pulse.
  - Headline "NEW WEBSITE LAUNCHED" punches in with subtle kinetic drop-shadow blur (0 -> 18px).
  - Floating Card enters with slight Y-axis offset (+30px -> 0px) and Z-axis rotation (-4° -> -2°).

• 1.2s – 2.8s (UI Highlight & Feature Shine):
  - Linear light sweep / glass reflection shines diagonally across the MacBook screen.
  - "Verified 5.0★ Google Reviews" badge on the floating sheet pops up with slight overshoot bounce (Scale 95% -> 105% -> 100%).
  - Subtle floating card levitation loop using After Effects expression: transform.position + [0, Math.sin(time*3)*8].

• 2.8s – 4.5s (Trust Numbers Counter & Focus):
  - Trust metrics (100+ Reviews, 1-Year Warranty, 100% Guaranteed) illuminate sequentially with a 0.1s stagger.
  - Floating card tilts gently to show 3D depth and shadow separation.

• 4.5s – 6.0s (CTA & Seamless Loop):
  - "Comment 'SITE' or DM for Free Concept" banner pulses at bottom with smooth glow.
  - Camera glides back to original position to create a seamless infinite loop.

--- 2. SOUND DESIGN / SFX CUES ---
• 0.0s: Crisp cinematic whoosh + subtle low-end impact.
• 1.4s: Clean metallic UI chime / shimmer effect across screen.
• 4.8s: Satisfying Shopify-style double cash chime on CTA prompt.

--- 3. COLOR & ASSET ASSETS ---
• Primary Brand Hex: ${brandColorHex}
• Accent Highlight: #10B981 (Emerald) / #F59E0B (Amber Gold)
• Base Metals: Dark Titanium Aluminum (#1A1A1A & #C5C8CF)
• Font: Bold Modern Geometric Sans-Serif (SF Pro Display / Montserrat / Inter Black)`;
  }, [businessName, trade, city, brandColorHex]);

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

  function handleStyleChange(style: "redesign_proposed" | "concept_teaser" | "transformation" | "authority" | "contrarian") {
    setCaptionStyle(style);
    setCustomCaption(generatedCaptions[style]);
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
          <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-[11px] font-bold text-[#533afd] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Ready to Post
          </span>
        </div>

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
                <label key={slot} className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-white px-3 py-2 hover:border-[#533afd]">
                  <span>
                    <span className="block text-xs font-bold capitalize text-[#0d1738]">{slot} capture</span>
                    <span className="block text-[10px] text-muted-foreground">{hasCapture ? "Uploaded, choose another to replace" : "PNG, JPG or WebP up to 12 MB"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#533afd]">
                    {uploadingCapture === slot ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {hasCapture ? "Replace" : "Upload"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={Boolean(uploadingCapture)}
                    onChange={(event) => handleCaptureUpload(slot, event.target.files?.[0])}
                  />
                </label>
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
            onSelectPhoto={handleSelectPhoto}
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
                    <h4 className="text-sm font-bold text-[#0d1738]">Meta Andromeda Caption Generator</h4>
                    <p className="text-[11px] text-muted-foreground">Engineered for high dwell-time hooks & comment-trigger CTAs</p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
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
                  <Share2 className="h-3.5 w-3.5" /> Official Launch
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
                  <BookOpen className="h-3.5 w-3.5" /> Contrarian / Ad Fix
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
                    <h4 className="text-sm font-bold text-[#0d1738]">After Effects & Reel Motion Guidelines</h4>
                    <p className="text-[11px] text-muted-foreground">Step-by-step keyframes, camera motions & sound cues for 60 FPS viral reels</p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyMotion}
                  className={`gap-1.5 font-bold text-xs shadow-sm transition ${
                    copiedMotion ? "bg-[#0b8f5b] text-white hover:bg-[#0b8f5b]" : "bg-[#0d1738] text-white hover:bg-[#1b2a5c]"
                  }`}
                >
                  {copiedMotion ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedMotion ? "Motion Brief Copied! ✓" : "Copy AE Prompt / Brief"}
                </Button>
              </div>

              {/* Storyboard Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between text-[#533afd] font-bold">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 0.0s – 1.5s</span>
                    <span className="rounded bg-[#f0f3ff] px-1.5 py-0.5 text-[10px]">Hook Entry</span>
                  </div>
                  <h5 className="font-bold text-[#0d1738]">3D Camera Push & Title Punch</h5>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Camera glides forward (112% → 100%). Title &apos;NEW WEBSITE LAUNCHED&apos; drops with kinetic impact blur. Floating sheet enters on Y-axis with <code>easeOutQuart</code>.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between text-[#533afd] font-bold">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 1.5s – 3.8s</span>
                    <span className="rounded bg-[#f0f3ff] px-1.5 py-0.5 text-[10px]">Feature Spotlight</span>
                  </div>
                  <h5 className="font-bold text-[#0d1738]">Glass Shimmer & Metric Pops</h5>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Diagonal light sweep wipes across MacBook screen. 5.0★ Google Reviews & Guarantee badges bounce in with micro-overshoot. Floating sheet floats on continuous sine wave.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between text-[#533afd] font-bold">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 3.8s – 6.0s</span>
                    <span className="rounded bg-[#f0f3ff] px-1.5 py-0.5 text-[10px]">CTA Loop</span>
                  </div>
                  <h5 className="font-bold text-[#0d1738]">Comment Trigger & Loop Return</h5>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Bottom prompt pulses: &apos;Comment SITE for your free concept&apos;. Layer angles reset smoothly to frame 0 for an infinite, seamless loop.
                  </p>
                </div>
              </div>

              {/* Sound Design Blueprint */}
              <div className="rounded-xl border border-[#e5e7f2] bg-white p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#533afd] flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" /> Sound Design / SFX Cue List
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <strong className="text-[#0d1738] block">0.0s: Low Riser + Whoosh</strong>
                    <span className="text-muted-foreground">Deep cinematic bass drop on camera push</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <strong className="text-[#0d1738] block">1.5s: Mechanical UI Tick</strong>
                    <span className="text-muted-foreground">Crisp shimmer as screen light sweeps</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <strong className="text-[#0d1738] block">4.8s: Double Order Chime</strong>
                    <span className="text-muted-foreground">Shopify-style high harmonic cash chime</span>
                  </div>
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
                  <p className="text-[11px] text-muted-foreground">High-end Apple-grade product photography aesthetic tailored to {businessName}</p>
                </div>
              </div>

              {/* Palette swatches */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Color Palette Hierarchy</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-border bg-white p-3 space-y-2">
                    <div className="h-12 rounded-lg shadow-inner" style={{ backgroundColor: brandColorHex }} />
                    <div>
                      <strong className="block text-[#0d1738]">Primary Brand</strong>
                      <span className="font-mono text-[10px] text-muted-foreground">{brandColorHex}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-3 space-y-2">
                    <div className="h-12 rounded-lg shadow-inner bg-[#10B981]" />
                    <div>
                      <strong className="block text-[#0d1738]">Verified Emerald</strong>
                      <span className="font-mono text-[10px] text-muted-foreground">#10B981</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-3 space-y-2">
                    <div className="h-12 rounded-lg shadow-inner bg-[#1A1A1A]" />
                    <div>
                      <strong className="block text-[#0d1738]">Titanium Slate</strong>
                      <span className="font-mono text-[10px] text-muted-foreground">#1A1A1A</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-white p-3 space-y-2">
                    <div className="h-12 rounded-lg shadow-inner bg-[#F59E0B]" />
                    <div>
                      <strong className="block text-[#0d1738]">Rating Gold</strong>
                      <span className="font-mono text-[10px] text-muted-foreground">#F59E0B</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aesthetic Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">1. Studio Lighting</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Soft top-left directional key light (45° angle) with deep diffused contact shadows underneath the aluminum chassis.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">2. 3D Depth Layering</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Background watermark + Angled MacBook (-18° Y) + Hovering floating card (+40px Z-depth) creates high perceived value.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 space-y-1">
                  <strong className="text-[#0d1738] block font-bold">3. Typography Power</strong>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Ultra-bold condensed uppercase sans-serif headers paired with clean tabular numbers to instantly convey authority.
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
