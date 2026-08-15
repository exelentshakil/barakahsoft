import type { SitePayload } from "@/components/site-shell/types";

// Default FAQ variant — extracted verbatim from the original monolith.
export function FaqStacked({ payload }: { payload: SitePayload }) {
  if (payload.faq.length === 0) return null;
  return (
    <section id="faq" className="border-t border-border py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <div className="mt-8 space-y-5">
          {payload.faq.map((f) => (
            <div key={f.slug}>
              <p className="font-medium">{f.h2}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.body_content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
