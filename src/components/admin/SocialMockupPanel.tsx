"use client";

import React from "react";
import { Sparkles, Share2, Download, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

  const mockupData: MockupData = {
    businessName: lead.business_name || (facts?.business_name as string) || lead.slug,
    city: (facts?.town as string) || null,
    trade: lead.industry || (facts?.industry as string) || "Local Contractor",
    brandColor: (facts?.brand_color_hex as string) || (extracted?.brand_color_hex as string) || "#1b4d3e",
    rating: (facts?.rating as number) || 5.0,
    reviewCount: (facts?.review_count as number) || 100,
    yearsExperience: (facts?.years_in_business as number) || 10,
    founderName: (facts?.founder_name as string) || lead.contact_name || "Founder & Team",
    founderTitle: "Founder / CEO",
    aboutHeadline: `A PASSION FOR ${(lead.industry || "QUALITY").toUpperCase()} EXCELLENCE`,
    heroHeadline: `PREMIER ${(lead.industry || "SERVICES").toUpperCase()} IN ${((facts?.town as string) || "YOUR CITY").toUpperCase()}`,
    photoUrl,
    secondaryPhotoUrl,
    siteUrl: lead.source_url,
  };

  return (
    <Card className="border border-border bg-white shadow-sm overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Share2 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-[#0d1738]">Social Media Launch Mockup (3D Poster)</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-2xl">
              High-converting 3D perspective mockup asset for Instagram, Facebook, and Reels. Export high-res PNG or transparent layer for Adobe After Effects motion graphics.
            </p>
          </div>
          <span className="rounded-full bg-[#f0f3ff] px-2.5 py-1 text-[11px] font-bold text-[#533afd] flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> 1-Click Social Asset
          </span>
        </div>

        <div className="flex justify-center">
          <SocialLaunchMockup data={mockupData} showControls={true} />
        </div>
      </CardContent>
    </Card>
  );
}
