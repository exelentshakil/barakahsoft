import { Building2, Droplets, Hammer, Home, ShieldCheck, Truck, Wrench, Zap } from "lucide-react";

const VERTICALS = [
  [Zap, "Electricians", "Panels, repairs, EV charging"],
  [Droplets, "Plumbers", "Emergency and replacement work"],
  [Wrench, "HVAC", "Service, repair, and installation"],
  [Home, "Roofers", "Repair, replacement, and exterior"],
  [Hammer, "Remodelers", "High-value renovation projects"],
  [Truck, "Movers", "Local and specialty moving"],
  [ShieldCheck, "Restoration", "Water, fire, and property recovery"],
  [Building2, "Contractors", "Residential and commercial work"],
] as const;

const SIGNALS = [
  { label: "Northeast", x: "25%", y: "29%", delay: "0s" },
  { label: "Southeast", x: "61%", y: "69%", delay: "1.2s" },
  { label: "Midwest", x: "47%", y: "38%", delay: "2.1s" },
  { label: "Mountain", x: "35%", y: "51%", delay: "0.7s" },
  { label: "West", x: "16%", y: "57%", delay: "1.7s" },
];

export function IndustryCoverage() {
  return (
    <section id="industries" className="border-b border-[#d9e8f4] bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Industry coverage</p><h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">One lead engine. Built around the services you provide.</h2></div>
          <p className="max-w-xl text-lg leading-8 text-[#60778d]">We focus on US home-service businesses where a qualified conversation can turn into a valuable job. Your market, offer, and capacity still determine whether the program is a fit.</p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-[#c8ddec] bg-[#eef7ff] p-6 shadow-[0_18px_45px_rgba(7,40,77,0.08)] sm:min-h-[440px]">
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(12,104,200,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,104,200,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8fc6ff]/70 sm:h-72 sm:w-72"><div className="absolute inset-5 rounded-full border border-[#8fc6ff]/50" /><div className="absolute inset-12 rounded-full border border-[#8fc6ff]/40" /><div className="absolute left-1/2 top-1/2 h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-[#0c68c8]/50 bg-[#dff2ff] [clip-path:polygon(5%_35%,15%_15%,32%_20%,43%_8%,63%_17%,78%_11%,94%_29%,87%_44%,96%_61%,80%_66%,74%_86%,57%_78%,45%_94%,30%_78%,15%_87%,18%_66%,4%_57%)]" /></div>
            {SIGNALS.map((signal) => <div key={signal.label} className="absolute" style={{ left: signal.x, top: signal.y }}><span className="absolute -inset-2 animate-ping rounded-full bg-[#ffd12d]/40" style={{ animationDelay: signal.delay }} /><span className="relative block h-3 w-3 rounded-full border-2 border-white bg-[#ffd12d] shadow-[0_0_0_3px_rgba(12,104,200,0.25)]" /><span className="absolute left-5 top-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#0c68c8]">{signal.label}</span></div>)}
            <div className="absolute left-5 top-5 rounded-lg bg-[#07284d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">US home-service focus</div>
            <div className="absolute bottom-5 right-5 rounded-xl border border-white/70 bg-white/90 px-4 py-3 shadow-card"><p className="text-xs font-bold text-[#07284d]">Market signal</p><p className="mt-1 text-xs text-[#60778d]">Offer + location + demand</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">{VERTICALS.map(([Icon, title, body]) => <div key={title} className="group rounded-2xl border border-[#c8ddec] bg-[#f8fbfe] p-5 transition hover:-translate-y-1 hover:border-[#8fc6ff] hover:bg-white hover:shadow-card"><div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff7c7] text-[#07284d]"><Icon className="h-5 w-5" /></div><span className="text-xs font-bold uppercase tracking-wider text-[#8fc6ff]">Focus</span></div><p className="mt-6 font-bold text-[#07284d]">{title}</p><p className="mt-1 text-xs leading-5 text-[#657c90]">{body}</p></div>)}</div>
        </div>
        <p className="mt-8 text-center text-xs text-[#7890a5]">Coverage visual is illustrative. Campaign availability, lead volume, and target economics depend on the business, location, offer, and approved advertising budget.</p>
      </div>
    </section>
  );
}
