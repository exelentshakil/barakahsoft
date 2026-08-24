// Local Chromium worker for generated homepage candidates.
//
// It claims one queued candidate at a time from the deployed application,
// renders the exact production components locally in Playwright, runs free
// browser/accessibility checks, and uses Gemini only after screenshots exist.
import { hostname } from "os";
import { lookup } from "dns/promises";
import { isIP } from "net";
import { request as httpRequest, type IncomingHttpHeaders } from "http";
import { request as httpsRequest } from "https";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "playwright";
import sharp from "sharp";
import { critiqueRenderedHomepage } from "@/lib/generate/visual-critique";
import type { VisualFinding, VisualQaReport } from "@/lib/visual-qa";

const API_ORIGIN = (
  process.env.VISUAL_QA_API_ORIGIN ||
  process.env.NEXT_PUBLIC_PORTAL_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const TOKEN = process.env.VISUAL_QA_WORKER_TOKEN?.trim();
const WORKER_ID = process.env.VISUAL_QA_WORKER_ID?.trim() || `${hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.VISUAL_QA_POLL_MS || 5000);
const RUN_ONCE = process.argv.includes("--once");

if (!TOKEN) throw new Error("VISUAL_QA_WORKER_TOKEN is required");
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required for rendered visual critique");

const AUTH_HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "X-Visual-QA-Worker": WORKER_ID,
};

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const TRACKING_HOSTS = [
  "connect.facebook.net",
  "www.facebook.com/tr",
  "google-analytics.com",
  "googletagmanager.com",
  "client.crisp.chat",
];
interface PublicEndpoint {
  address: string;
  family: 4 | 6;
}

const hostSafety = new Map<string, Promise<PublicEndpoint | null>>();

interface ClaimedCandidate {
  id: string;
  leadId: string;
  attempt: number;
  context: Record<string, unknown>;
  previewUrl: string;
}

interface CaptureResult {
  name: (typeof VIEWPORTS)[number]["name"];
  full: Buffer;
  firstScreen: Buffer;
  findings: VisualFinding[];
  pageErrors: string[];
  consoleErrors: string[];
  failedRequests: string[];
}

async function claimCandidate(): Promise<ClaimedCandidate | null> {
  const response = await fetch(`${API_ORIGIN}/api/internal/visual-qa/candidates`, {
    method: "POST",
    headers: AUTH_HEADERS,
  });
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Candidate claim failed (${response.status}): ${await response.text()}`);
  return ((await response.json()) as { candidate: ClaimedCandidate }).candidate;
}

async function waitUntilStable(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    await Promise.all(
      images.map((image) => {
        if (image.complete) return image.decode().catch(() => undefined);
        return new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 8000);
          image.addEventListener("load", () => { window.clearTimeout(timer); resolve(); }, { once: true });
          image.addEventListener("error", () => { window.clearTimeout(timer); resolve(); }, { once: true });
        });
      })
    );
  });
  await page.waitForTimeout(500);
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  );
}

async function resolvePublicEndpoint(hostname: string): Promise<PublicEndpoint | null> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "metadata.google.internal" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) return null;
  const literalFamily = isIP(host);
  if (literalFamily) return isPrivateAddress(host) ? null : { address: host, family: literalFamily as 4 | 6 };

  let pending = hostSafety.get(host);
  if (!pending) {
    pending = lookup(host, { all: true, verbatim: true })
      .then((addresses) => {
        if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) return null;
        const selected = addresses[0];
        return { address: selected.address, family: selected.family as 4 | 6 };
      })
      .catch(() => null);
    hostSafety.set(host, pending);
  }
  return pending;
}

function responseHeaders(headers: IncomingHttpHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || ["content-length", "transfer-encoding"].includes(name)) continue;
    result[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  return result;
}

