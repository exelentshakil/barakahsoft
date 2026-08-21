"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { QAReviewPanel } from "@/components/admin/QAReviewPanel";
import { SectionContentEditor } from "@/components/admin/SectionContentEditor";
import { AssetSlottingManager } from "@/components/admin/AssetSlottingManager";
import type { Lead, Artifact } from "@/types/database";

export function RedesignTab({ lead, artifact }: { lead: Lead; artifact: Artifact | null }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [previewPath, setPreviewPath] = useState("");

  if (!artifact) {
    return <p className="text-sm text-muted-foreground">Still building — the redesign engine hasn't finished for this lead yet.</p>;
  }

  const services = artifact.funnel_pages.filter((s) => s.kind === "service");
  const areas = artifact.funnel_pages.filter((s) => s.kind === "area");
  const locationServices = artifact.funnel_pages.filter((s) => s.kind === "location-service");
  const previewUrl = `/s/${lead.slug}${previewPath}`;

  return (
    <div className="space-y-6">
      {/* Visual Asset Slotting & Standalone Export Manager */}
      <AssetSlottingManager lead={lead} artifact={artifact} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-border shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-4 py-2">
            <select
              value={previewPath}
              onChange={(e) => setPreviewPath(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Home</option>
              <option value="/about">About</option>
              <option value="/faq">FAQ</option>
              <option value="/contact">Contact</option>
              <option value="/privacy">Privacy</option>
              <option value="/terms">Terms</option>
              {services.length > 0 && (
                <optgroup label="Services">
                  {services.map((s) => (
                    <option key={s.slug} value={`/services/${s.slug}`}>
                      {s.h2}
                    </option>
                  ))}
                </optgroup>
              )}
              {areas.length > 0 && (
                <optgroup label="Areas">
                  {areas.map((a) => (
                    <option key={a.slug} value={`/areas/${a.slug}`}>
                      {a.h2}
                    </option>
                  ))}
                </optgroup>
              )}
              {locationServices.length > 0 && (
                <optgroup label="Location pages">
                  {locationServices.map((l) => (
                    <option key={l.slug} value={`/locations/${l.slug}`}>
                      {l.h2}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <Link href={previewUrl} target="_blank" className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Open full page <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <iframe key={`${previewPath}-${reloadKey}`} src={previewUrl} className="h-[900px] w-full" title="Generated site preview" />
        </div>

        <div className="space-y-6">
          <QAReviewPanel lead={lead} artifact={artifact} />
          <SectionContentEditor leadId={lead.id} sections={artifact.funnel_pages} onSaved={() => setReloadKey((k) => k + 1)} />
        </div>
      </div>
    </div>
  );
}
