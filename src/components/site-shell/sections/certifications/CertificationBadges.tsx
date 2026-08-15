import { BadgeCheck } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

interface CertificationBadge {
  label: string;
}

export function CertificationBadges({ payload }: { payload: SitePayload }) {
  const badges = (payload.certifications?.variant_props?.badges as CertificationBadge[] | undefined) ?? [];
  if (badges.length === 0) return null;

  return (
    <section className="border-t border-border py-10">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6">
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <BadgeCheck className="h-5 w-5 text-primary" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  );
}
