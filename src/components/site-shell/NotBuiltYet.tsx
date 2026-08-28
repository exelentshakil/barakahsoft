import { Sparkles, Loader2 } from "lucide-react";

// Shown when a lead's site has been requested but not generated yet.
export function NotBuiltYet({ businessName }: { businessName: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24 bg-[#f9f9ff]">
      <div className="max-w-md text-center space-y-4 rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-10 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f3ff] text-[#533afd] border border-[#c7d0fb]">
          <Loader2 className="h-7 w-7 animate-spin text-[#533afd]" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#533afd] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Generation Active
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0d1738]">{businessName}</h1>
          <p className="text-sm leading-relaxed text-[#42506a]">
            Your bespoke high-converting website is building in real time. Sections will appear here as each step completes.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Live Auto-Refreshing Preview
          </span>
        </div>
      </div>
    </main>
  );
}
