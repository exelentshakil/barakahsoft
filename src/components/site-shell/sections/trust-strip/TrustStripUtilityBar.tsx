import { MapPin, Star, Phone, ShieldCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

const ICONS: Record<string, typeof MapPin> = { MapPin, Star, Phone, ShieldCheck };

interface TrustStripItem {
  icon: string;
  label: string;
  value: string;
}

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (several real premium sites use a compact, dark, edge-to-edge
// utility bar rather than a centered tinted/gradient band): solid dark
// background, tight vertical padding, items spread justify-between instead
// of centered-and-wrapped like the other two trust-strip variants.
export function TrustStripUtilityBar({ payload }: { payload: SitePayload }) {
  const items = (payload.trustStrip?.variant_props?.items as TrustStripItem[] | undefined) ?? [];
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border bg-foreground py-2.5 text-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-6 text-xs sm:text-sm">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? ShieldCheck;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="opacity-70">{item.label}:</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
