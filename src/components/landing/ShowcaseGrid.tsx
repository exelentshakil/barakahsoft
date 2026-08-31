"use client";

import { useState } from "react";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";
import { LiveSitePreview } from "@/components/landing/LiveSitePreview";
import type { ShowcaseEntry } from "@/lib/showcase/list";

// The showcase grid.
//
// A card with a live URL becomes browsable on click; one without stays the
// before/after slider it always was. Only ONE card is live at a time — state
// lives here rather than in each card precisely so that opening a second
// unmounts the first, and a visitor who clicks through every card still only
// ever has one site loaded.

export function ShowcaseGrid({ entries }: { entries: ShowcaseEntry[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {entries.map((entry) => (
        <figure
          key={entry.slug}
          className="overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.06)] transition hover:shadow-[0_20px_45px_rgba(7,40,77,0.12)]"
        >
          {entry.liveUrl ? (
            <LiveSitePreview
              posterUrl={entry.afterUrl}
              liveUrl={entry.liveUrl}
              businessName={entry.businessName}
              isActive={activeSlug === entry.slug}
              onActivate={() => setActiveSlug(entry.slug)}
            />
          ) : (
            <BeforeAfterSlider
              beforeUrl={entry.beforeUrl}
              afterUrl={entry.afterUrl}
              beforeLabel="Before"
              afterLabel="After"
              subject={`${entry.businessName} homepage`}
            />
          )}
          <figcaption className="flex items-center justify-between gap-3 border-t border-[#e4eef7] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#07284d]">{entry.businessName}</p>
              {entry.label && <p className="truncate text-xs text-[#657c90]">{entry.label}</p>}
            </div>
            <a
              href={entry.liveUrl ?? `/s/${entry.slug}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-bold text-[#0c68c8] transition hover:underline"
            >
              View live →
            </a>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
