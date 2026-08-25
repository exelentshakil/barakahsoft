import { listApprovedShowcases } from "@/lib/showcase/list";
import { BeforeAfterSlider } from "@/components/shared/BeforeAfterSlider";

// Our own delivered redesigns, shown against the client's real previous
// site. This is the one section on the landing page that is genuinely our
// work — the marquee rows above it are curated third-party references and
// are labeled as such, because presenting someone else's site as ours would
// misrepresent authorship.
//
// Renders nothing until an operator has approved at least one. An empty
// "our work" section is worse than no section: it reads as a company with
// no clients.

export async function ShowcaseComparisons() {
  const entries = await listApprovedShowcases();
  if (entries.length === 0) return null;

  return (
    <div className="relative mx-auto max-w-6xl px-6">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#c8ddec] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0c68c8]">
          Real client rebuilds
        </span>
        <p className="max-w-2xl text-sm text-[#60778d]">
          Drag any slider to see the site we were handed and the site we shipped. Same business, same content, same screen width.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {entries.map((entry) => (
          <figure
            key={entry.slug}
            className="overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.06)] transition hover:shadow-[0_20px_45px_rgba(7,40,77,0.12)]"
          >
            <BeforeAfterSlider
              beforeUrl={entry.beforeUrl}
              afterUrl={entry.afterUrl}
              beforeLabel="Before"
              afterLabel="After"
              subject={`${entry.businessName} homepage`}
            />
            <figcaption className="flex items-center justify-between gap-3 border-t border-[#e4eef7] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#07284d]">{entry.businessName}</p>
                {entry.label && <p className="truncate text-xs text-[#657c90]">{entry.label}</p>}
              </div>
              <a
                href={`/s/${entry.slug}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs font-bold text-[#0c68c8] transition hover:underline"
              >
                View live →
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
