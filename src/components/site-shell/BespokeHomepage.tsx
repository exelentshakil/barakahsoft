import { BespokeSiteNav, BespokeSiteFooter } from "@/components/site-shell/BespokeChrome";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { LeadAssistant } from "@/components/site-shell/LeadAssistant";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import type { SitePayload } from "@/components/site-shell/types";

// The real, per-lead generated homepage.
//
// Nav and footer come from BespokeSiteNav/BespokeSiteFooter, which render this
// lead's generated chrome when it has one and the reviewed React components
// when it does not. They are the same components every inner route uses, so
// the frame is identical across the site — which is the whole point of
// generating it once rather than letting the homepage hero write its own.
export function BespokeHomepage({ payload }: { payload: SitePayload }) {
  return (
    <div style={siteRootStyle(payload)} className="pb-20 lg:pb-0">
      <BespokeSiteNav payload={payload} />
      <BespokePageBody
        html={payload.bespokeHomepageHtml ?? ""}
        css={payload.bespokeCss}
        js={payload.bespokeJs}
        leadSlug={payload.leadSlug}
      />
      <BespokeSiteFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
      {/* The callback assistant the ad promises. It was fully built and
          mounted nowhere, so no delivered site had one. */}
      <LeadAssistant payload={payload} />
    </div>
  );
}
