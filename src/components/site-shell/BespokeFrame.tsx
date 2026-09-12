// The renderer.
//
// The generated page is one complete HTML document, so it is handed to the
// browser as one complete HTML document, in a frame that behaves like a window.
//
// This used to measure the document's scrollHeight and grow the frame to match.
// That is a feedback loop the moment the page uses viewport units, and generated
// pages always do: the frame grows, `90vh` recalculates against the taller
// frame, scrollHeight grows, the observer fires, the frame grows again. A real
// 23KB page settled at 39,766px — one enormous empty hero that looked like a
// broken design and was actually a broken renderer.
//
// A fixed viewport ends it. `vh` now means what the model meant by it, the
// document scrolls itself the way it would anywhere else, and there is no
// measurement, no postMessage and no observer to reason about.
//
// sandbox without allow-same-origin puts the page in an opaque origin, so its
// scripts cannot reach our cookies, storage or DOM. allow-scripts is what makes
// a mobile menu and a lightbox work, and is safe precisely because the origin is
// opaque.
import type { CSSProperties } from "react";

export function BespokeFrame({
  html,
  title,
  style,
}: {
  html: string;
  title: string;
  /** Overridden by the review grid, which renders these small and scaled. */
  style?: CSSProperties;
}) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      sandbox="allow-scripts allow-popups allow-forms"
      style={{ display: "block", width: "100%", height: "100dvh", border: 0, ...style }}
    />
  );
}
