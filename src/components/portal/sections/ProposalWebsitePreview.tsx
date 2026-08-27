"use client";

import { useState } from "react";
import { ExternalLink, Monitor, Smartphone, Sparkles, Globe } from "lucide-react";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";

interface ProposalWebsitePreviewProps {
  businessName: string;
  leadSlug: string;
  sourceUrl: string;
  /** Only ever true for an allowlisted operator session. */
  isOperator?: boolean;
  leadId?: string;
  showcaseBeforeUrl?: string | null;
  showcaseAfterUrl?: string | null;
  showcaseApproved?: boolean;
  showcaseLabel?: string | null;
}

export function ProposalWebsitePreview({
  businessName,
  leadSlug,
  sourceUrl,
  isOperator = false,
  leadId,
  showcaseBeforeUrl,
  showcaseAfterUrl,
  showcaseApproved = false,
  showcaseLabel,
}: ProposalWebsitePreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const previewUrl = `/s/${leadSlug}?view=preview`;
  const hasComparison = Boolean(showcaseBeforeUrl && showcaseAfterUrl);

  return (
    <section className="rounded-2xl border border-[#c7d0fb] bg-white p-6 sm:p-10 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e5e7f2] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Interactive Live Preview
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
            Evaluate the Quality of Your New Website
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#42506a]">
            Test the live responsive design, instant click-to-call buttons, and fast lead capture before launching.
          </p>
        </div>

        {/* Viewport Toggles & Open In New Tab */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex h-9 items-center rounded-lg border border-[#c7d0fb] bg-[#f0f3ff] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              aria-pressed={viewport === "desktop"}
              className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition ${
                viewport === "desktop"
                  ? "bg-white text-[#533afd] shadow-xs"
                  : "text-[#42506a] hover:text-[#0d1738]"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              aria-pressed={viewport === "mobile"}
              className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition ${
                viewport === "mobile"
                  ? "bg-white text-[#533afd] shadow-xs"
                  : "text-[#42506a] hover:text-[#0d1738]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#533afd] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#432bd9]"
          >
            Open Full Screen <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Before / After — drag to compare the current site against the rebuild. */}
      {hasComparison && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0d1738]">Drag to compare: your site today vs. the rebuild</h3>
            <p className="text-xs text-[#42506a]">Same page, same screen width — nothing staged.</p>
          </div>
          <BeforeAfterSlider
            beforeUrl={showcaseBeforeUrl as string}
            afterUrl={showcaseAfterUrl as string}
            beforeLabel="Your site now"
            afterLabel="Rebuilt"
            subject={`${businessName} homepage`}
            className="border border-[#dfe3ef] shadow-sm"
          />
        </div>
      )}

      {/* Frame Container */}
      <div className="overflow-x-auto rounded-xl border border-[#dfe3ef] bg-[#eef1f7] p-3 sm:p-6 shadow-inner">
        <div
          className={`mx-auto overflow-hidden bg-white shadow-2xl transition-[width] duration-300 ${
            viewport === "mobile"
              ? "w-[390px] max-w-full rounded-[32px] border-[6px] border-slate-800 ring-4 ring-slate-900/10"
              : "w-full min-w-[1024px] rounded-xl border border-[#cfd5e3]"
          }`}
        >
          {/* Browser Address Bar */}
          <div className="flex h-9 sm:h-10 items-center justify-between border-b border-[#e5e7f2] bg-[#f8f9fc] px-3 sm:px-4 text-xs text-[#777588] gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ff6b6b]" />
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#ffd166]" />
              <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#5dd39e]" />
            </div>

            <div className="flex min-w-0 items-center gap-1 rounded-md bg-white px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono text-slate-600 border border-slate-200 shadow-2xs">
              <span className="text-[#0b8f5b] font-bold shrink-0">🔒 https://</span>
              <span className="truncate">{businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com</span>
            </div>

            <span className="text-[10px] font-bold text-[#533afd] uppercase tracking-wider shrink-0">
              {viewport === "mobile" ? "Mobile (390px)" : "Desktop (1024px+)"}
            </span>
          </div>

          {/* Live Website Frame */}
          <iframe
            src={previewUrl}
            className={`w-full transition-all duration-200 ${
              viewport === "mobile" ? "h-[740px]" : "h-[820px]"
            }`}
            title={`${businessName} live website preview`}
            loading="lazy"
          />
        </div>
      </div>

      {/* Comparison Bottom Reassurance */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-4 text-xs text-[#42506a]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#533afd] shrink-0" />
          <span>
            <strong>Everything you see above is live and functional:</strong> Click navigation links, test the quote forms, and view on phones to experience the difference.
          </span>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-bold text-[#533afd] hover:underline shrink-0"
          >
            <Globe className="h-3.5 w-3.5" /> View current site for comparison
          </a>
        )}
      </div>
    </section>
  );
}
