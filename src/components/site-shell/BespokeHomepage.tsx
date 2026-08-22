import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { getShellStyle } from "@/components/site-shell/shell-style";
import type { SitePayload } from "@/components/site-shell/types";

// The real, per-lead generated homepage.
//
// Nav, footer and sticky CTA stay hand-built, reviewed React components —
// they carry real routing and real tracking, and a model-authored nav
// linking at pages that may not exist is a liability, not a feature. Only
// the body between them is generated.
export function BespokeHomepage({ payload }: { payload: SitePayload }) {
  return (
    <div style={getShellStyle(payload)} className="pb-20 lg:pb-0">
      <MegaMenu payload={payload} />
      <BespokePageBody payload={payload} html={payload.bespokeHomepageHtml ?? ""} />
      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
