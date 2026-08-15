import { ShieldCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// A centered card treatment instead of a full-width band — reads more
// "featured claim" than "footnote," worth it for a strong real guarantee.
export function GuaranteeCard({ payload }: { payload: SitePayload }) {
  if (!payload.guarantee) return null;
  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-8 text-center shadow-card">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium">{payload.guarantee}</p>
      </div>
    </section>
  );
}
