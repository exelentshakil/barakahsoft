import { CheckCircle2, Sparkles, Tag } from "lucide-react";
import type { SiteAudit } from "@/lib/audit/site-audit";

interface ProposalPricingSectionProps {
  businessName: string;
  setupPrice: number;
  monthlyPrice: number;
  standardValue: number;
  scopeItems: string[];
  audit?: SiteAudit | null;
}

export function ProposalPricingSection({
  businessName,
  setupPrice,
  monthlyPrice,
  standardValue,
  scopeItems,
  audit,
}: ProposalPricingSectionProps) {
  // Each line says the problem it solves rather than the thing we build. A
  // business owner does not want "LocalBusiness schema"; he wants to stop
  // losing the person who searched at nine at night and rang someone else.
  // Short enough to scan, because this is the section where a decision gets
  // made and a paragraph per line is a reason to put it off.
  //
  // Amounts are rounded to the nearest 25 and the headline total is their
  // sum, not a separately configured figure. Proportions of an odd anchor
  // produced "$402 Value" and "$97 Value" — an oddly precise number reads as
  // generated rather than considered, and a list that does not add up to the
  // total above it is the kind of thing a careful buyer checks.
  //
  // Three claims were removed outright when this was rewritten: "28
  // dedicated service landing pages" (the real number depends on how many
  // services and areas they have), "8 original launch articles" (the
  // generator writes no articles at all), and "0.12s Mobile Load Time"
  // (nothing measures it — it was a number somebody typed).
  const share = (fraction: number) => Math.max(25, Math.round((standardValue * fraction) / 25) * 25);
  const firstParts = [share(0.31), share(0.385), share(0.193), share(0.075)];
  const parts = [...firstParts, Math.max(25, standardValue - firstParts.reduce((total, part) => total + part, 0))];
  const anchor = standardValue;

  const deliverableItems = scopeItems.map((item, index) => ({
    item,
    val: index < parts.length ? parts[index] : null,
  }));

  return (
    <section className="rounded-2xl border-2 border-[#533afd] bg-white p-8 sm:p-10 shadow-sm space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-[#e5e7f2] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Tag className="h-3 w-3" /> What it costs
            </span>
            {setupPrice === 0 && (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
                <Sparkles className="h-3 w-3" /> Nothing to pay today
              </span>
            )}
          </div>
          {/* "Custom Launch & Ongoing Plan" and "Standard agency value
              anchored at $1297 — curated specifically for" are our words for
              our own pricing. "Anchored" says out loud that the number is an
              anchor, which is the one thing an anchor must not do. */}
          <h2 className="mt-2 text-3xl font-bold text-[#0d1738]">Putting {businessName} in a stronger position</h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#42506a]">
            This is not a page-count purchase. It is the focused rebuild that fixes the gaps we found and puts your existing
            reputation to work.
          </p>
        </div>

        {/* Price Tag Box */}
        <div className="rounded-xl bg-[#f9f9ff] border border-[#c7d0fb] p-5 text-left sm:text-right shrink-0">
          <span className="text-xs font-semibold text-[#777588] line-through">
            ${anchor.toLocaleString()} elsewhere
          </span>
          <div className="mt-0.5 flex items-baseline gap-1 sm:justify-end">
            {setupPrice === 0 && monthlyPrice > 0 ? (
              <>
                <span className="text-3xl font-bold text-[#0d1738]">$0</span>
                <span className="text-xs font-semibold text-[#777588]">setup +</span>
                <span className="text-3xl font-bold text-[#533afd] ml-1">${monthlyPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">/mo</span>
              </>
            ) : setupPrice > 0 && monthlyPrice > 0 ? (
              <>
                <span className="text-3xl font-bold text-[#0d1738]">${setupPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">setup + ${monthlyPrice}/mo</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-[#0d1738]">${setupPrice}</span>
                <span className="text-xs font-semibold text-[#777588]">USD setup</span>
              </>
            )}
          </div>
          {/* This line repeated the price that is directly above it. It gets
              to say the thing the price cannot: that stopping is easy. */}
          <span className="mt-1.5 block text-[11px] font-bold text-[#0b8f5b]">
            {monthlyPrice > 0 ? "Cancel any time · you own the site" : "One payment · you own the site"}
          </span>
        </div>
      </div>

      {audit && audit.findings.length > 0 && (
        <div className="rounded-xl border border-[#f2d38a] bg-[#fffaf0] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5b00]">Why this is built for you</p>
          <p className="mt-1 text-sm font-semibold text-[#0d1738]">We are solving the problems already costing {businessName} attention.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {audit.findings.slice(0, 3).map((finding) => (
              <div key={finding.title} className="rounded-lg border border-[#f2d38a]/70 bg-white px-3 py-2.5 text-xs font-semibold text-[#42506a]">
                {finding.title}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        {deliverableItems.map((d) => (
          <div key={d.item} className="flex items-start justify-between gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0b8f5b] mt-0.5" />
              <span className="font-medium text-[#0d1738] text-xs sm:text-sm">{d.item}</span>
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[#533afd]">
              {d.val === null ? "Included" : `$${d.val}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
