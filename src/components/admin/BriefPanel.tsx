"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Check, Palette, ImageIcon } from "lucide-react";
import { GoogleListing, type ListingState } from "@/components/admin/GoogleListing";

// What the page gets built from, and the only place a human can change it.
//
// This is the highest-value input in the whole system: the scrape is a guess,
// and an operator who knows the trade can correct it in thirty seconds. Losing
// this panel meant every page was built from whatever the classifier happened
// to think, with no way to say "no, they are a commercial electrician, and
// their brand colour is this, and this is their real logo".
//
// Autosaves to /api/leads/[id]/brief, which now writes both the operator keys
// and the brief_overrides the generator reads.

export interface BriefFields {
  businessName: string;
  founder: string;
  city: string;
  industry: string;
  aboutContent: string;
  services: string;
  areas: string;
  logoUrl: string;
  footerLogoUrl: string;
  brandHex: string;
}

export function BriefPanel({
  leadId,
  initial,
  listing,
}: {
  leadId: string;
  initial: BriefFields;
  listing: ListingState;
}) {
  const [fields, setFields] = useState<BriefFields>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(fields);
  latest.current = fields;

  const save = useCallback(async () => {
    setState("saving");
    const f = latest.current;
    try {
      await fetch(`/api/leads/${leadId}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: f.businessName.trim(),
          founder: f.founder.trim(),
          city: f.city.trim(),
          industry: f.industry.trim(),
          aboutContent: f.aboutContent.trim(),
          logoUrl: f.logoUrl.trim(),
          footerLogoUrl: f.footerLogoUrl.trim(),
          brandHex: f.brandHex.trim(),
          services: f.services.split("\n").map((s) => s.trim()).filter(Boolean),
          areas: f.areas.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      setState("saved");
      setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("idle");
    }
  }, [leadId]);

  // Debounced rather than saved per keystroke — the operator is typing a
  // services list, not flicking a switch.
  function set<K extends keyof BriefFields>(key: K, value: BriefFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 900);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const valid = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(fields.brandHex.trim());

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          The brief — what the page is built from
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {state === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> saving</>}
          {state === "saved" && <><Check className="h-3 w-3 text-emerald-600" /> saved</>}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name" value={fields.businessName} onChange={(v) => set("businessName", v)} />
        <Field label="Trade" value={fields.industry} onChange={(v) => set("industry", v)} placeholder="Commercial electrician" />
        <Field label="Town" value={fields.city} onChange={(v) => set("city", v)} />
        <Field label="Owner / founder" value={fields.founder} onChange={(v) => set("founder", v)} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Services — one per line</Label>
          <textarea
            rows={6}
            value={fields.services}
            onChange={(e) => set("services", e.target.value)}
            placeholder={"Fuse box upgrades\nEICR testing\nEV charger installation"}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
          />
        </div>
        <div>
          <Label>Areas served — one per line</Label>
          <textarea
            rows={6}
            value={fields.areas}
            onChange={(e) => set("areas", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-3">
        <Label>About — in their own words</Label>
        <textarea
          rows={4}
          value={fields.aboutContent}
          onChange={(e) => set("aboutContent", e.target.value)}
          placeholder="Pasted from their site, or written from what you know. Never invented."
          className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <GoogleListing leadId={leadId} listing={listing} />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold">
          <Palette className="h-3.5 w-3.5" /> Branding
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Brand colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick the brand colour"
                value={valid ? (fields.brandHex.startsWith("#") ? fields.brandHex : `#${fields.brandHex}`) : "#1f2a37"}
                onChange={(e) => set("brandHex", e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-border bg-background p-0.5"
              />
              <input
                value={fields.brandHex}
                onChange={(e) => set("brandHex", e.target.value)}
                placeholder="#B8410E"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Accents only — buttons, links, small marks. The page stays neutral, which is what makes it
              look expensive.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Logo URL</Label>
              <ImageField value={fields.logoUrl} onChange={(v) => set("logoUrl", v)} />
            </div>
            <div>
              <Label>Footer logo — transparent, for dark bands</Label>
              <ImageField value={fields.footerLogoUrl} onChange={(v) => set("footerLogoUrl", v)} />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
        Saved changes only reach the page on the next build — press Rebuild above.
      </p>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{children}</label>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
      />
    </div>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
      />
    </div>
  );
}
