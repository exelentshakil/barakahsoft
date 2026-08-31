"use client";

import { useState } from "react";
import { Monitor, Smartphone, ExternalLink, Play } from "lucide-react";

// A real, browsable copy of a site we built, on the landing page.
//
// A screenshot is a picture of proof; this is the proof. It also cannot drift
// out of date the way a capture does, and the desktop/mobile toggle
// demonstrates the responsiveness that is half of what we are selling.
//
// It stays a poster image until someone clicks. Fifteen live iframes on a
// landing page is fifteen full page loads, on a page whose entire argument is
// "loads fast on a phone" — so the frame mounts only for the person who asked
// for it, and only one card is ever live at a time (the parent unmounts the
// previous one by passing isActive=false).

export function LiveSitePreview({
  posterUrl,
  liveUrl,
  businessName,
  isActive,
  onActivate,
}: {
  posterUrl: string;
  liveUrl: string;
  businessName: string;
  isActive: boolean;
  onActivate: () => void;
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#eef4f9]">
        {isActive ? (
          <div className="absolute inset-0 flex items-start justify-center overflow-hidden bg-[#dde8f2]">
            <iframe
              // Keyed on the device so switching gives a clean load at the new
              // width rather than a reflow of the old one.
              key={`${liveUrl}-${device}`}
              src={liveUrl}
              title={`${businessName} — live preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="origin-top border-0 bg-white"
              style={
                device === "desktop"
                  ? { width: "1440px", height: "900px", transform: "scale(0.333)" }
                  : { width: "390px", height: "844px", transform: "scale(0.42)", marginTop: "8px" }
              }
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onActivate}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Explore the ${businessName} site`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={`${businessName} homepage`}
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-[#07284d]/0 transition group-hover:bg-[#07284d]/25" />
            <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#07284d] shadow-lg transition group-hover:scale-105">
              <Play className="h-3.5 w-3.5 fill-current" />
              Explore the real site
            </span>
          </button>
        )}
      </div>

      {isActive && (
        <div className="flex items-center justify-between gap-2 border-t border-[#e4eef7] bg-[#f7fbfe] px-3 py-2">
          <div className="flex items-center gap-1" role="group" aria-label="Preview width">
            {(["desktop", "mobile"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDevice(option)}
                aria-pressed={device === option}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                  device === option ? "bg-[#07284d] text-white" : "text-[#657c90] hover:bg-[#e4eef7]"
                }`}
              >
                {option === "desktop" ? <Monitor className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                {option}
              </button>
            ))}
          </div>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#0c68c8] hover:underline"
          >
            Open in a tab <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
