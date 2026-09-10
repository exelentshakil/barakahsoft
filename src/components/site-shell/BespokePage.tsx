import { BespokeRuntime } from "@/components/site-shell/BespokeRuntime";

// Renders one generated page: its markup, its own stylesheet, and the
// reviewed interaction runtime.
//
// Design tokens are applied at the page ROOT (siteRootStyle) rather than
// here, because the header and footer are styled from the same tokens.
// Scoping them to this element left the chrome resolving to nothing and
// rendering as a different design from the page it framed.
export function BespokePageBody({
  html,
  css,
  js,
  leadSlug,
}: {
  html: string;
  css?: string | null;
  js?: string | null;
  leadSlug: string;
}) {
  return (
    <>
      {css && (
        // Emitted inline rather than linked: it is a few kilobytes, it is
        // unique to this page, and inlining removes a render-blocking
        // request on the one impression that decides the sale.
        //
        // Every selector was scoped to .bespoke-page before storage, so these
        // rules cannot reach the site's real navigation and footer, the admin,
        // or the portal that previews this page.
        // href/precedence rather than a bare tag: the nav and the footer render
        // the same stylesheet, and React dedupes styles by href so it is sent once.
        <style href="bespoke-css" precedence="default" dangerouslySetInnerHTML={{ __html: css }} />
      )}
      <div className="bespoke-page" dangerouslySetInnerHTML={{ __html: html }} />
      <BespokeRuntime leadSlug={leadSlug} />
      {js && (
        // After BespokeRuntime, deliberately. The runtime owns the quote modal
        // and the lead form; generated presentation code runs on top of a page
        // whose mechanisms are already bound, so a throw in a scroll effect
        // cannot take a form submission with it. The IIFE it is wrapped in
        // catches anyway — this is the second of the two guards.
        <script
          id="bespoke-js"
          type="text/javascript"
          dangerouslySetInnerHTML={{ __html: js }}
        />
      )}
    </>
  );
}
