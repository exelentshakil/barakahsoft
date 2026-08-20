"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  PackageCheck,
  Plus,
  Settings2,
  Upload,
} from "lucide-react";
import { AdminPrototypeChrome } from "@/components/admin/AdminPrototypeChrome";

const SECTION_CONTENT = {
  leads: {
    title: "Leads CRM",
    eyebrow: "Pipeline",
    intro: "Prioritized inbound leads from Facebook Ads and website forms.",
    items: [
      { name: "York Electrical", location: "Queens, NY", trade: "Electricians", status: "Report Ready", est: "$797" },
      { name: "Summit HVAC & Heat Pumps", location: "Nassau County, NY", trade: "HVAC", status: "Conversation", est: "$797 + $497/mo" },
      { name: "Brightline 24/7 Plumbing", location: "Brooklyn, NY", trade: "Plumbing", status: "Closing", est: "$797" },
      { name: "John Roofing & Siding", location: "Suffolk County, NY", trade: "Roofing", status: "Researching", est: "$797" },
      { name: "Evergreen Water Restoration", location: "Staten Island, NY", trade: "Restoration", status: "New", est: "$797" },
    ],
  },
  reports: {
    title: "Reports & Audit Engine",
    eyebrow: "Evidence Engine",
    intro: "Automated 7×7 search grids, PageSpeed performance, and competitor radar audits.",
    items: [
      { name: "York Electrical Master Audit", location: "Queens Grid 10/49", trade: "Generated Aug 19", status: "Ready to Send", est: "Score 95/100" },
      { name: "Summit HVAC Benchmark", location: "Long Island Grid 14/49", trade: "Generated Aug 18", status: "Sent", est: "Score 88/100" },
      { name: "Brightline Plumbing Scan", location: "Brooklyn Grid 8/49", trade: "Generated Aug 17", status: "Delivered", est: "Score 92/100" },
    ],
  },
  communications: {
    title: "Communications Hub",
    eyebrow: "Client Engagement",
    intro: "Track private magic-link opens, email sequences, and Crisp chat threads.",
    items: [
      { name: "York Electrical Delivery Email", location: "Draft ready with magic link", trade: "Resend", status: "Ready", est: "Email #1" },
      { name: "Summit HVAC Proposal Thread", location: "Customer replied on Crisp", trade: "Chat", status: "Needs Reply", est: "Active" },
      { name: "Brightline Follow-up Sequence", location: "Day-2 reminder scheduled", trade: "Automated", status: "Scheduled", est: "Email #2" },
    ],
  },
  domains: {
    title: "Domains & Build Exports",
    eyebrow: "Handoff",
    intro: "Connect customer-owned domains and download isolated Next.js project zips.",
    items: [
      { name: "yorkelectrical.com", location: "DNS CNAME verification", trade: "Production", status: "Pending DNS", est: "Vercel / AWS" },
      { name: "summit-hvac-v1.zip", location: "Clean standalone source", trade: "Export", status: "Built", est: "Next.js 15" },
      { name: "brightlineplumbing.com", location: "SSL & DNS active", trade: "Live", status: "Active", est: "Connected" },
    ],
  },
  settings: {
    title: "Platform Integrations & Config",
    eyebrow: "Infrastructure",
    intro: "Manage Firecrawl scrapers, Stripe payment keys, Resend domains, and Supabase auth.",
    items: [
      { name: "Firecrawl Web Extraction", location: "Branding + Markdown + Sitemap", trade: "API", status: "Connected", est: "Healthy" },
      { name: "Stripe Billing & Subscriptions", location: "$797 Website + $497/mo Retainers", trade: "Webhooks", status: "Live", est: "Connected" },
      { name: "Resend Transactional Mailer", location: "noreply@barakahsoft.com", trade: "Email", status: "Verified", est: "Healthy" },
      { name: "Crisp Real-time Chat", location: "Widget ID: 28d857ed", trade: "Support", status: "Active", est: "Connected" },
    ],
  },
} as const;

export function AdminPrototypeSection({ section }: { section: keyof typeof SECTION_CONTENT }) {
  const data = SECTION_CONTENT[section];

  return (
    <AdminPrototypeChrome>
      <main className="px-6 py-10 text-[#0d1738] lg:px-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <Link
            href="/admin-prototype"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#533afd] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Command Center
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
              href="/admin-prototype"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-4 py-2 text-xs font-semibold text-white hover:bg-[#432bd9]"
            >
              <Plus className="h-3.5 w-3.5" /> New Item
            </Link>
          </div>

          {/* List Matrix */}
          <div className="overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white shadow-sm">
            <div className="border-b border-[#e5e7f2] p-5">
              <h3 className="font-bold text-[#0d1738]">{data.title} Records</h3>
              <p className="text-xs text-[#777588]">Enterprise precision live state.</p>
            </div>

            <div className="divide-y divide-[#e5e7f2]">
              {data.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-[#f9f9ff] sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#0d1738]">{item.name}</p>
                      <span className="rounded-full bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                        {item.trade}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#777588]">{item.location}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <span className="rounded bg-[#f9f9ff] border border-[#e5e7f2] px-2 py-0.5 text-[10px] font-bold text-[#0d1738]">
                        {item.status}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-[#533afd]">{item.est}</p>
                    </div>
                    <Link
                      href="/admin-prototype"
                      className="rounded-md border border-[#e5e7f2] px-3 py-1.5 text-xs font-semibold text-[#0d1738] hover:bg-[#f0f3ff]"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AdminPrototypeChrome>
  );
}
