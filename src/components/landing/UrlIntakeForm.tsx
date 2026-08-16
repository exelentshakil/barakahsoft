"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PERSONAS, type PersonaSlug } from "@/lib/personas";

// Step 1 of the 2-step intake (plan §3): URL + persona + pain points — no
// contact details yet, that's step 2's job in LeadCaptureModal. The persona
// self-ID (v4 Phase R2) is separate from the AI-inferred `industry`, and
// used as a strong prior for it (see playbooks.ts's detectIndustry).
export function UrlIntakeForm({
  url,
  onUrlChange,
  persona,
  onPersonaChange,
  painPoints,
  onPainPointsChange,
  onSubmit,
  ctaLabel,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  persona: PersonaSlug | "";
  onPersonaChange: (v: PersonaSlug | "") => void;
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
        <Label htmlFor="persona">Which trade best describes you?</Label>
        <select
          id="persona"
          required
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value as PersonaSlug)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Select your trade
          </option>
          {PERSONAS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
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
