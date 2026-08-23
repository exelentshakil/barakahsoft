import { MapPin } from "lucide-react";

// Where this business does and does not appear in local search.
//
// Replaces a hardcoded grid of forty-nine Queens neighbourhoods with
// invented ranks and invented competitor names, shown identically to every
// client. Every cell here was measured by a real search that actually ran,
// and only businesses that compete geographically see this at all.

interface Cell {
  area: string;
  rank: number | null;
  topCompetitor: string | null;
}

function cellTone(rank: number | null): string {
  if (rank === null) return "bg-[#fdeaea] text-[#ba1a1a] border-[#f5c6c6]";
  if (rank <= 3) return "bg-[#0b8f5b] text-white border-[#0b8f5b]";
  if (rank <= 10) return "bg-[#fdf3e2] text-[#8a5b00] border-[#f0dcb4]";
  return "bg-[#fdeee2] text-[#a35a17] border-[#f0d0b4]";
}

export function ReportVisibility({
  cells,
  visible,
  missing,
  dominant,
  businessName,
}: {
  cells: Cell[];
  visible: number;
  missing: number;
  dominant: number;
  businessName: string;
}) {
  // The single most persuasive competitor: whoever holds the most areas this
  // business is absent from.
  const holders = new Map<string, number>();
  for (const cell of cells) {
    if (cell.rank === null && cell.topCompetitor) {
      holders.set(cell.topCompetitor, (holders.get(cell.topCompetitor) ?? 0) + 1);
    }
  }
  const topRival = [...holders.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
      <div className="border-b border-[#e5e7f2] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#533afd]">Local search visibility</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0d1738] sm:text-3xl">
          {missing > 0
            ? `You do not appear in ${missing} of the ${cells.length} areas we checked`
            : `Where ${businessName} appears across your area`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#42506a]">
          We searched for your trade in each of these places and recorded which businesses came back.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
        <span className="rounded-full bg-[#eaf8f0] px-3 py-1 text-[#0b8f5b]">Top 3 in {dominant}</span>
        <span className="rounded-full bg-[#fdf3e2] px-3 py-1 text-[#8a5b00]">Appearing in {visible}</span>
        <span className="rounded-full bg-[#fdeaea] px-3 py-1 text-[#ba1a1a]">Absent from {missing}</span>
      </div>

      {/* The map, as a map. These are points measured across their area, so
          they are drawn as a square grid -- a reader sees the shape of
          where they are missing before they read a single number. */}
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        <div
          className="grid w-fit shrink-0 gap-1.5"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cells.length))}, minmax(0, 1fr))` }}
        >
          {cells.map((cell) => (
            <div
              key={cell.area}
              title={`${cell.area} — ${cell.rank ? `ranked #${cell.rank}` : "does not appear"}`}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-bold tabular-nums ${cellTone(cell.rank)}`}
            >
              {cell.rank ?? "–"}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#777588]">Every point we checked</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cells.map((cell) => (
              <span
                key={cell.area}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cellTone(cell.rank)}`}
              >
                <MapPin className="h-3 w-3 shrink-0 opacity-70" />
                {cell.area}
                <span className="tabular-nums opacity-80">{cell.rank === null ? "not found" : `#${cell.rank}`}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {topRival && (
        <p className="mt-5 rounded-xl border border-[#e5e7f2] bg-[#fbfbfd] p-4 text-sm leading-relaxed text-[#42506a]">
          <b className="font-semibold text-[#0d1738]">{topRival[0]}</b> is taking the top spot in{" "}
          <b className="font-semibold text-[#0d1738]">{topRival[1]}</b> of the areas you do not appear in. Those are
          customers searching for exactly what you do, who never see your name.
        </p>
      )}
    </section>
  );
}
