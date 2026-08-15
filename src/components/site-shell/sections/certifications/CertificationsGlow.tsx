import { BadgeCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

interface CertificationBadge {
  label: string;
}

// Premium sibling of CertificationBadges -- same real data contract
// (payload.certifications.variant_props.badges), each badge in a
// glow-ringed pill instead of plain inline icon+text.
export function CertificationsGlow({ payload }: { payload: SitePayload }) {
  const badges = (payload.certifications?.variant_props?.badges as CertificationBadge[] | undefined) ?? [];
  if (badges.length === 0) return null;

  return (
    <section className="border-t border-border py-12">
      <RevealGroup className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 px-6">
        {badges.map((badge, i) => (
          <RevealItem key={i} index={i} variant="scale-in">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-glow">
              <BadgeCheck className="h-4 w-4 text-primary" />
              {badge.label}
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
