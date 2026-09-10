// The safety boundary for model-authored JavaScript on a client's public site.
//
// Generated JS is presentation only: scroll effects, counters, carousels,
// cursor work — the things that stop a page reading as static. It has no
// business touching the network, storage, or the document's own writer, and
// the two mechanisms that carry money (the quote modal and the lead form) are
// implemented by reviewed application code, not by anything here.
//
// This is a deny-list on top of a scope, and a deny-list is never a sandbox.
// What makes it defensible is that the code runs on a page whose HTML has
// already been sanitized, in an IIFE with no arguments, on an origin that
// holds no session — plus the property that nothing here can reach a network
// or a store even if it wanted to.

/** Constructs that turn a string into code. */
const CODE_FROM_STRING = /\b(eval|Function|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]|new\s+Function)\b/g;

/** Anything that could reach a network. */
const NETWORK = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|navigator\s*\.\s*sendBeacon)\b/g;

/** Anything that could read or write persistent state. */
const STORAGE = /\b(localStorage|sessionStorage|indexedDB|openDatabase|document\s*\.\s*cookie|caches)\b/g;

/** Anything that rewrites the document wholesale or navigates away. */
const DOCUMENT_WRITE = /\b(document\s*\.\s*(write|writeln)|location\s*\.\s*(href|replace|assign)\s*=|window\s*\.\s*open)\b/g;

/** Dynamic import, which is a network fetch by another name. */
const DYNAMIC_IMPORT = /\bimport\s*\(/g;

const MAX_LENGTH = 24_000;

export interface JsSanitizeResult {
  js: string;
  removed: string[];
}

export function sanitizeGeneratedJsVerbose(raw: string): JsSanitizeResult {
  if (!raw || !raw.trim()) return { js: "", removed: [] };

  const removed: string[] = [];
  const note = (label: string) => (match: string) => {
    removed.push(`${label}: ${match.slice(0, 40)}`);
    return `/* removed:${label} */null`;
  };

  let js = raw
    // A model asked for JS sometimes returns a <script> wrapper around it.
    .replace(/<\/?script[^>]*>/gi, "")
    // Comments can hide a blocked construct from every filter below.
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(CODE_FROM_STRING, note("code-from-string"))
    .replace(NETWORK, note("network"))
    .replace(STORAGE, note("storage"))
    .replace(DOCUMENT_WRITE, note("document-write"))
    .replace(DYNAMIC_IMPORT, note("dynamic-import") as unknown as string);

  if (js.length > MAX_LENGTH) {
    removed.push(`length: truncated from ${js.length}`);
    js = js.slice(0, MAX_LENGTH);
  }

  if (!js.trim()) return { js: "", removed };

  // Scoped, so a generated `const nav = …` cannot collide with the runtime,
  // and guarded, so a throw in presentation code cannot take the page's real
  // mechanisms down with it.
  return {
    js: `(function(){try{\n${js}\n}catch(e){if(console&&console.warn)console.warn("[generated]",e)}})();`,
    removed,
  };
}

export function sanitizeGeneratedJs(raw: string): string {
  return sanitizeGeneratedJsVerbose(raw).js;
}
