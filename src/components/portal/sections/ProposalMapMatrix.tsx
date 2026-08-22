interface MapPoint {
  id: number;
  name: string;
  rank: number;
  competitor: string;
  status: string;
}

interface ProposalMapMatrixProps {
  mapPoints: MapPoint[];
  selectedPoint: MapPoint;
  industry: string | null;
  onSelectPoint: (pt: MapPoint) => void;
}

export function ProposalMapMatrix({
  mapPoints,
  selectedPoint,
  industry,
  onSelectPoint,
}: ProposalMapMatrixProps) {
  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Geographic Visibility Audit
          </span>
          <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
            Local 7×7 Search Matrix (49 Checkpoints)
          </h2>
          <p className="mt-1 text-sm text-[#42506a]">
            Query: <span className="font-semibold text-[#0d1738]">"top-rated {industry || 'service'} near me"</span>. Click any cell to inspect ranking.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#533afd]">
            <span className="h-3 w-3 rounded-sm bg-[#533afd]" /> Rank #1–3 (Dominant)
          </span>
          <span className="flex items-center gap-1.5 text-[#ba1a1a]">
            <span className="h-3 w-3 rounded-sm bg-[#ffdad6]" /> Rank 11+ (Missing)
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center pt-2">
        {/* Matrix */}
        <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
          <div className="grid grid-cols-7 gap-2">
            {mapPoints.map((pt) => (
              <button
                key={pt.id}
                onClick={() => onSelectPoint(pt)}
                className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition ${
                  pt.status === "visible"
                    ? "bg-[#533afd] text-white hover:bg-[#432bd9]"
                    : pt.status === "outside"
                    ? "bg-[#ffe086] text-[#231b00] hover:bg-[#eec218]"
                    : "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]"
                } ${selectedPoint.id === pt.id ? "ring-2 ring-[#0d1738] scale-105" : ""}`}
              >
                {pt.rank}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-[#777588]">
            Coordinates measured across your entire surrounding customer territory
          </p>
        </div>

        {/* Checkpoint Detail */}
        <div className="space-y-4 rounded-xl border border-[#c7d0fb] bg-[#f0f3ff] p-6 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#533afd] uppercase text-xs">Checkpoint #{selectedPoint.id} Inspector</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedPoint.status === "visible" ? "bg-[#eaf8f0] text-[#0b8f5b]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
              Rank #{selectedPoint.rank}
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#0d1738]">{selectedPoint.name}</h3>
          <p className="text-[#42506a] leading-relaxed">
            {selectedPoint.status === "visible"
              ? "You dominate this neighborhood in the top 3. Customers find your number immediately."
              : `Competitor (${selectedPoint.competitor}) takes the phone calls here. The rebuilt website adds localized service pages for ${selectedPoint.name} to capture this volume.`}
          </p>
        </div>
      </div>
    </section>
  );
}
