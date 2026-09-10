import { esc, icon, markHeadline } from "@/lib/generate/v2/templates/parts";
import { sectionClasses, type SectionDesign } from "@/lib/generate/v2/page-design";

// One renderer for every section that is "a heading and some items".
//
// Services, why-us, process, gallery, reviews, areas, people and pricing were
// eight separate renderers emitting eight bespoke grids. They are the same
// shape — a head, a list, optionally a photograph each — and having them
// hand-written eight times is exactly why they all came out looking like the
// same page: each one had one grid, so every page had the same eight grids.
//
// Here the shape comes from the design spec instead. The same eight sections
// can be a rail, an irregular mosaic, wide rows on a dark band or a two-column
// split, chosen per section per client, and the markup below serves all of it
// because none of the variation lives in the markup.

export interface CollectionItem {
  title?: string;
  body?: string;
  /** A price, a role, a distance — the one line that is not prose. */
  meta?: string;
  photo?: string | null;
  photoAlt?: string;
  /** Fallback when there is no photograph. Never rendered alongside one. */
  glyph?: string;
  href?: string;
  linkLabel?: string;
}

export interface CollectionHead {
  eyebrow?: string;
  headline: string;
  headlineMark?: string;
  intro?: string;
}

function renderItem(item: CollectionItem, design: SectionDesign): string {
  const wantsMedia = design.media !== "none" && design.media !== "background";
  const media =
    wantsMedia && item.photo
      ? `<figure class="bs-item__media"><img src="${esc(item.photo)}" alt="${esc(item.photoAlt ?? item.title ?? "")}" width="640" height="480" loading="lazy" decoding="async"></figure>`
      : // A glyph stands in for a missing photograph rather than an empty
        // frame, but only where the layout expected media at all.
        wantsMedia && item.glyph
        ? `<span class="bs-item__glyph">${icon(item.glyph)}</span>`
        : "";

  // The words are wrapped rather than left as siblings of the media: the rows
  // layout puts media and words in two grid columns, and five loose children
  // flowed into that grid instead — the body text wrapped underneath the
  // photograph in the media column.
  return `<article class="bs-item">
      ${media}
      <div class="bs-item__text">
        ${item.meta ? `<p class="bs-item__meta">${esc(item.meta)}</p>` : ""}
        ${item.title ? `<h3 class="bs-item__title">${esc(item.title)}</h3>` : ""}
        ${item.body ? `<p class="bs-body bs-muted">${esc(item.body)}</p>` : ""}
        ${item.href ? `<a class="bs-textlink" href="${esc(item.href)}">${esc(item.linkLabel ?? "Read more")}${icon("arrow", "bs-icon bs-icon--sm")}</a>` : ""}
      </div>
    </article>`;
}

/**
 * Render one designed section.
 *
 * `sectionPhoto` is only used by the layouts that carry a single image beside
 * or behind the words — split, background, inset. Per-item photographs come
 * from the items themselves.
 */
export function collectionSection(args: {
  id: string;
  design: SectionDesign;
  head: CollectionHead;
  items: CollectionItem[];
  sectionPhoto?: string | null;
  photoAlt?: string;
  /** Buttons, rendered under the items. Already-built markup. */
  actions?: string;
}): string {
  const { id, design, head, items, sectionPhoto, actions } = args;
  if (items.length === 0 && !sectionPhoto) return "";

  const background =
    design.ground === "image" && sectionPhoto
      ? `<div class="bs-s__bg"><img src="${esc(sectionPhoto)}" alt="" width="1600" height="900" loading="lazy" decoding="async"></div>`
      : "";

  // Media beside the words, for the families that place one. `background` is
  // handled above and `none` renders nothing at all.
  const media =
    sectionPhoto && design.media !== "none" && design.media !== "background" && design.ground !== "image"
      ? `<figure class="bs-s__media"><img src="${esc(sectionPhoto)}" alt="${esc(args.photoAlt ?? "")}" width="1200" height="900" loading="lazy" decoding="async"></figure>`
      : "";

  const headBlock = `<div class="bs-s__head">
        ${head.eyebrow ? `<span class="bs-eyebrow">${esc(head.eyebrow)}</span>` : ""}
        <h2 class="bs-h2">${head.headlineMark ? markHeadline(head.headline, head.headlineMark) : esc(head.headline)}</h2>
        ${head.intro ? `<p class="bs-lede">${esc(head.intro)}</p>` : ""}
      </div>`;

  const body = items.length
    ? `<div class="bs-s__body" style="--bs-cols:${design.columns}">${items.map((item) => renderItem(item, design)).join("")}</div>`
    : "";

  return `<section id="${esc(id)}" class="bs-section ${sectionClasses(design)}">
  ${background}
  <div class="bs-s__inner">
    <div class="bs-s__words">
      ${headBlock}
      ${body}
      ${actions ? `<div class="bs-actions">${actions}</div>` : ""}
    </div>
    ${media}
  </div>
</section>`;
}