async function fetchPinnedAsset(
  rawUrl: string,
  browserHeaders: Record<string, string>,
  redirects = 0
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  if (redirects > 5) throw new Error("Too many external asset redirects");
  const url = new URL(rawUrl);
  const endpoint = await resolvePublicEndpoint(url.hostname);
  if (!endpoint) throw new Error(`Unsafe or unresolvable external host: ${url.hostname}`);

  const headers: Record<string, string> = { ...browserHeaders, "accept-encoding": "identity" };
  for (const name of ["authorization", "cookie", "host", "content-length", "connection"]) delete headers[name];
  const requester = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const request = requester(
      url,
      {
        method: "GET",
        headers,
        lookup: ((_hostname: string, _options: unknown, callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
          callback(null, endpoint.address, endpoint.family);
        }) as never,
      },
      (response) => {
        const status = response.statusCode ?? 502;
        const location = response.headers.location;
        if (location && [301, 302, 303, 307, 308].includes(status)) {
          response.resume();
          fetchPinnedAsset(new URL(location, url).toString(), browserHeaders, redirects + 1).then(resolve, reject);
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 20 * 1024 * 1024) {
            response.destroy(new Error("External asset exceeds 20 MB"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolve({ status, headers: responseHeaders(response.headers), body: Buffer.concat(chunks) }));
        response.on("error", reject);
      }
    );
    request.setTimeout(15000, () => request.destroy(new Error("External asset request timed out")));
    request.on("error", reject);
    request.end();
  });
}

async function triggerLazyImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const height = document.documentElement.scrollHeight;
    for (let y = 0; y < height; y += Math.max(window.innerHeight * 0.8, 500)) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
  });
}

async function inspectDom(page: Page, viewport: CaptureResult["name"]): Promise<VisualFinding[]> {
  const raw = await page.evaluate(() => {
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };

    const h1s = Array.from(document.querySelectorAll("h1")).filter(visible);
    const brokenImages = Array.from(document.images)
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || "unknown image")
      .slice(0, 10);
    const viewportWidth = document.documentElement.clientWidth;
    const escaped = Array.from(document.querySelectorAll("main *, .bespoke-page *"))
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < viewportWidth * 1.5 && (rect.left < -2 || rect.right > viewportWidth + 2);
      })
      .map((element) => `${element.tagName.toLowerCase()}.${Array.from(element.classList).slice(0, 2).join(".")}`)
      .slice(0, 12);
    const clippedText = Array.from(document.querySelectorAll("h1,h2,h3,p,a,button,li,label"))
      .filter(visible)
      .filter((element) => {
        const style = getComputedStyle(element);
        const clips = ["hidden", "clip"].includes(style.overflow) || ["hidden", "clip"].includes(style.overflowX) || ["hidden", "clip"].includes(style.overflowY);
        return clips && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2);
      })
      .map((element) => `${element.tagName.toLowerCase()}: ${(element.textContent || "").trim().slice(0, 80)}`)
      .slice(0, 12);
    const actions = Array.from(document.querySelectorAll("a,button,input[type='submit']"))
      .filter(visible)
      .filter((element) => element.getBoundingClientRect().top < window.innerHeight)
      .map((element) => (element.textContent || (element as HTMLInputElement).value || "").trim())
      .filter(Boolean);
    const hasPrimaryAction = actions.some((text) => /quote|estimate|book|call|contact|schedule|request|get started|start now/i.test(text));
    const smallTargets = Array.from(document.querySelectorAll("a,button,input,select,textarea"))
      .filter(visible)
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 40 || rect.height < 40;
      })
      .length;

    return {
      h1Count: h1s.length,
      brokenImages,
      horizontalOverflow: document.documentElement.scrollWidth - viewportWidth,
      escaped,
      clippedText,
      hasPrimaryAction,
      smallTargets,
    };
  });

  const findings: VisualFinding[] = [];
  if (raw.h1Count !== 1) findings.push({ check: "visible-h1", severity: "blocker", detail: `Expected one visible H1; found ${raw.h1Count}.`, viewport });
  if (raw.brokenImages.length) findings.push({ check: "broken-images", severity: "blocker", detail: `Broken rendered images: ${raw.brokenImages.join(", ")}`, viewport });
  if (raw.horizontalOverflow > 2) findings.push({ check: "horizontal-overflow", severity: "blocker", detail: `Document exceeds the viewport by ${raw.horizontalOverflow}px.`, viewport });
  if (!raw.hasPrimaryAction) findings.push({ check: "above-fold-action", severity: "blocker", detail: "No visible primary conversion action appears above the fold.", viewport });
  if (raw.escaped.length) findings.push({ check: "viewport-escape", severity: "warning", detail: `Elements extend outside the viewport: ${raw.escaped.join(", ")}`, viewport });
  if (raw.clippedText.length) findings.push({ check: "clipped-text", severity: "warning", detail: `Potentially clipped text: ${raw.clippedText.join(" | ")}`, viewport });
  if (viewport === "mobile" && raw.smallTargets > 3) findings.push({ check: "tap-targets", severity: "warning", detail: `${raw.smallTargets} visible controls are smaller than 40px on mobile.`, viewport });
  return findings;
}

