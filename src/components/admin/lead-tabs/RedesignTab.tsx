import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { QAReviewPanel } from "@/components/admin/QAReviewPanel";
import type { Lead, Artifact } from "@/types/database";

export function RedesignTab({ lead, artifact }: { lead: Lead; artifact: Artifact | null }) {
  if (!artifact) {
    return <p className="text-sm text-muted-foreground">Still building — the redesign engine hasn't finished for this lead yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-lg border border-border shadow-card">
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
          <p className="text-sm font-medium">Preview</p>
          <Link href={`/s/${lead.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Open full page <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <iframe src={`/s/${lead.slug}`} className="h-[900px] w-full" title="Generated site preview" />
      </div>

      <QAReviewPanel lead={lead} artifact={artifact} />
    </div>
  );
}
