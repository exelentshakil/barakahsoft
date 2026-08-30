import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { BespokeChromeRuntime } from "@/components/site-shell/BespokeChromeRuntime";
import type { SitePayload } from "@/components/site-shell/types";

// The site chrome, rendered around every route under /s/[leadSlug].
//
// A lead built by the bespoke pipeline has its own generated nav and footer:
// the chrome is half of what makes one client's site look unlike another's, so
// framing a bespoke page in the shared React components made every build look
// like the same product with a new colour. Leads built before that pipeline
// have neither, and still get the reviewed components.
//
// The generated markup is wrapped in .bespoke-page because the page's
// stylesheet is scoped to that class. The stylesheet itself is emitted once
// per document by whichever component renders the body.

function GeneratedChrome({ html, css, runtime }: { html: string; css: string | null; runtime?: boolean }) {
  return (
    <>
      {/* Keyed by href so React emits it once even when the body renders it too. */}
      {css && <style href="bespoke-css" precedence="default" dangerouslySetInnerHTML={{ __html: css }} />}
      <div className="bespoke-page" dangerouslySetInnerHTML={{ __html: html }} />
      {runtime && <BespokeChromeRuntime />}
    </>
  );
}

export function BespokeSiteNav({ payload }: { payload: SitePayload }) {
  if (payload.bespokeChromeHtml) {
    return <GeneratedChrome html={payload.bespokeChromeHtml} css={payload.bespokeCss} runtime />;
  }
  return <BespokeNav payload={payload} spec={payload.chromeSpec} />;
}

export function BespokeSiteFooter({ payload }: { payload: SitePayload }) {
  if (payload.bespokeFooterHtml) {
    return <GeneratedChrome html={payload.bespokeFooterHtml} css={payload.bespokeCss} />;
  }
  return <BespokeFooter payload={payload} spec={payload.chromeSpec} />;
}
