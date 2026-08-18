"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  CircleAlert,
  Globe2,
  LayoutDashboard,
  Mail,
  Menu,
  MoreHorizontal,
  Search,
  Send,
  Settings2,
  Users,
  WandSparkles,
} from "lucide-react";

const TABS = [
  "Overview",
  "Build workspace",
  "Website",
  "Campaign",
  "Communication",
  "Delivery",
] as const;
type Tab = (typeof TABS)[number];

const PIPELINE = [
  ["New leads", "12", "3 need a first response", "blue"],
  ["Building", "4", "2 previews ready today", "yellow"],
  ["Needs review", "3", "Your next actions", "purple"],
  ["Active clients", "6", "$12,990 recurring", "green"],
] as const;

const ACTIVITY = [
  ["Website research complete", "York Electrical Contractors", "8 min ago"],
  ["Homepage preview ready for review", "John Roofing", "24 min ago"],
  ["Lead replied to preview email", "Summit HVAC", "1 hr ago"],
  ["CNAME verified", "Brightline Plumbing", "2 hrs ago"],
];

const TAB_DATA: Record<Tab, [string, string, string][]> = {
  Overview: [
    ["Open builds", "4", "2 ready for QA"],
    ["Missing info", "3", "Need your input"],
    ["Next action", "Review", "John Roofing preview"],
  ],
  "Build workspace": [
    ["Research", "Complete", "Firecrawl, Google, and media collected"],
    ["Design direction", "Ready", "3 roofer references selected"],
    ["QA", "7 / 9", "Two items need your review"],
  ],
  Website: [
    ["Homepage", "Preview ready", "/s/john-roofing"],
    ["Services", "6 pages", "Internal links connected"],
    ["SEO", "Healthy", "Metadata and schema present"],
  ],
  Campaign: [
    ["Qualified leads", "30 target", "First 30-day KPI"],
    ["Ad account", "Connected", "Customer-owned Meta account"],
    ["Next review", "Friday", "Creative and lead quality"],
  ],
  Communication: [
    ["Preview email", "Ready", "Personalized opener"],
    ["Follow-up", "4 drafts", "Manual send enabled"],
    ["Reply", "1 waiting", "Summit HVAC"],
  ],
  Delivery: [
    ["Domain", "Pending CNAME", "quote.johnroofing.com"],
    ["Contract", "Draft ready", "Review before signature"],
    ["Export", "Available", "GitHub + Vercel"],
  ],
};

