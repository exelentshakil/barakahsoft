import landing from "../../../content/landing.json";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness, Megaphone, TrendingUp } from "lucide-react";

const HERO_STEPS: { number: string; title: string; body: string; icon: typeof BriefcaseBusiness }[] = [
  { number: "01", title: "Build", body: "Offer, page, tracking", icon: BriefcaseBusiness },
  { number: "02", title: "Launch", body: "Meta ads and creative", icon: Megaphone },
  { number: "03", title: "Improve", body: "Leads and follow-up", icon: TrendingUp },
];

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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {children}
            <a href="tel:+13075336678" className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm font-bold text-foreground transition hover:border-primary hover:text-primary">Call +1 (307) 533-6678</a>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground"><span>$500/week management</span><span>Ad spend stays in your account</span><span>Stop after one week if it&apos;s not a fit</span></div>
          <p className="mx-auto mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">No website project. No long contract. One measurable acquisition sprint.</p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {HERO_STEPS.map(({ number, title, body, icon: Icon }) => (
              <div key={number} className="rounded-2xl border border-border bg-card/80 p-4 shadow-card backdrop-blur">
                <div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><p className="text-xs font-bold text-primary">{number}</p></div>
                <p className="mt-5 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-muted text-left shadow-lift">
          <div className="absolute left-5 top-5 z-10 rounded-full border border-white/30 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">The trades we support</div>
            <video autoPlay muted loop playsInline controls preload="metadata" className="aspect-video w-full object-cover">
              <source src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4" type="video/mp4" />
            </video>
          <div className="flex flex-col gap-5 border-t border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-sm font-bold text-foreground">Our trade focus: electricians, plumbers, HVAC, roofers, movers, and restoration.</p><p className="mt-1 text-xs text-muted-foreground">This short reel introduces the industries we serve. The strategy, creative, and campaign work is handled by our team.</p></div><span className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-primary">Research. Create. Launch.</span></div>
        </div>
      </div>
    </section>
  );
}
