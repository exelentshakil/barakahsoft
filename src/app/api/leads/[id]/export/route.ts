import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteData } from "@/lib/get-site-data";
import type { Lead, Artifact } from "@/types/database";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const siteData = await getSiteData(lead.slug);
  const payload = siteData?.payload;

  const zip = new JSZip();

  // 1. package.json
  const packageJson = {
    name: `${lead.slug}-website`,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "15.5.22",
      react: "19.0.0",
      "react-dom": "19.0.0",
      "lucide-react": "^1.28.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^3.6.0",
    },
    devDependencies: {
      "@types/node": "^22.7.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      autoprefixer: "^10.4.20",
      postcss: "^8.4.47",
      tailwindcss: "^3.4.13",
      typescript: "^5.6.0",
    },
  };

  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  // 2. README.md
  const readme = `# ${lead.business_name || lead.slug} — Standalone Website

Generated and delivered by BarakahSoft.

## 🚀 1-Click Deployment (Vercel Free Tier)
1. Push this folder to a GitHub repository.
2. Import the repository in Vercel (https://vercel.com/new).
3. Connect your custom domain (${lead.custom_domain || lead.source_url}) in Vercel Domain Settings.
4. Add CNAME record to your DNS registrar.

## 🛠️ Local Development
\`\`\`bash
npm install
npm run dev
\`\`\`
`;
  zip.file("README.md", readme);

  // 3. tailwind.config.ts & tsconfig.json
  zip.file(
    "tailwind.config.ts",
    `import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "${payload?.brandColorHsl ? `hsl(${payload.brandColorHsl})` : "#533AFD"}",
        secondary: "#0D1738",
        accent: "#FFD12D",
      },
    },
  },
  plugins: [],
} satisfies Config;`
  );

  zip.file(
    "tsconfig.json",
    `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`
  );

  // 4. Source files
  const src = zip.folder("src");
  const app = src?.folder("app");

  // layout.tsx
  app?.file(
    "layout.tsx",
    `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${payload?.businessName || lead.business_name} | Professional Services",
  description: "${payload?.subhead || "Top-rated local services"}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}`
  );

  // globals.css
  app?.file(
    "globals.css",
    `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${payload?.brandColorHsl ? `hsl(${payload.brandColorHsl})` : "#533AFD"};
  --secondary: #0D1738;
  --accent: #FFD12D;
}`
  );

  // page.tsx (Homepage)
  app?.file(
    "page.tsx",
    `import { Phone, Star, ShieldCheck, Clock3, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 py-3 px-6 text-xs text-slate-300 flex justify-between items-center max-w-7xl mx-auto">
        <span>24/7 Service: ${payload?.nap?.address || "Local Area"}</span>
        <a href="tel:${payload?.nap?.phone || lead.phone || ""}" className="font-bold text-white flex items-center gap-1">
          <Phone className="h-3 w-3 text-amber-400" /> ${payload?.nap?.phone || lead.phone || "Contact Us"}
        </a>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-400">#1 RATED LOCAL TEAM</span>
        <h1 className="text-5xl sm:text-7xl font-extrabold uppercase">${payload?.headline || lead.business_name}</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">${payload?.subhead || "Providing top-tier quality, reliability, and fast turnaround."}</p>
        <div className="pt-4 flex justify-center gap-4">
          <a href="tel:${payload?.nap?.phone || lead.phone || ""}" className="rounded-lg bg-amber-400 text-slate-950 font-bold px-8 py-4 text-sm hover:bg-amber-300">
            Call ${payload?.nap?.phone || lead.phone || "Now"}
          </a>
        </div>
      </main>
    </div>
  );
}`
  );

  const zipContent = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipContent), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${lead.slug}-standalone-website.zip"`,
    },
  });
}
