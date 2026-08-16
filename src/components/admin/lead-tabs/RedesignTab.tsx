"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { QAReviewPanel } from "@/components/admin/QAReviewPanel";
import { SectionContentEditor } from "@/components/admin/SectionContentEditor";
import type { Lead, Artifact } from "@/types/database";

// v4 (Phase U2) -- the preview is a plain <iframe>; router.refresh() (fired
// by SectionContentEditor on save) only re-fetches Next.js Server
// Component data, it never reloads an iframe's own document. A fully
// successful edit used to be invisible in this exact panel. `reloadKey` is
// bumped on every save and used as the iframe's React `key`, forcing a
// real remount (= real reload) instead of relying on that.
export function RedesignTab({ lead, artifact }: { lead: Lead; artifact: Artifact | null }) {
  const [reloadKey, setReloadKey] = useState(0);

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
        <iframe key={reloadKey} src={`/s/${lead.slug}`} className="h-[900px] w-full" title="Generated site preview" />
      </div>

      <div className="space-y-6">
        <QAReviewPanel lead={lead} artifact={artifact} />
        <SectionContentEditor leadId={lead.id} sections={artifact.funnel_pages} onSaved={() => setReloadKey((k) => k + 1)} />
      </div>
    </div>
  );
}
