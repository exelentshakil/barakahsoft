import { Star, MessageSquareQuote } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

// Premium sibling of ProofStatGrid -- same real data (proof.rating/
// reviewCount/imageUrl, differentiator), gradient icon-badge stat tiles
// with a lift-hover instead of flat bordered boxes.
export function ProofStatGridPremium({ payload }: { payload: SitePayload }) {
  const tiles: { label: string; value: string; icon: typeof Star }[] = [];
  if (payload.proof.rating) tiles.push({ label: "Average rating", value: `${payload.proof.rating}★`, icon: Star });
  if (payload.proof.reviewCount) tiles.push({ label: "Real reviews", value: String(payload.proof.reviewCount), icon: MessageSquareQuote });

  return (
    <section id="proof" className="border-t border-border py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-[auto_1fr] sm:items-center">
        {tiles.length > 0 && (
          <RevealGroup className="flex gap-4">
            {tiles.map((tile, i) => (
              <RevealItem key={tile.label} index={i}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-card transition-shadow hover:shadow-lift">
                  <IconBadge icon={tile.icon} size="sm" />
                  <div>
                    <p className="text-xl font-bold">{tile.value}</p>
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
        <div className="flex items-center gap-5">
          <p className="text-sm text-muted-foreground">{payload.differentiator}</p>
          {payload.proof.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.proof.imageUrl} alt="Real work" className="hidden h-28 w-40 shrink-0 rounded-xl object-cover shadow-lift sm:block" />
          )}
        </div>
      </div>
    </section>
  );
}
