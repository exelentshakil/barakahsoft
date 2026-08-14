import { Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateAuditNarrative, type Facts } from "@/lib/ai";
import type { ScrapeResults } from "@/types/database";

function ScoreCard({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  const score = data?.score as number | undefined;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        {score != null ? (
          <p className={`mt-1 text-3xl font-bold ${score >= 90 ? "text-success" : score >= 50 ? "text-warning" : "text-danger"}`}>{score}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not available</p>
        )}
        {data?.lcp_ms != null && <p className="mt-2 text-xs text-muted-foreground">LCP: {Math.round((data.lcp_ms as number) / 100) / 10}s</p>}
        {data?.cls != null && <p className="text-xs text-muted-foreground">CLS: {data.cls as number}</p>}
      </CardContent>
    </Card>
  );
}

// generate_audit_narrative runs on-demand here rather than at generation
// time — it's read occasionally (when the operator checks this tab), not
// needed for the redesign itself, so caching it in the artifact would be
// premature storage for a value nobody may ever look at for most leads.
export async function AuditTab({ scrapeResults }: { scrapeResults: ScrapeResults | null }) {
  if (!scrapeResults) return <p className="text-sm text-muted-foreground">No scrape data yet.</p>;

  const facts = scrapeResults.facts as Facts;
  const narrative = await generateAuditNarrative(facts);

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
        <Gauge className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm">{narrative}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard label="Mobile" data={scrapeResults.pagespeed_mobile} />
        <ScoreCard label="Desktop" data={scrapeResults.pagespeed_desktop} />
      </div>
    </div>
  );
}
