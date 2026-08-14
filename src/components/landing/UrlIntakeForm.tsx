"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Step 1 of the 2-step intake (plan §3): URL + pain points only — no
// contact details yet, that's step 2's job in LeadCaptureModal.
export function UrlIntakeForm({
  url,
  onUrlChange,
  painPoints,
  onPainPointsChange,
  onSubmit,
  ctaLabel,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  painPoints: string;
  onPainPointsChange: (v: string) => void;
  onSubmit: () => void;
  ctaLabel: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mx-auto mt-8 max-w-lg space-y-3 text-left"
    >
      <div>
        <Label htmlFor="site-url">Your website</Label>
        <Input
          id="site-url"
          required
          type="url"
          inputMode="url"
          placeholder="https://yourbusiness.com"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="pain-points">What's not working about it? (optional)</Label>
        <Textarea
          id="pain-points"
          placeholder="Looks outdated, doesn't show up on Google, phone never rings..."
          value={painPoints}
          onChange={(e) => onPainPointsChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button type="submit" size="lg" className="w-full">
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
