import { BadgeCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

interface CertificationBadge {
  label: string;
}

// v6 -- built from real vision analysis of the design-reference roofer
// screenshots (real premium sites present certifications as a compact,
// evenly-spaced strip of grayscale-style badge chips, closer to a real
// manufacturer/accreditation logo row) -- genuinely different density and
// treatment from CertificationBadges (plain inline text) and
// CertificationsGlow (pill with a glow ring).
export function CertificationsLogoStrip({ payload }: { payload: SitePayload }) {
  const badges = (payload.certifications?.variant_props?.badges as CertificationBadge[] | undefined) ?? [];
  if (badges.length === 0) return null;

  return (
    <section className="border-t border-border bg-accent/30 py-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6">
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  );
}
