"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Sparkles, Phone, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Artifact, Lead } from "@/types/database";

// CRO-focused checklist — the previous version only checked AI-writing
// quality (emoji, grounding, whitespace). This is what actually predicts
// whether a real visitor converts: does the value prop land before any
// scrolling, is the phone number impossible to miss, do real photos (not
// stock) show up early, is trust established fast, does the CTA repeat.
// The 3 writing-quality items that still matter are kept at the bottom —
// grounding/emoji are already automated via validateGrounding and surfaced
// as qa_notes below, so this is confirming the reviewer read them, not a
// second manual re-check of the same thing.
const CHECKLIST_ITEMS = [
  "Above-the-fold clarity — headline + phone/CTA visible without scrolling on mobile",
  "Phone number is prominent and click-to-call in the header/hero",
  "Real photos (not stock-feeling) in the hero and most service cards",
  "A trust signal (rating, reviews, or certification) appears within the first two sections",
  "The primary CTA repeats down the page, not just once at the top",
  "Mobile tap targets are large enough and the sticky mobile CTA is present",
  "No unbalanced whitespace or empty-looking sections",
  "Grounding warnings below (if any) have been read and resolved",
  "Disclaimer/footer copy reads as trade-appropriate, not generic",
];

export function QAReviewPanel({ lead, artifact }: { lead: Lead; artifact: Artifact }) {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST_ITEMS.map(() => false));
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = checked.every(Boolean);

  // Computable from data already on hand — non-blocking hints, not a
  // replacement for the human checklist above (approval still gates on the
  // manual ticks, per PRD's "human makes the final call").
  const hasPhoneCta = artifact.funnel_pages.some((s) => s.kind === "cta-banner");
  const serviceAndAreaSections = artifact.funnel_pages.filter((s) => s.kind === "service" || s.kind === "area");
  const sectionsWithPhoto = serviceAndAreaSections.filter((s) => s.media_asset_ids.length > 0).length;

  async function submitDecision(decision: "approved" | "rejected") {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: decision === "rejected" ? rejectReason : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (artifact.qa_status === "approved") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-4 text-success">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">Approved — ready to deliver.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            hasPhoneCta ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground"
          }`}
        >
          <Phone className="h-3 w-3" /> {hasPhoneCta ? "Phone CTA present" : "No mid-page phone CTA"}
        </span>
        {serviceAndAreaSections.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <ImageIcon className="h-3 w-3" /> {sectionsWithPhoto}/{serviceAndAreaSections.length} services/areas have real photos
          </span>
        )}
      </div>

      <div>
        <p className="font-medium">QA checklist</p>
        <div className="mt-3 space-y-2">
          {CHECKLIST_ITEMS.map((item, i) => (
            <label key={item} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => setChecked((prev) => prev.map((c, idx) => (idx === i ? e.target.checked : c)))}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {artifact.composition_rationale && (
        <div className="flex gap-2 rounded-md border border-border bg-accent/40 p-3 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 shrink-0" />
          <p>{artifact.composition_rationale}</p>
        </div>
      )}

      {artifact.qa_notes && (
        <div className="flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <pre className="whitespace-pre-wrap font-sans">{artifact.qa_notes}</pre>
        </div>
      )}

      {artifact.qa_status === "rejected" && <p className="text-xs text-danger">Previously rejected — resolve the notes above and re-review.</p>}

      {rejecting ? (
        <div className="space-y-2">
          <Textarea
            placeholder="What needs fixing before this can go out?"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" disabled={submitting || !rejectReason.trim()} onClick={() => submitDecision("rejected")}>
              <XCircle className="h-4 w-4" /> Confirm reject
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="lg" disabled={!allChecked || submitting} onClick={() => submitDecision("approved")} className="flex-1">
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
          <Button variant="outline" size="lg" disabled={submitting} onClick={() => setRejecting(true)} className="flex-1">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
