import { ShieldCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// Default guarantee variant — extracted verbatim from the original monolith.
export function GuaranteeBand({ payload }: { payload: SitePayload }) {
  if (!payload.guarantee) return null;
  return (
    <section className="border-t border-border bg-accent/40 py-10">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-6">
        <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm font-medium">{payload.guarantee}</p>
      </div>
    </section>
  );
}
