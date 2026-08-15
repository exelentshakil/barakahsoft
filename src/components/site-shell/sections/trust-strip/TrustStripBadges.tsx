import { MapPin, Star, Phone, ShieldCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

const ICONS: Record<string, typeof MapPin> = { MapPin, Star, Phone, ShieldCheck };

interface TrustStripItem {
  icon: string;
  label: string;
  value: string;
}

// Premium sibling of TrustStripBar -- same real data contract
// (payload.trustStrip.variant_props.items), a color-block band with
// gradient icon badges instead of a plain tinted strip with bare icons.
export function TrustStripBadges({ payload }: { payload: SitePayload }) {
  const items = (payload.trustStrip?.variant_props?.items as TrustStripItem[] | undefined) ?? [];
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border bg-gradient-primary py-8 text-primary-foreground">
      <RevealGroup className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-6">
        {items.map((item, i) => {
          const Icon = ICONS[item.icon] ?? ShieldCheck;
          return (
            <RevealItem key={i} index={i} variant="fade-in" className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <span className="text-primary-foreground/80">{item.label}: </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
