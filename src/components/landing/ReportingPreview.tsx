import { ArrowUpRight, BarChart3, CheckCircle2, CircleDollarSign, PhoneCall } from "lucide-react";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

const CHANNELS = [
  ["Meta ads", "Campaign activity and creative testing", "Active"],
  ["Landing page", "Visits, requests, and conversion path", "Connected"],
  ["Lead routing", "Contact details and requested service", "Ready"],
];

export function ReportingPreview() {
  return (
    <section className="border-b border-border bg-[#eef7ff] py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <SectionEyebrow icon={BarChart3} align="left">What you can see</SectionEyebrow>
            <h2 className="mt-4 font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">No black-box marketing. See what is happening every week.</h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">You see where the campaign is running, what people are asking for, and what we are changing next. The goal is a clear path from ad spend to real conversations.</p>
            <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-primary"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10"><ArrowUpRight className="h-4 w-4" /></span> Your account. Your data. Your decisions.</div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#cfe3f5] bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-[#dcecf8] px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Illustrative program view</p><p className="mt-1 font-semibold text-foreground">30-day lead engine</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Preview</span></div>
            <div className="grid gap-3 p-6 sm:grid-cols-3">
              {[["30", "qualified lead target", CircleDollarSign], ["$25/day", "recommended ad test", BarChart3], ["Weekly", "review and improve", PhoneCall]].map(([value, label, Icon]) => <div key={label as string} className="rounded-2xl bg-[#f6fbff] p-4"><Icon className="h-5 w-5 text-primary" /><p className="mt-5 text-xl font-bold text-foreground">{value as string}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{label as string}</p></div>)}
            </div>
            <div className="mx-6 rounded-2xl border border-border"><div className="grid grid-cols-[1fr_auto] border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span>System area</span><span>Status</span></div>{CHANNELS.map(([name, detail, status]) => <div key={name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-4 py-4 last:border-0"><div><p className="text-sm font-semibold text-foreground">{name}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {status}</span></div>)}</div>
            <p className="px-6 py-5 text-xs leading-5 text-muted-foreground">Illustrative preview of a BarakahSoft lead-engine program. Actual reporting reflects your campaign, channels, ad budget, lead sources, and connected data.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
