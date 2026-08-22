import { Bot, CheckCircle2, Clock, Gauge, Layers, Smartphone } from "lucide-react";

interface ProposalSpeedScorecardProps {
  beforeScore: number;
  beforeLcp: string;
}

export function ProposalSpeedScorecard({ beforeScore, beforeLcp }: ProposalSpeedScorecardProps) {
  const metrics = [
    {
      icon: Smartphone,
      label: "Mobile Speed Score",
      beforeVal: beforeScore,
      afterVal: 98,
      lift: "70× Faster",
      desc: "0.12s first contentful paint on 4G cellular",
    },
    {
      icon: Clock,
      label: "Load Time (LCP)",
      beforeVal: 15,
      afterVal: 96,
      lift: `0.12s vs ${beforeLcp}`,
      desc: "Instant render stops emergency customers bouncing",
    },
    {
      icon: Layers,
      label: "Visual Stability (CLS)",
      beforeVal: 20,
      afterVal: 100,
      lift: "0.00 Shift",
      desc: "Zero layout jumping when tapping call buttons",
    },
    {
      icon: Bot,
      label: "Local Schema Types",
      beforeVal: 0,
      afterVal: 100,
      lift: "4 Schemas",
      desc: "LocalBusiness & Industry entity markup active",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#533afd]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              SEO & Technical Speed Health Monitor
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0d1738]">
            Diagnostic Scorecard: {beforeScore}/100 Baseline → 98/100 Rebuilt Platform
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" /> 70× Speed Lift
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-4 pt-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm text-[#533afd]">
                <m.icon className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center rounded-full bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0b8f5b]">
                {m.lift}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#0d1738]">{m.label}</span>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-10 text-[#ba1a1a] font-bold">Old</span>
                  <div className="h-1.5 flex-1 rounded-full bg-[#e5e7f2] overflow-hidden">
                    <div className="h-full bg-[#ba1a1a] rounded-full" style={{ width: `${m.beforeVal}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-[#ba1a1a]">{m.beforeVal}%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-10 text-[#0b8f5b] font-bold">Rebuilt</span>
                  <div className="h-1.5 flex-1 rounded-full bg-[#e5e7f2] overflow-hidden">
                    <div className="h-full bg-[#0b8f5b] rounded-full" style={{ width: `${m.afterVal}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-[#0b8f5b] font-bold">{m.afterVal}%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#777588] leading-tight pt-1">{m.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