const TONE: Record<string, string> = {
  blue: "bg-[#eaf5ff] text-[#075da8]",
  yellow: "bg-[#fff8d9] text-[#8c6800]",
  purple: "bg-[#f1edff] text-[#702486]",
  green: "bg-[#eaf8f0] text-[#167044]",
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#d9e8f4] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminPrototype() {
  const [tab, setTab] = useState<Tab>("Overview");
  return (
    <div className="min-h-screen bg-[#f5f9fc] text-[#1e212b]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-[#07284d] text-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffd12d] p-1">
            <img src="/icon.png" alt="" className="h-full w-full" />
          </div>
          <div>
            <p className="font-bold">BarakahSoft</p>
            <p className="text-xs text-white/55">Lead Engine</p>
          </div>
        </div>
        <nav className="space-y-1 px-4 py-6">
          {[
            [LayoutDashboard, "Command center", "/admin-prototype"],
            [Users, "Leads", "/admin-prototype/leads"],
            [BarChart3, "Reports", "/admin-prototype/reports"],
            [Send, "Communications", "/admin-prototype/communications"],
            [Globe2, "Domains", "/admin-prototype/domains"],
            [Settings2, "Settings", "/admin-prototype/settings"],
          ].map(([Icon, label, href], index) => (
            <Link
              key={label as string}
              href={href as string}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${index === 0 ? "bg-white/10 text-[#ffd12d]" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="h-4 w-4" />
              {label as string}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd12d] text-xs font-bold text-[#07284d]">
              SA
            </div>
            <div>
              <p className="text-sm font-semibold">Shakil Ahmed</p>
              <p className="text-xs text-white/50">Owner workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#d9e8f4] bg-white/90 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-[#07284d]">Command center</p>
              <p className="text-xs text-[#7890a5]">
                Wednesday, August 19, 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-[#d9e8f4] px-3 py-2 text-xs text-[#7890a5] sm:flex">
              <Search className="h-4 w-4" />
              Search leads
            </div>
            <button className="rounded-lg border border-[#d9e8f4] p-2 text-[#60778d]">
              <CircleAlert className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#f1edff] text-center text-xs font-bold leading-8 text-[#702486]">
              SA
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
                Operations overview
              </p>
              <h1 className="mt-2 font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d]">
                Your lead engine at a glance.
              </h1>
              <p className="mt-2 text-sm text-[#60778d]">
                Build the preview. Start the conversation. Know what needs
                attention next.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-4 py-2.5 text-sm font-bold text-[#111] shadow-sm">
              <WandSparkles className="h-4 w-4" /> Add a lead
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PIPELINE.map(([label, value, detail, tone]) => (
              <Panel key={label} className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-[#60778d]">
                    {label}
                  </p>
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${TONE[tone]}`}
                  >
                    Live
                  </span>
                </div>
                <p className="mt-7 font-sans text-4xl font-semibold text-[#07284d]">
                  {value}
                </p>
                <p className="mt-1 text-xs text-[#7890a5]">{detail}</p>
              </Panel>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#d9e8f4] p-5">
                <div>
                  <p className="text-lg font-bold text-[#07284d]">
                    Lead pipeline
                  </p>
                  <p className="mt-1 text-xs text-[#7890a5]">
                    Every inquiry, from first click to active customer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-[#eaf5ff] px-2.5 py-1 text-xs font-bold text-[#075da8]">
                    All leads · 25
                  </span>
                  <button className="rounded-lg border border-[#d9e8f4] p-2 text-[#60778d]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-4">
                {[
                  ["New", "12", "#eaf5ff", "Website audit requested"],
                  ["In production", "4", "#fff8d9", "Preview being built"],
                  ["Conversation", "3", "#f1edff", "Needs your follow-up"],
                  ["Active", "6", "#eaf8f0", "Weekly program live"],
                ].map(([title, count, color, detail]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-[#d9e8f4] bg-[#fbfdff] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#60778d]">
                        {title}
                      </p>
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    <p className="mt-5 text-3xl font-bold text-[#07284d]">
                      {count}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#7890a5]">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#d9e8f4] px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                    Needs attention
                  </p>
                  <button className="text-xs font-bold text-[#0c68c8]">
                    View all <ArrowRight className="inline h-3 w-3" />
                  </button>
                </div>
                <div className="mt-3 divide-y divide-[#e8f0f6]">
                  {[
                    [
                      "John Roofing",
                      "Preview ready · send the opener",
                      "Review now",
                      "blue",
                    ],
                    [
                      "Summit HVAC",
                      "Lead replied · schedule a call",
                      "Reply",
                      "purple",
                    ],
                    [
                      "Brightline Plumbing",
                      "CNAME verified · ready to publish",
                      "Publish",
                      "green",
                    ],
                  ].map(([name, detail, action, tone]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#07284d]">
                          {name}
                        </p>
                        <p className="mt-1 text-xs text-[#7890a5]">{detail}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${TONE[tone]}`}
                      >
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel>
              <div className="border-b border-[#d9e8f4] p-5">
                <p className="text-lg font-bold text-[#07284d]">Activity</p>
                <p className="mt-1 text-xs text-[#7890a5]">
                  Recent system events.
                </p>
              </div>
              <div className="divide-y divide-[#e8f0f6] px-5">
                {ACTIVITY.map(([title, business, time]) => (
                  <div key={`${title}-${business}`} className="flex gap-3 py-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f7ff] text-[#0c68c8]">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#07284d]">
                        {title}
                      </p>
                      <p className="mt-1 text-xs text-[#60778d]">{business}</p>
                      <p className="mt-1 text-[11px] text-[#9ab0c1]">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="mt-8 overflow-hidden">
            <div className="flex gap-1 overflow-x-auto border-b border-[#d9e8f4] p-2">
              {TABS.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === item ? "bg-[#07284d] text-white" : "text-[#60778d] hover:bg-[#eef7ff]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="p-5 lg:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
                    {tab}
                  </p>
                  <h2 className="mt-2 font-sans text-2xl font-semibold text-[#07284d]">
                    {tab === "Build workspace"
                      ? "John Roofing · production workspace"
                      : tab === "Website"
                        ? "Approved sites and previews"
                        : tab === "Campaign"
                          ? "Campaigns and qualified opportunities"
                          : tab === "Communication"
                            ? "Preview emails and follow-up"
                            : tab === "Delivery"
                              ? "Domains, contracts, and export"
                              : "Recent work across the business"}
                  </h2>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-[#eaf8f0] px-2.5 py-1 text-xs font-bold text-[#167044]">
                  <Check className="mr-1 h-3 w-3" /> Fixture data only
                </span>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {TAB_DATA[tab].map(([label, value, detail]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#d9e8f4] bg-[#f8fbfe] p-5"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                      {label}
                    </p>
                    <p className="mt-4 text-xl font-bold text-[#07284d]">
                      {value}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#60778d]">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
