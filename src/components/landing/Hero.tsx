import landing from "../../../content/landing.json";
import { Badge } from "@/components/ui/badge";

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
      <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-16 sm:pt-24 lg:grid-cols-[1fr_0.9fr] lg:pb-20">
        <div>
          <Badge variant="secondary" className="mb-6">
            30-day managed lead engine for US home-service businesses
          </Badge>
          <h1 className="max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
            {landing.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{landing.subhead}</p>
          <p className="mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">No website project. No long contract. One measurable acquisition sprint.</p>
          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
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
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Start with a qualification review</p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight">Show us the business you want to grow.</h2>
            {children}
            <p className="mt-4 text-xs text-muted-foreground">{landing.trustLine}</p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
              <a href="tel:+13075336678" className="hover:text-primary">+1 (307) 533-6678</a>
              <a href="mailto:hello@barakahsoft.com" className="hover:text-primary">hello@barakahsoft.com</a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-muted shadow-lift">
            <video autoPlay muted loop playsInline controls preload="metadata" className="aspect-video w-full object-cover">
              <source src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">Creative + funnel + follow-up</div>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">What we build and run for you</span><span>BarakahSoft LLC</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
