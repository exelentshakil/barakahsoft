"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, Share2, Copy, Check, RefreshCw, MessageSquare, Zap, Target, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SocialLaunchMockup, type MockupData } from "@/components/mockup/SocialLaunchMockup";
import type { Lead, Artifact } from "@/types/database";

export function SocialMockupPanel({
  lead,
  artifact,
  facts,
}: {
  lead: Lead;
  artifact: Artifact | null;
  facts: Record<string, unknown> | null;
}) {
  const extracted = (artifact?.extracted_assets as Record<string, unknown> | null) ?? {};
  const photos = (facts?.site_photos as { url?: string }[] | undefined) ?? [];
  const gbpPhotos = (facts?.gbp_photo_urls as string[] | undefined) ?? [];

  const photoUrl =
    gbpPhotos[0] ||
    photos[0]?.url ||
    (extracted?.hero_image_url as string) ||
    null;

  const secondaryPhotoUrl =
    gbpPhotos[1] ||
    photos[1]?.url ||
    (extracted?.about_image_url as string) ||
    null;

  const businessName = lead.business_name || (facts?.business_name as string) || lead.slug;
  const city = (facts?.town as string) || "New York";
  const trade = lead.industry || (facts?.industry as string) || "Home Services";
  const rating = (facts?.rating as number) || 5.0;
  const reviewCount = (facts?.review_count as number) || 100;

  const mockupData: MockupData = {
    businessName,
    city,
    trade,
    brandColor: (facts?.brand_color_hex as string) || (extracted?.brand_color_hex as string) || "#1b4d3e",
    rating,
    reviewCount,
    yearsExperience: (facts?.years_in_business as number) || 10,
    founderName: (facts?.founder_name as string) || lead.contact_name || "Founder & Team",
    founderTitle: "Founder / CEO",
    aboutHeadline: `A PASSION FOR ${trade.toUpperCase()} EXCELLENCE`,
    heroHeadline: `PREMIER ${trade.toUpperCase()} IN ${city.toUpperCase()}`,
    photoUrl,
    secondaryPhotoUrl,
    siteUrl: lead.source_url,
  };

  // -------------------------------------------------------------
  // Meta Andromeda-Compliant Caption Engine
  // High-dwell time hooks, narrative contrast, frictionless CTA
  // -------------------------------------------------------------
  const [captionStyle, setCaptionStyle] = useState<"transformation" | "authority" | "contrarian">("transformation");
  const [copied, setCopied] = useState(false);
  const [customCaption, setCustomCaption] = useState<string>("");

  const generatedCaptions = useMemo(() => {
    const cleanTrade = trade.toLowerCase();
    const tradeHashtag = trade.replace(/[^a-zA-Z0-9]/g, "");
    const cityHashtag = city.replace(/[^a-zA-Z0-9]/g, "");

    return {
      transformation: `Most local ${cleanTrade} companies don't have a lead problem.

They have a trust leak. 🛑

When someone in ${city} searches for "${cleanTrade} near me", they click 2–3 websites. 
If your site takes 4+ seconds to load, looks outdated on a phone, or buries your phone number... they bounce straight to your competitor.

Here is the brand new digital storefront we just designed & launched for ${businessName} in ${city}:

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

  function handleCopy() {
    navigator.clipboard.writeText(activeCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleStyleChange(style: "transformation" | "authority" | "contrarian") {
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
              <h3 className="text-base font-bold text-[#0d1738]">Social Media Launch Studio (3D Poster & Andromeda Captions)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
              High-converting 3D perspective mockup asset + AI-generated Facebook/Instagram captions engineered for Meta&apos;s Andromeda algorithm (high dwell time & organic reach).
            </p>
          </div>
          <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-[11px] font-bold text-[#533afd] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Ready to Post
          </span>
        </div>

        {/* 3D Mockup Visual Stage */}
        <div className="flex justify-center">
          <SocialLaunchMockup data={mockupData} showControls={true} />
        </div>

        {/* Meta Andromeda Caption Generator */}
        <div className="rounded-2xl border border-[#c7d0fb] bg-[#f9f9ff] p-5 sm:p-6 space-y-4">
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

          {/* Style Selector Tabs */}
          <div className="flex flex-wrap gap-2">
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
              <Zap className="h-3.5 w-3.5" /> Authority Launch
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
      </CardContent>
    </Card>
  );
}

