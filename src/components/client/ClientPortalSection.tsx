"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  FileText,
  Globe2,
  Layers,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ClientPortalChrome } from "@/components/client/ClientPortalChrome";

const SECTION_CONTENT = {
  leads: {
    title: "Project Timeline & Activity",
    eyebrow: "Live Status",
    intro: "Real-time updates as our engineering team audits and builds your website.",
    items: [
      { name: "Verified Brief Generated", detail: "Extracted 28 services, license #11288, and Queens areas", date: "Aug 19", status: "Complete" },
      { name: "Local Search Grid (49 Points)", detail: "Identified 39 missing local pack search locations", date: "Aug 19", status: "Complete" },
      { name: "Homepage Direction Rebuilt", detail: "Mobile-first 0.12s first paint with Google proof hero", date: "Aug 19", status: "Ready for Review" },
      { name: "28 Service Pages Generated", detail: "Dedicated pages for Panel Upgrades, EV, DOB Violations", date: "Aug 19", status: "Ready for Review" },
    ],
  },
  reports: {
    title: "Master Audit & Competitor Benchmark",
    eyebrow: "Evidence Engine",
    intro: "Comprehensive breakdown of your search visibility, competitor rankings, and technical scorecard.",
    items: [
      { name: "PageSpeed & Core Web Vitals", detail: "Improved from 29/100 to 95/100 LCP score", date: "Verified", status: "Fortified" },
      { name: "7×7 Local Geographic Map Grid", detail: "Current visibility: 10 of 49 Queens search zones", date: "49 Checkpoints", status: "Analyzed" },
      { name: "Top 3 Competitor Comparison", detail: "Entech Electrical & Brightline Power benchmarked", date: "Verified", status: "Completed" },
    ],
  },
  website: {
    title: "Complete Sitemap & Content Library",
    eyebrow: "Website Architecture",
    intro: "Explore every generated service page and original article built for your business.",
    items: [
      { name: "Commercial & Residential Services", detail: "28 high-converting service landing pages", date: "28 Routes", status: "Ready" },
      { name: "8-10 Original Launch Articles", detail: "Grounded in local NYC codes, EV permits, and panel upgrades", date: "8 Articles", status: "Ready" },
      { name: "About Us & Contact Dispatch", detail: "37-year family story and 1-tap emergency dispatch", date: "2 Routes", status: "Ready" },
    ],
  },
  account: {
    title: "Ownership, Verification & Handoff",
    eyebrow: "Client Guarantee",
    intro: "Everything we build is 100% owned by your company. Download clean standalone project files anytime.",
    items: [
      { name: "Clean Next.js 15 Source Code", detail: "Exportable standalone project zip with zero vendor lock-in", date: "Version 1.0", status: "Ready" },
      { name: "Custom Domain Connection", detail: "yorkelectrical.com DNS verification instructions", date: "DNS", status: "Configured" },
      { name: "Support & Direct Team Chat", detail: "Direct line to Shakil and the engineering team via Crisp", date: "24/7", status: "Active" },
    ],
  },
} as const;

export function ClientPortalSection({ section }: { section: keyof typeof SECTION_CONTENT }) {
  const data = SECTION_CONTENT[section];

  return (
    <ClientPortalChrome>
      <main className="min-h-screen bg-[#f9f9ff] px-6 py-10 text-[#0d1738] lg:px-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <Link
            href="/client-portal-prototype"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Project Overview
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                {data.eyebrow}
              </span>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0d1738]">
                {data.title}
              </h1>
              <p className="mt-1 text-sm text-[#777588]">{data.intro}</p>
            </div>
            <Link
              href="/client-portal-prototype"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#432bd9]"
            >
              Open Full Master Report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white shadow-sm">
            <div className="border-b border-[#e5e7f2] p-5">
              <h3 className="font-bold text-[#0d1738]">{data.title} Overview</h3>
              <p className="text-xs text-[#777588]">York Electrical Contractors · Verified Project State</p>
            </div>

            <div className="divide-y divide-[#e5e7f2]">
              {data.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-[#f9f9ff] sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0d1738]">{item.name}</p>
                      <p className="text-xs text-[#777588]">{item.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                      {item.status}
                    </span>
                    <Link
                      href="/client-portal-prototype"
                      className="rounded-md border border-[#e5e7f2] px-3 py-1.5 text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff]"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </ClientPortalChrome>
  );
}
