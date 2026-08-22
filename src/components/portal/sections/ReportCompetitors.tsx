// The real businesses this client is up against.
//
// Replaces a table of "Top Competitor A/B/C" with invented speed scores that
// shipped identically to every client. Competitors here came from a real
// search for this trade in this city, and every figure was measured. A
// figure that could not be measured renders as a dash, because a blank cell
// is honest and a filled one is the thing being removed.

interface Row {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  speedScore: number | null;
  isClient: boolean;
}

export function ReportCompetitors({ rows, query }: { rows: Row[]; query: string }) {
  const client = rows.find((r) => r.isClient);
  const rivals = rows.filter((r) => !r.isClient);

  const rivalReviews = rivals.map((r) => r.reviewCount).filter((n): n is number => typeof n === "number");
  const averageReviews = rivalReviews.length > 0
    ? Math.round(rivalReviews.reduce((a, b) => a + b, 0) / rivalReviews.length)
    : null;

  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
      <div className="border-b border-[#e5e7f2] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#533afd]">Market position</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0d1738] sm:text-3xl">
          Who comes up when someone searches for what you do
        </h2>
        <p className="mt-2 text-sm text-[#42506a]">
          Real results for <span className="font-semibold text-[#0d1738]">&ldquo;{query}&rdquo;</span>, with each
          business&apos;s own review count and mobile speed measured directly.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[#e5e7f2]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#e5e7f2] bg-[#fbfbfd] text-[10px] uppercase tracking-wide text-[#777588]">
              <th className="px-4 py-3 font-bold">Business</th>
              <th className="px-4 py-3 font-bold">Google rating</th>
              <th className="px-4 py-3 font-bold">Reviews</th>
              <th className="px-4 py-3 font-bold">Mobile speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7f2]">
            {rows.map((row) => (
              <tr key={row.name} className={row.isClient ? "bg-[#f0f3ff]" : ""}>
                <td className={`px-4 py-3 ${row.isClient ? "font-bold text-[#533afd]" : "text-[#42506a]"}`}>
                  {row.name}
                  {row.isClient && <span className="ml-2 text-[10px] font-bold uppercase">You</span>}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#42506a]">{row.rating ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-[#42506a]">{row.reviewCount ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-[#42506a]">
                  {row.speedScore === null ? "—" : `${row.speedScore}/100`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {client?.reviewCount && averageReviews !== null && client.reviewCount > averageReviews && (
        <p className="mt-5 rounded-xl border border-[#c9e7d8] bg-[#eaf8f0] p-4 text-sm leading-relaxed text-[#0b6b45]">
          You have <b className="font-semibold">{client.reviewCount} reviews</b> against an average of{" "}
          <b className="font-semibold">{averageReviews}</b> across these competitors. You are winning on reputation and
          losing on the website — which is the easier of the two to fix.
        </p>
      )}
    </section>
  );
}
