"use client";

import { useState } from "react";
import { AlertTriangle, Check, Download, GitBranch, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Handing the finished site to the client.
//
// Three ways, because they answer different objections rather than
// competing. We host it, which closes fastest and asks nothing of the
// client. Or they take the repository, which is the answer to "am I locked
// in?" without making them do the technical part. Or they take the folder,
// for the ones with their own developer or their own server.
//
// The export route existed for a long time with nothing linking to it, so
// the only way to reach the deliverable was to know the URL.

export function HandoverPanel({
  leadId,
  businessName,
  hasSite,
  existingRepoUrl,
}: {
  leadId: string;
  businessName: string;
  hasSite: boolean;
  existingRepoUrl?: string | null;
}) {
  const [pushing, setPushing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(existingRepoUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  async function pushToGitHub() {
    setPushing(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/github`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create the repository");
      setRepoUrl(data.repoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the repository");
    } finally {
      setPushing(false);
    }
  }

  if (!hasSite) return null;

  return (
    <Card className="border border-border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-[#0d1738]">Hand the site over</h3>
          <p className="mt-1 text-sm text-[#42506a]">
            {businessName} is already live on our link, which is all most clients ever need. Use these when they want the
            site on their own hosting — some ask, and having an answer ready is what stops it becoming an objection.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#0d1738]" />
              <h4 className="text-sm font-bold text-[#0d1738]">Put it in a GitHub repo</h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Creates a private repository with the whole site in it. Connect it to Vercel and it is live in about two
              minutes — or hand the client the repo and they can host it anywhere, including their own server.
            </p>

            {repoUrl ? (
              <div className="mt-3 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Repository created
                </p>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#533afd] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open it on GitHub
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pushing}
                  onClick={pushToGitHub}
                  className="mt-1 w-full gap-2 text-xs"
                >
                  {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                  Make another one
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={pushToGitHub}
                disabled={pushing}
                className="mt-3 w-full gap-2 bg-[#0d1738] text-sm font-bold text-white hover:bg-[#1b2a5c]"
              >
                {pushing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4" /> Create the repo
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-[#0d1738]" />
              <h4 className="text-sm font-bold text-[#0d1738]">Download the folder</h4>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              The same site as a zip, for a client with their own developer or their own server. It includes a README and
              an example environment file explaining every key it needs.
            </p>
            <a
              href={`/api/leads/${leadId}/export`}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#533afd] px-4 py-2 text-sm font-bold text-[#533afd] transition hover:bg-[#f0f3ff]"
            >
              <Download className="h-4 w-4" /> Download the site
            </a>
          </div>
        </div>

        {error && (
          <p className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
