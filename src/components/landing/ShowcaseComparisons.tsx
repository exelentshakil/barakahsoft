import { listApprovedShowcases } from "@/lib/showcase/list";
import { ShowcaseGrid } from "@/components/landing/ShowcaseGrid";

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

      <ShowcaseGrid entries={entries} />
    </div>
  );
}