async function capture(page: Page, candidate: ClaimedCandidate, viewport: (typeof VIEWPORTS)[number]): Promise<CaptureResult> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const securityBlocks: string[] = [];
  const previewOrigin = new URL(candidate.previewUrl).origin;

  page.on("pageerror", (error) => pageErrors.push(error.message.slice(0, 500)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 500));
  });
  page.on("requestfailed", (request) => {
    if (!TRACKING_HOSTS.some((host) => request.url().includes(host))) {
      failedRequests.push(`${request.resourceType()}: ${request.url()}`.slice(0, 1000));
    }
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (TRACKING_HOSTS.some((host) => request.url().includes(host))) {
      await route.abort("blockedbyclient");
      return;
    }
    if (url.origin === previewOrigin) {
      await route.continue({ headers: { ...request.headers(), ...AUTH_HEADERS } });
      return;
    }
    if (!["http:", "https:"].includes(url.protocol)) {
      securityBlocks.push(request.url().slice(0, 500));
      await route.abort("blockedbyclient");
      return;
    }
    if (!["GET", "HEAD"].includes(request.method())) {
      securityBlocks.push(`Blocked external ${request.method()} request: ${request.url()}`.slice(0, 500));
      await route.abort("blockedbyclient");
      return;
    }
    try {
      const response = await fetchPinnedAsset(request.url(), request.headers());
      await route.fulfill(response);
    } catch (error) {
      securityBlocks.push(`${request.url()} (${error instanceof Error ? error.message : String(error)})`.slice(0, 500));
      await route.abort("blockedbyclient");
    }
  });
  await page.goto(candidate.previewUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await triggerLazyImages(page);
  await waitUntilStable(page);

  const findings = await inspectDom(page, viewport.name);
  const axe = await new AxeBuilder({ page }).analyze();
  for (const violation of axe.violations) {
    const severity = violation.impact === "critical" || violation.impact === "serious" ? "blocker" : "warning";
    findings.push({
      check: `a11y-${violation.id}`,
      severity,
      detail: `${violation.help} (${violation.nodes.length} affected node${violation.nodes.length === 1 ? "" : "s"}).`,
      viewport: viewport.name,
    });
  }
  for (const message of pageErrors) findings.push({ check: "page-error", severity: "blocker", detail: message, viewport: viewport.name });
  for (const request of failedRequests.slice(0, 10)) {
    findings.push({ check: "failed-resource", severity: "blocker", detail: request.slice(0, 500), viewport: viewport.name });
  }
  for (const message of consoleErrors.slice(0, 10)) {
    findings.push({
      check: "console-error",
      severity: /hydration|uncaught|typeerror|referenceerror/i.test(message) ? "blocker" : "warning",
      detail: message.slice(0, 500),
      viewport: viewport.name,
    });
  }
  for (const url of securityBlocks.slice(0, 10)) {
    findings.push({ check: "private-network-request", severity: "blocker", detail: `Blocked unsafe browser request: ${url}`, viewport: viewport.name });
  }

  const firstScreen = await page.screenshot({ type: "jpeg", quality: 82, fullPage: false });
  const fullRaw = await page.screenshot({ type: "jpeg", quality: 76, fullPage: true });
  let full = await sharp(fullRaw).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
  if (full.byteLength > 2_750_000) {
    full = await sharp(fullRaw).resize({ width: 750, withoutEnlargement: true }).jpeg({ quality: 58 }).toBuffer();
  }

  return {
    name: viewport.name,
    full,
    firstScreen,
    findings,
    pageErrors: pageErrors.slice(0, 30),
    consoleErrors: consoleErrors.slice(0, 30),
    failedRequests: failedRequests.slice(0, 30),
  };
}

