import { Star, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetitorCandidate } from "@/lib/google/places";

// Dual-purpose with ResearchCompetitors (src/lib/research-competitors.ts) —
// the same real-competitor data that grounds generation tone is what the
// operator sees here as sales ammunition ("here's how you compare locally").
export function CompetitorsTab({ competitors, designBrief }: { competitors: CompetitorCandidate[]; designBrief: string }) {
  if (competitors.length === 0) {
    return <p className="text-sm text-muted-foreground">No competitors found nearby for this niche.</p>;
  }

  return (
    <div className="space-y-6">
      {designBrief && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{designBrief}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competitors.map((c) => (
          <Card key={c.place_id}>
            <CardContent className="p-4">
              <p className="font-medium">{c.name}</p>
              {c.rating != null && (
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {c.rating} ({c.review_count ?? 0})
                </div>
              )}
              {c.website && (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Visit site <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
