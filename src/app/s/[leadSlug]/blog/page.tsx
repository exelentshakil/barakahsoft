import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { getShellStyle } from "@/components/site-shell/shell-style";
import { ArrowRight, BookOpen, Calendar, Clock, Sparkles } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) return {};

  return {
    title: `Expert Advice & Articles | ${result.payload.businessName}`,
    description: `Helpful electrical tips, NYC code guidelines, and maintenance advice from ${result.payload.businessName}.`,
    alternates: { canonical: `/s/${leadSlug}/blog` },
  };
}

const DEFAULT_ARTICLES = [
  {
    slug: "signs-you-need-electrical-panel-upgrade",
    title: "5 Signs You Need to Upgrade Your Electrical Panel in Queens",
    excerpt: "Learn the warning signs of an overloaded 100-amp electrical panel and when NYC codes require a 200-amp upgrade.",
    readTime: "5 min",
    category: "Home Safety & Panels",
    date: "August 2026",
  },
  {
    slug: "level-2-ev-charger-installation-queens-ny",
    title: "Level 2 EV Charger Installation: NYC Permits & Costs Explained",
    excerpt: "Everything Queens homeowners and commercial properties need to know about EV charging permits, ConEd requirements, and panel capacity.",
    readTime: "6 min",
    category: "EV Infrastructure",
    date: "August 2026",
  },
  {
    slug: "nyc-ecb-electrical-violations-guide",
    title: "NYC ECB & DOB Electrical Violations: How to Clear Them Fast",
    excerpt: "Got an ECB or DOB electrical violation? Learn how a licensed NYC Master Electrician clears violations and files Certificates of Correction.",
    readTime: "7 min",
    category: "DOB Code Compliance",
    date: "August 2026",
  },
  {
    slug: "commercial-led-lighting-retrofit-roi",
    title: "Commercial LED Lighting Retrofits: ROI and LL97 Compliance",
    excerpt: "How commercial property managers in NYC reduce energy costs by up to 65% while avoiding Local Law 97 carbon penalties.",
    readTime: "8 min",
    category: "Commercial Retrofits",
    date: "August 2026",
  },
];

export default async function BlogIndexPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();

  const { payload } = result;

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />

      <main className="mx-auto max-w-5xl px-6 py-16 space-y-12">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Content Library & Guides
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {payload.businessName} Tips & Insights
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Helpful electrical guides, safety tips, and NYC building code advice written directly by licensed master electricians.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {DEFAULT_ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary"
            >
              <div className="space-y-3">
                <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
                  {article.category}
                </span>
                <h2 className="text-xl font-bold tracking-tight text-card-foreground">
                  <Link href={`/s/${leadSlug}/blog/${article.slug}`} className="hover:text-primary transition">
                    {article.title}
                  </Link>
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.readTime} read
                </span>
                <Link
                  href={`/s/${leadSlug}/blog/${article.slug}`}
                  className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read Guide <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <PremiumFooter payload={payload} />
    </div>
  );
}