async function contactSheet(captures: CaptureResult[]): Promise<Buffer> {
  const columnWidth = 560;
  const topHeight = 390;
  const fullHeight = 5000;
  const gutter = 24;
  const labelHeight = 42;
  const width = columnWidth * 3 + gutter * 4;
  const height = labelHeight + topHeight + gutter * 2 + fullHeight;
  const composites: sharp.OverlayOptions[] = [];

  for (let index = 0; index < captures.length; index++) {
    const capture = captures[index];
    const left = gutter + index * (columnWidth + gutter);
    const firstScreen = await sharp(capture.firstScreen)
      .resize({ width: columnWidth, height: topHeight, fit: "contain", background: "#ffffff" })
      .toBuffer();
    const full = await sharp(capture.full)
      .resize({ width: columnWidth, height: fullHeight, fit: "inside", position: "top" })
      .toBuffer();
    const label = Buffer.from(`<svg width="${columnWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#111827"/><text x="18" y="28" fill="white" font-family="Arial" font-size="20" font-weight="700">${capture.name.toUpperCase()}</text></svg>`);
    composites.push({ input: label, left, top: 0 });
    composites.push({ input: firstScreen, left, top: labelHeight });
    composites.push({ input: full, left, top: labelHeight + topHeight + gutter });
  }

  return sharp({ create: { width, height, channels: 3, background: "#f3f4f6" } })
    .composite(composites)
    .jpeg({ quality: 72 })
    .toBuffer();
}

async function complete(candidate: ClaimedCandidate, report: VisualQaReport, captures: CaptureResult[]): Promise<void> {
  for (const capture of captures) {
    const upload = await fetch(
      `${API_ORIGIN}/api/internal/visual-qa/candidates/${candidate.id}/screenshots/${capture.name}`,
      {
        method: "PUT",
        headers: { ...AUTH_HEADERS, "Content-Type": "image/jpeg", "Content-Length": String(capture.full.byteLength) },
        body: new Uint8Array(capture.full),
      }
    );
    if (!upload.ok) throw new Error(`Screenshot upload failed (${upload.status}): ${await upload.text()}`);
  }

  const submit = async () => {
    const response = await fetch(`${API_ORIGIN}/api/internal/visual-qa/candidates/${candidate.id}/complete`, {
      method: "POST",
      headers: { ...AUTH_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!response.ok) throw new Error(`Candidate completion failed (${response.status}): ${await response.text()}`);
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await submit();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
}

async function processCandidate(browser: Awaited<ReturnType<typeof chromium.launch>>, candidate: ClaimedCandidate): Promise<void> {
  const captures: CaptureResult[] = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        colorScheme: "light",
        locale: "en-US",
      });
      try {
        captures.push(await capture(await context.newPage(), candidate, viewport));
      } finally {
        await context.close();
      }
    }

    const findings = captures.flatMap((capture) => capture.findings);
    const deterministic = {
      passes: !findings.some((finding) => finding.severity === "blocker"),
      findings,
      pageErrors: captures.flatMap((capture) => capture.pageErrors).slice(0, 30),
      consoleErrors: captures.flatMap((capture) => capture.consoleErrors).slice(0, 30),
      failedRequests: captures.flatMap((capture) => capture.failedRequests).slice(0, 30),
    };
    const sheet = await contactSheet(captures);
    const critique = await critiqueRenderedHomepage(
      [
        { mimeType: "image/jpeg", data: sheet.toString("base64") },
        ...captures.map((capture) => ({ mimeType: "image/jpeg", data: capture.firstScreen.toString("base64") })),
      ],
      candidate.context,
      findings
    );

    const report: VisualQaReport = {
      passes: deterministic.passes && !!critique?.passes,
      capturedAt: new Date().toISOString(),
      workerId: WORKER_ID,
      deterministic,
      critique,
    };
    await complete(candidate, report, captures);
    console.log(`[visual-qa] ${candidate.id} ${report.passes ? "passed" : "failed"}${critique ? ` (${critique.score}/100)` : " (critic unavailable)"}`);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = rawMessage.slice(0, 1000);
    const report: VisualQaReport = {
      passes: false,
      capturedAt: new Date().toISOString(),
      workerId: WORKER_ID,
      error: message,
      deterministic: {
        passes: false,
        findings: [{ check: "worker-error", severity: "blocker", detail: message.slice(0, 500), viewport: "all" }],
        pageErrors: [],
        consoleErrors: [],
        failedRequests: [],
      },
      critique: null,
    };
    await complete(candidate, report, captures).catch((completionError) => {
      console.error(`[visual-qa] could not report worker failure: ${completionError}`);
    });
    console.error(`[visual-qa] ${candidate.id} errored: ${message}`);
  }
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  console.log(`[visual-qa] worker ${WORKER_ID} polling ${API_ORIGIN}`);
  try {
    do {
      const candidate = await claimCandidate();
      if (candidate) await processCandidate(browser, candidate);
      else if (RUN_ONCE) console.log("[visual-qa] no queued candidates");
      if (!RUN_ONCE) await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    } while (!RUN_ONCE);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
