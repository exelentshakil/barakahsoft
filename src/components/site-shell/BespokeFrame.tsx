// The renderer.
//
// The generated page is one complete HTML document, so it is handed to the
// browser as one complete HTML document.
//
// What this replaces was roughly 4,300 lines: a React nav and footer that
// mirrored the model's chrome, a runtime that re-bound the model's JavaScript,
// a style-doctor that patched its CSS after the fact, and a containment
// stylesheet whose job was to stop the host's own reset leaking into the page.
// Every one of those existed because generated markup was being rendered INSIDE
// this application. Rendered in its own document, none of the problems arise:
// no cascade to contain, no reset to defeat, no runtime to review.
//
// sandbox without allow-same-origin puts the page in an opaque origin, so its
// scripts cannot reach our cookies, storage or DOM. allow-scripts is what makes
// a mobile menu and a lightbox work, and is safe precisely because the origin
// is opaque.
//
// The height is driven by the document's own scrollHeight, posted out on load
// and on resize, because a fixed-height iframe would either clip the page or
// leave a gap under it.
"use client";

import { useEffect, useRef, useState } from "react";

const RESIZE_SHIM = `<script>(function(){
function post(){try{parent.postMessage({__bespokeHeight:Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0)},'*')}catch(e){}}
window.addEventListener('load',post);window.addEventListener('resize',post);
if(window.ResizeObserver&&document.documentElement){new ResizeObserver(post).observe(document.documentElement)}
setTimeout(post,150);setTimeout(post,800);setTimeout(post,2500);
})()</script>`;

function withShim(html: string): string {
  if (/<\/body\s*>/i.test(html)) return html.replace(/<\/body\s*>/i, `${RESIZE_SHIM}</body>`);
  return html + RESIZE_SHIM;
}

export function BespokeFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1400);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const value = (event.data as { __bespokeHeight?: number } | null)?.__bespokeHeight;
      // The frame is the only thing that sends this, and a bad number would
      // collapse the page, so it is range-checked rather than trusted.
      if (typeof value === "number" && value > 200 && value < 100000) setHeight(Math.ceil(value));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={withShim(html)}
      sandbox="allow-scripts allow-popups allow-forms"
      style={{ display: "block", width: "100%", height, border: 0 }}
    />
  );
}
