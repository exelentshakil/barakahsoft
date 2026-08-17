import landing from "../../../content/landing.json";
import { Badge } from "@/components/ui/badge";

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-20 sm:pt-28 lg:grid-cols-[1fr_0.9fr] lg:pb-24">
        <div>
          <Badge variant="secondary" className="mb-6">
            30-day managed lead engine for US home-service businesses
          </Badge>
          <h1 className="max-w-3xl font-sans text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl">
            {landing.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{landing.subhead}</p>
          <p className="mt-6 max-w-lg text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">No website project. No long contract. One measurable acquisition sprint.</p>
        </div>
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-border bg-muted shadow-lift">
            <video autoPlay muted loop playsInline controls preload="metadata" className="aspect-video w-full object-cover">
              <source src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4" type="video/mp4" />
            </video>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">How the lead engine works</span><span>BarakahSoft LLC</span></div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Start with a qualification review</p>
            <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight">Show us the business you want to grow.</h2>
            {children}
            <p className="mt-4 text-xs text-muted-foreground">{landing.trustLine}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
