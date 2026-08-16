"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Sparkles, ImagePlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FunnelPageSection } from "@/types/database";

type EditMode = "manual" | "prompt";

// Operator-only content editing (confirmed scope: the business owner
// emails/calls a change request, the operator applies it here — no
// client-facing editor). One row per generated section, edit-in-place.
//
// Two ways to fix a section that "sucks": manual text edit (unchanged),
// or an AI prompt -- same mechanism for a small tweak and a full section
// rebuild, routed through the same grounding-gated pipeline every other
// generator uses (src/lib/edit-section.ts). Applied immediately; any
// grounding warning shows right here rather than a separate review queue,
// since the operator is already looking at the live preview. Image swap
// (upload -> /api/upload -> attach via media_asset_id) works from either mode.
export function SectionContentEditor({
  leadId,
  sections,
  onSaved,
}: {
  leadId: string;
  sections: FunnelPageSection[];
  // v4 (Phase U2) -- router.refresh() alone only re-fetches Server
  // Component data; it never reloads the preview <iframe>'s document, so a
  // fully successful edit was invisible in the actual panel the operator
  // is looking at. This callback lets the parent force that reload too.
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [mode, setMode] = useState<EditMode>("manual");
  const [h2, setH2] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  function startEdit(section: FunnelPageSection) {
    setEditingSlug(section.slug);
    setMode("manual");
    setH2(section.h2);
    setBodyContent(section.body_content);
    setPrompt("");
    setError(null);
    setWarnings([]);
  }

  async function save(slug: string) {
    setSubmitting(true);
    setError(null);
    setWarnings([]);
    try {
      const payload = mode === "prompt" ? { slug, prompt } : { slug, h2, body_content: bodyContent };
      const res = await fetch(`/api/leads/${leadId}/artifact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.groundingWarnings?.length) {
        // Applied, but flag it right here — the operator is looking at the
        // live preview already, this is the review step, just synchronous.
        setWarnings(data.groundingWarnings);
      } else {
        setEditingSlug(null);
      }
      router.refresh();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadImage(slug: string, file: File) {
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lead_id", leadId);
      formData.append("slot_hint", slug);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const patchRes = await fetch(`/api/leads/${leadId}/artifact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, media_asset_id: uploadData.media_asset.id }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || "Could not attach image");
      router.refresh();
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  const editable = sections.filter((s) => s.h2 || s.body_content);
  if (editable.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-card">
      <p className="font-medium">Edit content</p>
      <p className="text-xs text-muted-foreground">
        Business asked for a change? Edit manually or ask AI to rewrite the section — updates the live preview immediately.
      </p>
      <div className="mt-2 divide-y divide-border">
        {editable.map((section) => (
          <div key={section.slug} className="py-3">
            {editingSlug === section.slug ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")}>
                    Manual
                  </Button>
                  <Button type="button" size="sm" variant={mode === "prompt" ? "default" : "outline"} onClick={() => setMode("prompt")}>
                    <Sparkles className="h-3 w-3" /> Ask AI
                  </Button>
                </div>

                {mode === "manual" ? (
                  <>
                    <Input value={h2} onChange={(e) => setH2(e.target.value)} placeholder="Heading" />
                    <Textarea value={bodyContent} onChange={(e) => setBodyContent(e.target.value)} placeholder="Body copy" rows={3} />
                  </>
                ) : (
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='e.g. "Make this punchier and lead with the free-estimate offer" or "Rewrite this section entirely — it reads too generic"'
                    rows={3}
                  />
                )}

                <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ImagePlus className="h-3.5 w-3.5" />
                  {uploadingImage ? "Uploading..." : "Swap image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(section.slug, file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {warnings.length > 0 && (
                  <div className="flex items-start gap-1.5 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div>
                      <p className="font-medium">Applied, but flagged for review:</p>
                      <ul className="mt-0.5 list-disc pl-4">
                        {warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {error && <p className="text-xs text-danger">{error}</p>}

                <div className="flex gap-2">
                  <Button size="sm" disabled={submitting || (mode === "prompt" && !prompt.trim())} onClick={() => save(section.slug)}>
                    <Check className="h-3 w-3" /> {submitting ? (mode === "prompt" ? "Generating..." : "Saving...") : "Save"}
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
