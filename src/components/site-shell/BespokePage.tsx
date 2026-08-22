import { BespokeRuntime } from "@/components/site-shell/BespokeRuntime";

// Renders one generated page: its markup, its own stylesheet, and the
// reviewed interaction runtime.
//
// Design tokens are applied at the page ROOT (siteRootStyle) rather than
// here, because the header and footer are styled from the same tokens.
// Scoping them to this element left the chrome resolving to nothing and
// rendering as a different design from the page it framed.
export function BespokePageBody({ html, css }: { html: string; css?: string | null }) {
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
        <style dangerouslySetInnerHTML={{ __html: css }} />
      )}
      <div className="bespoke-page" dangerouslySetInnerHTML={{ __html: html }} />
      <BespokeRuntime />
    </>
  );
}
