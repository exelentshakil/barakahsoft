"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FunnelPageSection } from "@/types/database";

// Operator-only content editing (confirmed scope: the business owner
// emails/calls a change request, the operator applies it here — no
// client-facing editor). One row per generated section, edit-in-place.
export function SectionContentEditor({ leadId, sections }: { leadId: string; sections: FunnelPageSection[] }) {
  const router = useRouter();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [h2, setH2] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(section: FunnelPageSection) {
    setEditingSlug(section.slug);
    setH2(section.h2);
    setBodyContent(section.body_content);
    setError(null);
  }

  async function save(slug: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/artifact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, h2, body_content: bodyContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setEditingSlug(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const editable = sections.filter((s) => s.h2 || s.body_content);
  if (editable.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="font-medium">Edit content</p>
      <p className="text-xs text-muted-foreground">
        Business asked for a change? Edit the section here — updates the live preview immediately.
      </p>
      <div className="mt-2 divide-y divide-border">
        {editable.map((section) => (
          <div key={section.slug} className="py-3">
            {editingSlug === section.slug ? (
              <div className="space-y-2">
                <Input value={h2} onChange={(e) => setH2(e.target.value)} placeholder="Heading" />
                <Textarea value={bodyContent} onChange={(e) => setBodyContent(e.target.value)} placeholder="Body copy" rows={3} />
                {error && <p className="text-xs text-danger">{error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" disabled={submitting} onClick={() => save(section.slug)}>
                    <Check className="h-3 w-3" /> Save
                  </Button>
                  <Button size="sm" variant="outline" disabled={submitting} onClick={() => setEditingSlug(null)}>
                    <X className="h-3 w-3" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {section.h2 && <p className="truncate text-sm font-medium">{section.h2}</p>}
                  {section.body_content && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{section.body_content}</p>}
                </div>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => startEdit(section)} aria-label="Edit section">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
