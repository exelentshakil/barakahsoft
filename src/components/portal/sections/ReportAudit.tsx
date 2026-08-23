import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { SiteAudit } from "@/lib/audit/site-audit";

// What is wrong with the client's current site, in their language.
//
// This is half the sale. It works because every line is checkable — the
// owner can open their own site while reading it — which is exactly why
// none of it may ever be invented, and why the panel it replaced (a fixed
// list of "friction points" identical for every client) could not do this
// job however good it looked.
//
// Each finding is stated as what is true, what it costs, and what changes.
// A score tells someone they are losing; a sentence tells them why.

const TONE: Record<string, { border: string; chip: string; label: string }> = {
  critical: { border: "border-l-[#ba1a1a]", chip: "bg-[#fdeaea] text-[#ba1a1a]", label: "Costing you work" },
  warning: { border: "border-l-[#b7791f]", chip: "bg-[#fdf3e2] text-[#8a5b00]", label: "Holding you back" },
  ok: { border: "border-l-[#0b8f5b]", chip: "bg-[#eaf8f0] text-[#0b8f5b]", label: "Working" },
};

export function ReportAudit({ audit, businessName }: { audit: SiteAudit; businessName: string }) {
  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
      <div className="border-b border-[#e5e7f2] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#533afd]">Website diagnostic</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0d1738] sm:text-3xl">
          {audit.criticalCount > 0
            ? `${audit.criticalCount} ${audit.criticalCount === 1 ? "thing is" : "things are"} costing ${businessName} work right now`
            : `What we found on your current site`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#42506a]">
          Everything below is on your site today. Open it alongside this page and check any of it.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {audit.findings.map((finding) => {
          const tone = TONE[finding.severity] ?? TONE.warning;
          return (
            <article key={finding.title} className={`rounded-xl border border-[#e5e7f2] border-l-4 ${tone.border} bg-[#fbfbfd] p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-[#0d1738]">{finding.title}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.chip}`}>
                  {tone.label}
                </span>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-[#42506a]">{finding.finding}</p>

              {/* A passing check has no consequence, and rendering the row
                  anyway left a red warning triangle floating beside nothing
                  on every "working" card -- a page that says WORKING and
                  shows an alarm icon next to it reads as broken. */}
              {finding.consequence && (
                <p className="mt-3 flex gap-2 text-[13px] leading-relaxed text-[#42506a]">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ba1a1a]" />
                  <span>{finding.consequence}</span>
                </p>
              )}

              <p className="mt-3 flex gap-2 border-t border-[#e5e7f2] pt-3 text-[13px] leading-relaxed text-[#0b6b45]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0b8f5b]" />
                <span>
                  <b className="font-semibold">In your new site: </b>
                  {finding.resolution}
                </span>
              </p>
            </article>
          );
        })}
      </div>

      {audit.speedScore !== null && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-wide text-[#777588]">Measured by Google</span>
          <span className="flex items-center gap-2 text-sm font-semibold text-[#0d1738]">
            Mobile speed
            <span className={`rounded px-2 py-0.5 font-bold ${audit.speedScore < 50 ? "bg-[#fdeaea] text-[#ba1a1a]" : "bg-[#fdf3e2] text-[#8a5b00]"}`}>
              {audit.speedScore}/100
            </span>
            <ArrowRight className="h-4 w-4 text-[#777588]" />
            <span className="rounded bg-[#eaf8f0] px-2 py-0.5 font-bold text-[#0b8f5b]">Rebuilt for speed</span>
          </span>
        </div>
      )}
    </section>
  );
}
