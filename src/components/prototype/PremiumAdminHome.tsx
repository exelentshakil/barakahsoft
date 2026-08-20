"use client";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  PhoneCall,
  Plus,
  Send,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIPELINE_DATA = [
  { stage: "New Leads", count: 12, value: "$9,564" },
  { stage: "Research / Brief", count: 4, value: "$3,188" },
  { stage: "Report Ready", count: 3, value: "$2,391", active: true },
  { stage: "Conversation", count: 4, value: "$3,188" },
  { stage: "Paid / Production", count: 4, value: "$3,188" },
];

const REVENUE_TREND = [
  { day: "Aug 14", collected: 797, projected: 1594 },
  { day: "Aug 15", collected: 1594, projected: 2391 },
  { day: "Aug 16", collected: 2391, projected: 3188 },
  { day: "Aug 17", collected: 2391, projected: 3985 },
  { day: "Aug 18", collected: 3188, projected: 4782 },
  { day: "Aug 19", collected: 3188, projected: 5579 },
  { day: "Aug 20", collected: 3985, projected: 6376 },
];

const PRIORITY_LEADS = [
  {
    id: "LD-2024-893",
    name: "York Electrical",
    trade: "Licensed Electricians",
    location: "Queens, NY",
    status: "Report Ready",
    temperature: "Warm Lead",
    estValue: "$797 + $497/mo",
    nextAction: "Send Master Report & Concept",
    due: "Immediate",
    priority: true,
  },
  {
    id: "LD-2024-890",
    name: "Summit HVAC & Cooling",
    trade: "HVAC & Heat Pumps",
    location: "Nassau County, NY",
    status: "In Conversation",
    temperature: "Hot Lead",
    estValue: "$797",
    nextAction: "Reply to proposal question on Crisp",
    due: "Today, 2:00 PM",
  },
  {
    id: "LD-2024-887",
    name: "Brightline Emergency Plumbing",
    trade: "24/7 Plumbers",
    location: "Brooklyn, NY",
    status: "Payment Pending",
    temperature: "Closing",
    estValue: "$797 + $497/mo",
    nextAction: "Verify Stripe checkout completion",
    due: "Today, 5:00 PM",
  },
  {
    id: "LD-2024-884",
    name: "John Roofing & Siding",
    trade: "Roofing Contractors",
    location: "Suffolk County, NY",
    status: "Researching",
    temperature: "New",
    estValue: "$797",
    nextAction: "Generate Brief & 7×7 Map Grid",
    due: "Tomorrow, 10:00 AM",
  },
];

