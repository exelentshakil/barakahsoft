import { compileDesignTokens } from "@/lib/design-tokens";
import type { SitePayload } from "@/components/site-shell/types";

// Renders one generated page body inside its lead's design tokens.
//
// The tokens are applied as inline custom properties on the wrapper, which
// is what every bs-* class in src/app/bespoke.css resolves against. That
// indirection is the reason generated markup is safe to render: it contains
// no colors and no font stacks of its own, only class names that bind to
// this element's variables.
//
// The webfont link is emitted per page rather than in the root layout
// because the family is per-lead — it comes from the design DNA of whatever
// reference site the operator chose for this specific client.
export function BespokePageBody({
  payload,
  html,
}: {
  payload: Pick<SitePayload, "designTokens">;
  html: string;
}) {
  // Older leads were generated before design_tokens existed; compiling the
  // default spec keeps their pages rendering with a real palette instead of
  // unresolved variables.
  const tokens = payload.designTokens ?? compileDesignTokens(null);

  return (
    <>
      {tokens.fontHref && (
        <link
          rel="stylesheet"
          href={tokens.fontHref}
          // The page is server-rendered and the font is part of the design
          // being sold; loading it eagerly avoids a visible reflow on the
          // one impression that decides the deal.
          precedence="default"
        />
      )}
      <div className="bespoke-page" style={tokens.vars as React.CSSProperties} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
