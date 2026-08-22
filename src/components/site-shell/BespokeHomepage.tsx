import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { LeadAssistant } from "@/components/site-shell/LeadAssistant";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import type { SitePayload } from "@/components/site-shell/types";

// The real, per-lead generated homepage.
//
// Nav, footer and sticky CTA are rendered from this lead's chrome spec, so
// the frame is part of the bespoke design rather than a shared shell — but
// they stay reviewed React components, because they carry real routing and
// real tracking, and model-authored nav is how a site ends up linking at
// pages that were never built.
export function BespokeHomepage({ payload }: { payload: SitePayload }) {
  return (
    <div style={siteRootStyle(payload)} className="pb-20 lg:pb-0">
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      <BespokePageBody html={payload.bespokeHomepageHtml ?? ""} />
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
      <StickyMobileCTA payload={payload} />
      {/* The callback assistant the ad promises. It was fully built and
          mounted nowhere, so no delivered site had one. */}
      <LeadAssistant payload={payload} />
    </div>
  );
}
