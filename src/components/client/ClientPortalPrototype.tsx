"use client";

import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Globe2,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

const METRICS = [
  ["Qualified opportunities", "18", "First 30-day sprint · target 30"],
  ["Form inquiries", "14", "Validated contact requests"],
  ["Tracked calls", "4", "Phone opportunities · disposition pending"],
  ["Ad spend", "$412", "Paid directly to Meta"],
];

export function ClientPortalPrototype() {
  return (
    <main className="min-h-screen bg-[#f5f9fc] text-[#1e212b]">
      <header className="border-b border-[#d9e8f4] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffd12d] p-1">
              <img src="/icon.png" alt="" className="h-full w-full" />
            </div>
            <div>
              <p className="font-bold text-[#07284d]">BarakahSoft</p>
              <p className="text-xs text-[#7890a5]">Client portal</p>
            </div>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#60778d] md:flex">
            <Link href="/client-portal-prototype">Overview</Link>
            <Link href="/client-portal-prototype/leads">Leads</Link>
            <Link href="/client-portal-prototype/reports">Reports</Link>
            <Link href="/client-portal-prototype/website">Website</Link>
            <Link href="/client-portal-prototype/account">Account</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="hidden items-center gap-2 text-sm font-semibold text-[#60778d] sm:flex">
              <MessageCircle className="h-4 w-4" /> Message your team
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf5ff] text-xs font-bold text-[#075da8]">
              JR
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
              John Roofing
            </p>
            <h1 className="mt-2 font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d]">
              Your lead engine is live.
            </h1>
            <p className="mt-2 text-sm text-[#60778d]">
              Here is what happened this week and what your team is working on
              next.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf8f0] px-3 py-1.5 text-xs font-bold text-[#167044]">
              <CheckCircle2 className="h-3.5 w-3.5" /> Campaign active
            </span>
            <button className="rounded-lg border border-[#c8ddec] bg-white px-4 py-2 text-sm font-bold text-[#07284d]">
              This week
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(([label, value, detail], index) => (
            <div
              key={label}
              className="rounded-2xl border border-[#d9e8f4] bg-white p-5 shadow-[0_8px_24px_rgba(7,40,77,0.04)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7890a5]">
                  {label}
                </p>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: index === 3 ? "#ffd12d" : "#0c68c8",
                  }}
                />
              </div>
              <p className="mt-6 font-sans text-4xl font-semibold text-[#07284d]">
                {value}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#7890a5]">{detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-[#d9e8f4] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.04)]">
            <div className="flex items-center justify-between border-b border-[#d9e8f4] p-5">
              <div>
                <p className="text-lg font-bold text-[#07284d]">
                  Recent opportunities
                </p>
                <p className="mt-1 text-xs text-[#7890a5]">
                  Form leads and tracked calls in one view.
                </p>
              </div>
              <button className="text-xs font-bold text-[#0c68c8]">
                View all <ArrowUpRight className="inline h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-[#e8f0f6]">
              {[
                ["Roof replacement", "Form inquiry", "Yesterday", "New"],
                [
                  "Storm damage inspection",
                  "Tracked call",
                  "Yesterday",
                  "Contacted",
                ],
                [
                  "Commercial roof repair",
                  "Form inquiry",
                  "Monday",
                  "Qualified",
                ],
                ["Gutter installation", "Form inquiry", "Monday", "New"],
              ].map(([service, source, time, status]) => (
                <div
                  key={`${service}-${time}`}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef7ff] text-[#0c68c8]">
                      {source === "Tracked call" ? (
                        <PhoneCall className="h-4 w-4" />
                      ) : (
                        <Globe2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#07284d]">
                        {service}
                      </p>
                      <p className="mt-1 text-xs text-[#7890a5]">
                        {source} · {time}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f8fbfe] px-2.5 py-1 text-xs font-bold text-[#60778d]">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-[#c8ddec] bg-[#eef7ff] p-6">
            <BarChart3 className="h-6 w-6 text-[#0c68c8]" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
              Weekly review
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#07284d]">
              What happens next
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#60778d]">
              Your BarakahSoft team reviews lead quality, campaign activity, and
              follow-up before the next cycle.
            </p>
            <div className="mt-8 space-y-3 text-sm font-semibold text-[#07284d]">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#167044]" /> Creative
                review Friday
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#167044]" /> Website and
                tracking connected
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#167044]" /> Your leads
                remain yours
              </p>
            </div>
          </section>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-[#d9e8f4] bg-white p-5 shadow-[0_8px_24px_rgba(7,40,77,0.04)] sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-[#07284d]">Website preview</p>
            <p className="mt-1 text-xs text-[#7890a5]">
              Your landing page and campaign assets are ready to review.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#ffd12d] px-4 py-2.5 text-sm font-bold text-[#111]">
            Open website <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-8 text-center text-xs text-[#9ab0c1]">
          This is a visual client-portal prototype. Actual reporting reflects
          your connected campaign, lead sources, ad budget, and CRM data.
        </p>
      </div>
    </main>
  );
}
