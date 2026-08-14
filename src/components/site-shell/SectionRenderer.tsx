import type { FunnelPageSection } from "@/types/database";

// The single render function shared by the pre-payment homepage's anchor
// sections and the post-payment literal /services/[slug] & /areas/[slug]
// routes (plan §6) — same props, same markup, either way. Payment only
// ever changes which URL points at this output, never the content itself.
export function SectionRenderer({
  section,
  imageUrl,
  standalone = false,
}: {
  section: FunnelPageSection;
  imageUrl?: string | null;
  standalone?: boolean;
}) {
  return (
    <section id={section.slug} className={standalone ? "mx-auto max-w-3xl px-6 py-16" : "scroll-mt-20 border-t border-border py-16"}>
      <div className={standalone ? "" : "mx-auto max-w-6xl px-6"}>
        <div className={imageUrl ? "grid items-center gap-10 lg:grid-cols-2" : ""}>
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">{section.h2}</h2>
            <p className="mt-4 whitespace-pre-line text-muted-foreground">{section.body_content}</p>
            {section.cta && (
              <a href="#contact" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                {section.cta} &rarr;
              </a>
            )}
          </div>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={section.h2} className="w-full rounded-xl object-cover shadow-card" />
          )}
        </div>
      </div>
    </section>
  );
}
