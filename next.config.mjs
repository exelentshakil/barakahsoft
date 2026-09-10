/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The rendered audit launches a real Chromium inside the Inngest function.
  // @sparticuz/chromium ships that browser as brotli archives beside its own
  // code and unpacks them at runtime, so it has to stay a file on disk —
  // bundled into a chunk, it loses the archives and every launch fails.
  // playwright-core rides along for the same reason: it resolves driver paths
  // relative to its package directory.
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  images: {
    // Asset hosts for every tenant in src/tenants/. next/image refuses an
    // unlisted host outright, so a partner added there without a line here
    // renders a broken logo and an empty portfolio.
    remotePatterns: [
      { protocol: 'https', hostname: 'barakahsoft.com' },
      { protocol: 'https', hostname: 'smilecreative.agency' },
      { protocol: 'https', hostname: 'redesign.smilecreative.agency' },
    ],
  },
  // The export route reads the chrome stylesheet and the real header,
  // footer and sticky-bar components off disk and ships them inside the
  // client's zip. Without this they are not traced into the serverless
  // bundle, and every export in production would fail or arrive unstyled.
  outputFileTracingIncludes: {
    // The rendered audit's browser. Neither half of it survives tracing on its
    // own: @sparticuz/chromium reads its brotli archives out of bin/ through a
    // path it computes at runtime, and playwright-core loads most of lib/
    // through lazy requires. The tracer follows neither, so the deployment
    // ships the launcher without the browser and every build dies at
    // "Executable doesn't exist". Named here, both travel whole.
    "/api/inngest": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/playwright-core/**",
    ],
    "/api/leads/[id]/export": [
      "./src/app/bespoke.css",
      "./src/components/site-shell/BespokeNav.tsx",
      "./src/components/site-shell/BespokeFooter.tsx",
      "./src/components/site-shell/StickyMobileCTA.tsx",
      "./src/components/ui/button.tsx",
    ],
  },
};
export default nextConfig;
