"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, CheckCircle2, Save, Tag } from "lucide-react";
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
}

export function PricingManager({
  leadId,
  currentPricing,
}: {
  leadId: string;
  currentPricing?: Partial<PricingConfig> | null;
}) {
  const router = useRouter();
  const [model, setModel] = useState<"flat" | "monthly" | "hybrid">(
    currentPricing?.model || "flat"
  );
  const [setupPrice, setSetupPrice] = useState<number>(
    currentPricing?.setupPrice ?? 797
  );
  const [monthlyPrice, setMonthlyPrice] = useState<number>(
    currentPricing?.monthlyPrice ?? 0
  );
  const [standardValue, setStandardValue] = useState<number>(
    currentPricing?.standardValue ?? 1597
  );
  const [discountLabel, setDiscountLabel] = useState<string>(
    currentPricing?.discountLabel ?? "Save $800 Today"
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
            <h3 className="text-sm font-bold text-foreground">Client Portal Pricing Control</h3>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved to Portal
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Preset Offer Models</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setModel("flat");
                  setSetupPrice(797);
                  setMonthlyPrice(0);
                  setStandardValue(1597);
                  setDiscountLabel("Save $800 Today");
                }}
                className={`rounded-lg border p-2 text-center transition ${
                  model === "flat" && setupPrice === 797
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$797 Flat</span>
                <span className="text-[10px] text-muted-foreground">Standard Website</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModel("monthly");
                  setSetupPrice(0);
                  setMonthlyPrice(79);
                  setStandardValue(199);
                  setDiscountLabel("No Setup Fee");
                }}
                className={`rounded-lg border p-2 text-center transition ${
                  model === "monthly" && monthlyPrice === 79
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$79 / month</span>
                <span className="text-[10px] text-muted-foreground">Zero Down SaaS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModel("hybrid");
                  setSetupPrice(779);
                  setMonthlyPrice(99);
                  setStandardValue(1897);
                  setDiscountLabel("Complete B2B Package");
                }}
                className={`rounded-lg border p-2 text-center transition ${
                  model === "hybrid" && setupPrice === 779
                    ? "border-primary bg-primary/10 font-bold text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span className="block font-bold text-sm">$779 + $99/mo</span>
                <span className="text-[10px] text-muted-foreground">Setup + Retainer</span>
              </button>
            </div>
          </div>

          {/* Detailed Inputs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="setup-price" className="text-xs">Setup Price ($)</Label>
              <Input
                id="setup-price"
                type="number"
                value={setupPrice}
                onChange={(e) => setSetupPrice(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="monthly-price" className="text-xs">Monthly Price ($)</Label>
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

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              Shown to customer on <code className="font-mono text-primary">/s/[slug]</code> after QA approval.
            </span>
            <Button type="submit" size="sm" disabled={saving} className="font-bold gap-1.5">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Update Proposal Price"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
