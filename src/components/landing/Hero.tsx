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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[40rem] bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]"
      />
      <HeroMotif />
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <Badge variant="secondary" className="mb-5">
          30-day managed lead engine for US home-service businesses
        </Badge>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
          {landing.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{landing.subhead}</p>
        {children}
        <p className="mt-4 text-xs text-muted-foreground">{landing.trustLine}</p>
      </div>
    </section>
  );
}