export function PremiumAdminHome({
  setView,
}: {
  setView: (view: "Overview" | "Lead workspace" | "Reports" | "Communications" | "Delivery" | "Settings") => void;
}) {
  return (
    <div className="space-y-8">
      {/* 1. TOP TITLE & FAST ACTION */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#533afd]">
            Executive Command Center
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[#0d1738] sm:text-4xl">
            Today
          </h1>
          <p className="mt-1 text-sm text-[#777588]">
            One prioritized decision pipeline moving inbound leads to collected revenue.
          </p>
        </div>
        <button
          onClick={() => setView("Lead workspace")}
          className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
        >
          <Plus className="h-4 w-4" /> Open York Workspace
        </button>
      </div>

      {/* 2. PRIMARY ACTION SPOTLIGHT & REVENUE PULSE */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Urgent Decision Hero */}
        <div className="rounded-2xl border border-[#c7d0fb] bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-ping" />
              <span className="rounded-full bg-[#e3dfff] px-3 py-1 text-xs font-bold text-[#533afd]">
                Priority Action Required
              </span>
            </div>
            <span className="text-xs font-mono text-[#777588]">Lead #LD-2024-893</span>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#0d1738]">York Electrical</h2>
              <span className="text-xs font-medium text-[#777588]">Queens, NY · $797 Value</span>
            </div>
            <p className="mt-1 text-base font-semibold text-[#533afd]">
              Action: Send the Master Report & Live Preview Link
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#42506a]">
              The 7×7 Local Map Grid, SEO Audit (95/100), 28 Service Pages, and 8-article content roadmap have been generated. Delivery email is drafted with the private magic link.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 border-t border-[#e5e7f2] pt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#777588]">
              <span>New Lead</span>
              <span>Research</span>
              <span className="text-[#533afd] font-bold">Report Ready</span>
              <span>Conversation</span>
              <span>Paid</span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-[#e8eeff]">
              <div className="w-3/5 rounded-full bg-[#533afd]" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setView("Reports")}
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              <Mail className="h-4 w-4" /> Open Report & Send Link <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("Communications")}
              className="inline-flex items-center gap-2 rounded-md border border-[#e5e7f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#0d1738] transition hover:bg-[#f0f3ff]"
            >
              <PhoneCall className="h-4 w-4" /> View Call Track Script
            </button>
          </div>
        </div>

        {/* Financial & Pipeline Pulse */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#777588]">
                Revenue Pulse
              </span>
              <CircleDollarSign className="h-5 w-5 text-[#533afd]" />
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-[#0d1738]">$3,985</p>
            <p className="mt-1 text-xs text-[#0b8f5b] font-semibold">
              + $797 pending payment today
            </p>

            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-2">
                <span className="text-[#777588]">Paid Builds (This Month)</span>
                <span className="font-bold text-[#0d1738]">5 clients ($3,985)</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-2">
                <span className="text-[#777588]">Awaiting Payment</span>
                <span className="font-bold text-[#533afd]">4 leads ($3,188)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#777588]">Blocked Revenue</span>
                <span className="font-bold text-[#ba1a1a]">$5,400 (Pending Action)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_TREND} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#533afd" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#533afd" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="collected" stroke="#533afd" fill="url(#revPulse)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE VELOCITY STAGES */}
      <section className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0d1738]">Lead Pipeline Velocity</h3>
            <p className="text-xs text-[#777588]">27 total active leads in flight</p>
          </div>
          <span className="rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd]">
            Avg Velocity: 48h to Delivery
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PIPELINE_DATA.map((p) => (
            <div
              key={p.stage}
              className={`rounded-xl border p-4 transition ${
                p.active
                  ? "border-[#533afd] bg-[#f0f3ff]"
                  : "border-[#e5e7f2] bg-[#f9f9ff]"
              }`}
            >
              <p className="text-xs font-semibold text-[#777588]">{p.stage}</p>
              <p className="mt-2 text-2xl font-bold text-[#0d1738]">{p.count}</p>
              <p className="mt-1 text-xs font-medium text-[#533afd]">{p.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HIGH-INTENT PRIORITY ACTION QUEUE */}
      <section className="overflow-hidden rounded-2xl border border-[#e5e7f2] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7f2] p-6">
          <div>
            <h3 className="text-lg font-semibold text-[#0d1738]">Action Queue</h3>
            <p className="text-xs text-[#777588]">Every qualified lead with a single deterministic next action.</p>
          </div>
          <button
            onClick={() => setView("Lead workspace")}
            className="text-xs font-bold text-[#533afd] hover:underline"
          >
            View All 27 Leads <ChevronRight className="inline h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-[#e5e7f2]">
          {PRIORITY_LEADS.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col justify-between gap-4 p-5 transition hover:bg-[#f9f9ff] sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f3ff] text-sm font-bold text-[#533afd]">
                  {lead.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0d1738]">{lead.name}</p>
                    <span className="rounded-full bg-[#f0f3ff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                      {lead.trade}
                    </span>
                  </div>
                  <p className="text-xs text-[#777588]">{lead.location} · {lead.estValue}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold text-[#0d1738]">{lead.nextAction}</p>
                  <p className="text-[11px] font-medium text-[#ba1a1a]">Due: {lead.due}</p>
                </div>
                <button
                  onClick={() => setView(lead.priority ? "Reports" : "Lead workspace")}
                  className="inline-flex items-center gap-1 rounded-md bg-[#533afd] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
                >
                  Action <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
