/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The export route reads the chrome stylesheet and the real header,
  // footer and sticky-bar components off disk and ships them inside the
  // client's zip. Without this they are not traced into the serverless
  // bundle, and every export in production would fail or arrive unstyled.
  outputFileTracingIncludes: {
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
