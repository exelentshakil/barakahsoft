import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { getShellStyle } from "@/components/site-shell/shell-style";
import type { SitePayload } from "@/components/site-shell/types";

// v8 -- renders the real, bespoke, per-lead generated homepage HTML
// (Gemini, vision-informed, sanitized before it ever reaches here -- see
// generate-bespoke-page.ts / sanitize-generated-html.ts). Keeps the same
// real nav/footer/sticky-CTA chrome every lead already gets (those stay
// hand-built, reviewed components, not AI output) -- only the section
// content between them is bespoke per lead.
export function BespokeHomepage({ payload }: { payload: SitePayload }) {
  const style = getShellStyle(payload);

  return (
    <div style={style} className="pb-20 lg:pb-0">
      <MegaMenu payload={payload} />
      <div className="bespoke-page" dangerouslySetInnerHTML={{ __html: payload.bespokeHomepageHtml ?? "" }} />
      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
