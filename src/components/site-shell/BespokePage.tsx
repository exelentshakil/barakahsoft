// Renders one generated page body.
//
// Design tokens are applied at the page ROOT (siteRootStyle) rather than
// here, because the header and footer are styled from the same tokens.
// Scoping them to this element left the chrome resolving to nothing and
// rendering as a different design from the page it framed.
export function BespokePageBody({ html }: { html: string }) {
  return <div className="bespoke-page" dangerouslySetInnerHTML={{ __html: html }} />;
}
