import landing from "../../../content/landing.json";
import { Badge } from "@/components/ui/badge";

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
      <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-24 lg:pb-20">
        <div className="mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            30-day managed lead engine for US home-service businesses
          </Badge>
          <h1 className="mx-auto max-w-4xl font-sans text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
            {landing.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{landing.subhead}</p>
          <p className="mx-auto mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">No website project. No long contract. One measurable acquisition sprint.</p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {[
              ["01", "Build", "Offer, page, tracking"],
              ["02", "Launch", "Meta ads and creative"],
              ["03", "Improve", "Leads and follow-up"],
            ].map(([number, title, body]) => (
              <div key={number} className="rounded-2xl border border-border bg-card/80 p-4 shadow-card backdrop-blur">
                <p className="text-xs font-bold text-primary">{number}</p>
                <p className="mt-5 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-muted text-left shadow-lift">
          <div className="absolute left-5 top-5 z-10 rounded-full border border-white/30 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">The BarakahSoft lead engine</div>
            <video autoPlay muted loop playsInline controls preload="metadata" className="aspect-video w-full object-cover">
              <source src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4" type="video/mp4" />
            </video>
          <div className="flex flex-col gap-5 border-t border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-sm font-bold text-foreground">Built for electricians, plumbers, HVAC, roofers, movers, and restoration teams.</p><p className="mt-1 text-xs text-muted-foreground">One system for the offer, page, ads, creative, tracking, and follow-up.</p></div><div className="shrink-0">{children}</div></div>
        </div>
      </div>
    </section>
  );
}
