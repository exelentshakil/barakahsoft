"use client";

import { useMemo, useState } from "react";
import { Check, FileWarning, Layers, Quote } from "lucide-react";
import type { DesignDna } from "@/lib/design-dna";
import type { Entity } from "@/lib/extract-entities";
// The same folding the composer uses, imported rather than copied: a panel
// that quietly disagreed with the build about what counts as a "person" would
// be worse than no panel.
import { stem, availableStems } from "@/lib/generate/v2/compose";

// What this page is going to be made of, before it is made.
//
// Two things now decide the page: the section sequence of a best-in-class site
// in this lead's industry, and the specific facts read off the client's own
// site. Both are chosen automatically and both were invisible — an operator
// pressed Generate and found out what the page was about afterwards, which is
// the wrong end of a build that costs money and minutes.
//
// So this shows the reference's sections, which of them this client can fill,
// and what will be dropped for want of evidence. A section dropped here is not
// a bug: it is the engine refusing to invent a membership table for a gym that
// does not publish prices.

export function PagePlanPanel({
  entities,
  design,
  hasReviews,
  hasPhotos,
}: {
  entities: Entity[];
  design: DesignDna | null;
  hasReviews: boolean;
  hasPhotos: boolean;
}) {
  const [openKind, setOpenKind] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const entity of entities) map.set(entity.kind, [...(map.get(entity.kind) ?? []), entity]);
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [entities]);

  const available = useMemo(
    () => availableStems({ entities, hasReviews, hasPhotos, areaCount: 0, serviceCount: 0 }),
    [entities, hasReviews, hasPhotos]
  );

  const blueprint = design?.blueprint;

  if (entities.length === 0 && !blueprint) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-violet-50 border border-violet-200 text-violet-700">
            <Layers className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-bold text-base text-slate-900">What this page will be built from</h3>
        </div>
        {blueprint && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-bold text-violet-700">
            <Quote className="h-3 w-3" /> {design?.sourceName}
          </span>
        )}
      </div>

      {/* The client's own facts. */}
      <div className="space-y-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          Their facts ({entities.length} verified)
        </p>
        {grouped.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing specific was read from their site, so the page will be built from the standard section list for
            their industry. Re-analyse with a deep read if their site has prices, classes or named staff.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {grouped.map(([kind, list]) => (
              <button
                key={kind}
                type="button"
                onClick={() => setOpenKind(openKind === kind ? null : kind)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  openKind === kind
                    ? "border-violet-300 bg-violet-50 text-violet-800"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                }`}
              >
                {kind} <span className="font-mono opacity-60">{list.length}</span>
              </button>
            ))}
          </div>
        )}

        {openKind && (
          <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {(grouped.find(([kind]) => kind === openKind)?.[1] ?? []).map((entity, index) => (
              <li key={`${entity.label}-${index}`} className="text-xs text-slate-700">
                <span className="font-bold text-slate-900">{entity.label}</span>
                {entity.price && (
                  <span className="ml-1.5 font-mono font-bold text-emerald-700">
                    {entity.price}
                    {entity.period ? `/${entity.period}` : ""}
                  </span>
                )}
                {entity.detail && <span className="ml-1.5 text-slate-500">{entity.detail}</span>}
                <a
                  href={entity.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-slate-400 underline decoration-dotted hover:text-slate-600"
                >
                  source
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The reference's structure, filtered by what they can fill. */}
      {blueprint && (
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Sections, from {design?.sourceName}
          </p>
          <ul className="space-y-1">
            {blueprint.sections.map((section, index) => {
              const missing = section.needs.map(stem).filter((need) => !available.has(need));
              const dropped = section.needs.length > 0 && missing.length > 0;
              const noRenderer = !section.nearest;
              return (
                <li
                  key={`${section.kind}-${index}`}
                  className={`flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-xs ${
                    dropped || noRenderer ? "text-slate-400" : "text-slate-800"
                  }`}
                >
                  {dropped || noRenderer ? (
                    <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  )}
                  <span className="min-w-0">
                    <span className={`font-bold ${dropped || noRenderer ? "line-through" : ""}`}>{section.kind}</span>
                    <span className="ml-1.5 text-slate-500">{section.purpose}</span>
                    {noRenderer && <span className="ml-1.5 font-semibold text-amber-600">no renderer for this yet</span>}
                    {dropped && !noRenderer && (
                      <span className="ml-1.5 font-semibold text-amber-600">
                        needs {missing.join(", ")} — not on their site
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-slate-500">
            A struck-through section is not an error. The page drops what the client cannot evidence rather than
            inventing it — an empty price table is bad, and a made-up one is worse.
          </p>
        </div>
      )}
    </div>
  );
}
