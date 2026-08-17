import landing from "../../../content/landing.json";
import { Badge } from "@/components/ui/badge";

// Real section motion in code (no Lottie-of-nothing, no page builder) —
// a drawn-in SVG line + soft floating shapes via CSS animation, matching
// the "designed in code so motion stays sharp" requirement without pulling
// in a JS animation library the free tier of this build doesn't need yet.
function HeroMotif() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 400"
      className="pointer-events-none absolute inset-x-0 -top-10 -z-10 mx-auto h-[26rem] w-full max-w-3xl opacity-70"
    >
      <defs>
        <linearGradient id="motif-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="80" r="46" fill="hsl(var(--primary) / 0.08)" className="animate-[float_7s_ease-in-out_infinite]" />
      <circle cx="480" cy="120" r="30" fill="hsl(var(--accent-foreground) / 0.08)" className="animate-[float_9s_ease-in-out_infinite_1s]" />
      <rect x="420" y="260" width="70" height="70" rx="16" fill="hsl(var(--primary) / 0.06)" className="animate-[float_8s_ease-in-out_infinite_0.5s]" />
      <path
        d="M40 320 C 160 220, 260 380, 380 220 S 560 120, 580 60"
        fill="none"
        stroke="url(#motif-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        className="animate-[draw_2.4s_ease-out_forwards]"
        style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
      />
    </svg>
  );
}

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <video autoPlay muted loop playsInline aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30">
        <source src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4" type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.38),transparent_42%),linear-gradient(115deg,#080512_0%,#171027_60%,#090713_100%)] opacity-90" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-20 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
        <div>
          <Badge variant="secondary" className="mb-5 border border-white/15 bg-white/10 text-white">
            30-day managed lead engine for US home-service businesses
          </Badge>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            {landing.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">{landing.subhead}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">No website project. No long contract. One measurable acquisition sprint.</p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Start with a qualification review</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Show us the business you want to grow.</h2>
          {children}
          <p className="mt-4 text-xs text-slate-500">{landing.trustLine}</p>
        </div>
      </div>
    </section>
  );
}
