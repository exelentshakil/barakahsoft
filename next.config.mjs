/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // The export route reads the shared chrome stylesheet off disk and ships
  // it inside the client's zip. Without this the file is not traced into
  // the serverless bundle and every export would arrive unstyled.
  outputFileTracingIncludes: {
    "/api/leads/[id]/export": ["./src/app/bespoke.css"],
  },
};
export default nextConfig;
