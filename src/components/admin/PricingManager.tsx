"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, CheckCircle2, Save, Tag, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingConfig {
  model: "flat" | "monthly" | "hybrid";
  setupPrice: number;
  monthlyPrice: number;
  standardValue: number;
  discountLabel: string;
  scopeItems: string[];
}

interface LeadValueSuggestion {
  recommendation: string;
  suggested: { setupPrice: number; monthlyPrice: number; standardValue: number; label: string };
}

export function PricingManager({
  leadId,
  currentPricing,
  businessName,
  pageCount,
  leadValue,
}: {
  leadId: string;
  currentPricing?: Partial<PricingConfig> | null;
  businessName: string;
  pageCount: number;
  leadValue?: LeadValueSuggestion | null;
}) {
  const router = useRouter();
  const [model, setModel] = useState<"flat" | "monthly" | "hybrid">(
    currentPricing?.model || (leadValue?.suggested.monthlyPrice ? "hybrid" : "flat")
  );
  const [setupPrice, setSetupPrice] = useState<number>(
    currentPricing?.setupPrice ?? leadValue?.suggested.setupPrice ?? 997
  );
  const [monthlyPrice, setMonthlyPrice] = useState<number>(
    currentPricing?.monthlyPrice ?? leadValue?.suggested.monthlyPrice ?? 0
  );
  const [standardValue, setStandardValue] = useState<number>(
    currentPricing?.standardValue ?? leadValue?.suggested.standardValue ?? 1997
  );
  const [discountLabel, setDiscountLabel] = useState<string>(
    currentPricing?.discountLabel ?? leadValue?.suggested.label ?? "Custom Client Proposal"
  );
  const [scopeItems, setScopeItems] = useState<string[]>(
    currentPricing?.scopeItems?.length
      ? currentPricing.scopeItems
      : [
          `Custom homepage redesign for ${businessName}`,
          `${pageCount || 1} service pages based on your real offerings`,
          "Lead capture, click-to-call, and callback flow",
          "LocalBusiness schema and technical SEO foundation",
          "Domain connection and 2-4 week launch support",
          "100% client-owned website files",
        ]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/${leadId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            setupPrice: Number(setupPrice),
            monthlyPrice: Number(monthlyPrice),
            standardValue: Number(standardValue),
            discountLabel,
            scopeItems: scopeItems.map((item) => item.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save pricing configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Custom Client Proposal Pricing</h3>
              <p className="text-[11px] text-muted-foreground">AI recommendation from verified lead signals. Review before sending.</p>
            </div>
          </div>

          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved to Client Portal
            </span>
          )}
        </div>

        {leadValue && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2.5 text-xs text-slate-700">
            <span className="font-bold text-indigo-700">AI close judgment:</span> {leadValue.recommendation}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">1-Click Offer Presets</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setModel("flat");
                  setSetupPrice(597);
                  setMonthlyPrice(0);
                  setStandardValue(1297);
                  setDiscountLabel("Founding Launch Offer");
                }}
                className={`rounded-lg border p-2.5 text-center transition ${
                  model === "flat" && setupPrice === 597 && monthlyPrice === 0
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$597 one time</span>
                <span className="text-[10px] text-muted-foreground">Essential Launch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModel("flat");
                  setSetupPrice(997);
                  setMonthlyPrice(0);
                  setStandardValue(1997);
                  setDiscountLabel("Recommended Launch Offer");
                }}
                className={`rounded-lg border p-2.5 text-center transition ${
                  model === "flat" && setupPrice === 997 && monthlyPrice === 0
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$997 one time</span>
                <span className="text-[10px] text-muted-foreground">Recommended Build</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModel("flat");
                  setSetupPrice(1297);
                  setMonthlyPrice(0);
                  setStandardValue(2497);
                  setDiscountLabel("Complete Launch Offer");
                }}
                className={`rounded-lg border p-2.5 text-center transition ${
                  model === "flat" && setupPrice === 1297
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$1,297 one time</span>
                <span className="text-[10px] text-muted-foreground">Complete Build</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModel("hybrid");
                  setSetupPrice(497);
                  setMonthlyPrice(149);
                  setStandardValue(2497);
                  setDiscountLabel("Managed Growth Offer");
                }}
                className={`rounded-lg border p-2.5 text-center transition ${
                  model === "hybrid" && setupPrice === 497 && monthlyPrice === 149
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$497 + $149/mo</span>
                <span className="text-[10px] text-muted-foreground">Managed Growth</span>
              </button>
            </div>
          </div>

          {/* Detailed Inputs */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label htmlFor="pricing-model" className="text-xs">Model</Label>
              <select
                id="pricing-model"
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="flat">Flat One-Time</option>
                <option value="monthly">Monthly Subscription</option>
                <option value="hybrid">Setup + Monthly</option>
              </select>
            </div>

            <div>
              <Label htmlFor="setup-price" className="text-xs">Setup Fee ($)</Label>
              <Input
                id="setup-price"
                type="number"
                value={setupPrice}
                onChange={(e) => setSetupPrice(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="monthly-price" className="text-xs">Monthly ($)</Label>
              <Input
                id="monthly-price"
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="standard-val" className="text-xs">Value Anchor ($)</Label>
              <Input
                id="standard-val"
                type="number"
                value={standardValue}
                onChange={(e) => setStandardValue(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pricing-scope" className="text-xs">Client-facing scope bullets</Label>
            <textarea
              id="pricing-scope"
              value={scopeItems.join("\n")}
              onChange={(e) => setScopeItems(e.target.value.split("\n").slice(0, 10))}
              placeholder="One deliverable per line"
              rows={6}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">One line becomes one bullet in the client checkout. Keep every claim specific and deliverable.</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              Shown to customer on <code className="font-mono text-primary">/s/[slug]</code> only after QA approval.
            </span>
            <Button type="submit" size="sm" disabled={saving} className="font-bold gap-1.5 bg-primary text-primary-foreground">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Update Proposal Price"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
