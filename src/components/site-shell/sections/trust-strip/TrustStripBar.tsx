import { MapPin, Star, Phone, ShieldCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

const ICONS: Record<string, typeof MapPin> = { MapPin, Star, Phone, ShieldCheck };

interface TrustStripItem {
  icon: string;
  label: string;
  value: string;
}

export function TrustStripBar({ payload }: { payload: SitePayload }) {
  const items = (payload.trustStrip?.variant_props?.items as TrustStripItem[] | undefined) ?? [];
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border bg-accent/30 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-3 px-6">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? ShieldCheck;
          return (
            <div key={i} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">{item.label}: </span>
                <span className="font-medium">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
