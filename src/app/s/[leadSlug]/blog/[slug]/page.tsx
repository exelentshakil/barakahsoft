import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Phone, ShieldCheck, Sparkles, User } from "lucide-react";

interface ArticleContent {
  title: string;
  category: string;
  readTime: string;
  date: string;
  sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
}

const ARTICLES_DATABASE: Record<string, ArticleContent> = {
  "signs-you-need-electrical-panel-upgrade": {
    title: "5 Signs You Need to Upgrade Your Electrical Panel in Queens, NY",
    category: "Home Safety & Panel Upgrades",
    readTime: "5 min",
    date: "August 2026",
    sections: [
      {
        h2: "1. Your Circuit Breakers Trip Frequently",
        body: "An occasional tripped breaker is normal. But if you find yourself resetting the same breaker multiple times a month, or when running high-draw appliances like AC units or microwaves, your panel is overloaded.",
      },
      {
        h2: "2. Your Home Still Has an Outdated Fuse Box",
        body: "If your Queens home was built before the 1970s and still operates on a screw-in fuse box, it is limited to 60-amp service. Modern households require at least 150 to 200 amps to safely handle contemporary appliances and EV charging.",
      },
      {
        h2: "3. Flickering or Dimming Lights",
        body: "Lights that flicker when your refrigerator compressor kicks on or when your HVAC turns on indicate that your electrical panel cannot maintain stable voltage across circuits.",
      },
      {
        h2: "4. Adding High-Draw Appliances or Level 2 EV Chargers",
        body: "Electric induction ranges, heat pumps, central AC, and Level 2 EV chargers require dedicated 240V lines. A panel upgrade to 200 amps ensures your service line can handle this load safely.",
      },
      {
        h2: "5. Your Panel Is Over 25 Years Old",
        body: "Electrical panels have a finite mechanical lifespan. Breakers wear internally, and older panels from manufacturers like Federal Pacific or Zinsco carry documented fire hazards.",
      },
    ],
    faqs: [
      {
        q: "Do I need a NYC DOB permit for an electrical panel upgrade in Queens?",
        a: "Yes. All panel upgrades in NYC require an electrical permit filed by a licensed NYC Master Electrician and a Con Edison meter disconnect coordination.",
      },
      {
        q: "How long does a 200-amp panel upgrade take?",
        a: "A standard single-family panel upgrade in Queens is completed in 1 day. Con Edison coordinates the power disconnect in the morning and reconnects by late afternoon.",
      },
    ],
  },
  "level-2-ev-charger-installation-queens-ny": {
    title: "Level 2 EV Charger Installation: NYC Permits & Costs Explained",
    category: "EV Infrastructure",
    readTime: "6 min",
    date: "August 2026",
    sections: [
      {
        h2: "Why Level 1 Charging Is Not Enough",
        body: "Standard 120V wall outlets provide roughly 3 to 4 miles of range per hour. A dedicated 240V Level 2 charger provides 25 to 35 miles per hour, giving you a full charge overnight.",
      },
      {
        h2: "NYC DOB Permit & Load Calculation Requirements",
        body: "In New York City, installing an EV charger requires calculating total household load to ensure the electrical service won't trip the main breaker under maximum demand.",
      },
      {
        h2: "Commercial Fleet & Multi-Family EV Charging",
        body: "For commercial garages and residential co-ops in Queens, smart load-sharing chargers allow multiple vehicles to charge simultaneously without exceeding building utility capacity.",
      },
    ],
    faqs: [
      {
        q: "How much does a Level 2 EV charger installation cost in NYC?",
        a: "Installation typically ranges from $1,200 to $3,500 depending on panel proximity, conduit run length, and whether a 200-amp upgrade is needed.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ leadSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) return {};

  const article = ARTICLES_DATABASE[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };

  return {
    title: `${article.title} | ${result.payload.businessName}`,
    description: `Expert guide from licensed NYC Master Electricians at ${result.payload.businessName}.`,
    alternates: { canonical: `/s/${leadSlug}/blog/${slug}` },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ leadSlug: string; slug: string }>;
}) {
  const { leadSlug, slug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();

  const { payload } = result;
  const article = ARTICLES_DATABASE[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    category: "Electrical Advice",
    readTime: "5 min",
    date: "August 2026",
    sections: [
      {
        h2: "Expert Recommendations",
        body: `Our licensed master electricians at ${payload.businessName} inspect and resolve all electrical code violations, upgrades, and safety requirements across ${payload.nap.address || "Queens, NY"}.`,
      },
    ],
    faqs: [
      {
        q: `How do I schedule an inspection with ${payload.businessName}?`,
        a: `Call our emergency dispatch directly at ${payload.nap.phone || "(718) 353-7227"} for fast scheduling.`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    author: { "@type": "Organization", name: payload.businessName },
    publisher: { "@type": "Organization", name: payload.businessName },
    datePublished: "2026-08-19",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <BespokeNav payload={payload} spec={payload.chromeSpec} />

      <main className="mx-auto max-w-4xl px-6 py-16 space-y-10">
        <Link
          href={`/s/${leadSlug}/blog`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Articles Library
        </Link>

        {/* Article Header */}
        <div className="space-y-4 border-b border-border pb-8">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {article.category}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>By {payload.businessName}</span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.readTime} read
            </span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-base leading-relaxed text-foreground">
          {article.sections.map((sec) => (
            <section key={sec.h2} className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {sec.h2}
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        {/* Embedded Google AI Q&A Schema Section */}
        {article.faqs.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7 space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-4">
              {article.faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-card-foreground">Q: {faq.q}</p>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action Quote Banner */}
        <div className="rounded-2xl bg-card border border-border p-8 shadow-sm flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Licensed & Insured NYC Electricians
            </span>
            <h3 className="text-2xl font-bold text-card-foreground mt-1">
              Need Expert Electrical Work?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Free estimates across Queens and NYC. Fast response for all residential & commercial projects.
            </p>
          </div>
          <a
            href={`tel:${(payload.nap.phone || "7183537227").replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 shrink-0"
          >
            <Phone className="h-4 w-4" /> Call {payload.nap.phone || "(718) 353-7227"}
          </a>
        </div>
      </main>

      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
