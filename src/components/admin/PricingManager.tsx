"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, CheckCircle2, Save, Tag, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildOfferOptions, type OfferOption } from "@/lib/audit/lead-value";

interface PricingConfig {
  model: "flat" | "monthly" | "hybrid";
  setupPrice: number;
  monthlyPrice: number;
  standardValue: number;
  discountLabel: string;
  scopeItems: string[];
  offerOptions: OfferOption[];
  offerId: OfferOption["id"];
}

interface LeadValueSuggestion {
  recommendation: string;
  suggested: { setupPrice: number; monthlyPrice: number; standardValue: number; label: string; offerId: OfferOption["id"] };
  offers: OfferOption[];
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
  const hasSavedOffer = Boolean(currentPricing?.offerId || currentPricing?.offerOptions?.length);
  const [model, setModel] = useState<"flat" | "monthly" | "hybrid">(
    hasSavedOffer ? currentPricing?.model || "flat" : leadValue?.suggested.monthlyPrice ? "hybrid" : "flat"
  );
  const [setupPrice, setSetupPrice] = useState<number>(
    hasSavedOffer ? currentPricing?.setupPrice ?? 997 : leadValue?.suggested.setupPrice ?? 997
  );
  const [monthlyPrice, setMonthlyPrice] = useState<number>(
    hasSavedOffer ? currentPricing?.monthlyPrice ?? 0 : leadValue?.suggested.monthlyPrice ?? 0
  );
  const [standardValue, setStandardValue] = useState<number>(
    hasSavedOffer ? currentPricing?.standardValue ?? 1997 : leadValue?.suggested.standardValue ?? 1997
  );
  const [discountLabel, setDiscountLabel] = useState<string>(
    hasSavedOffer ? currentPricing?.discountLabel ?? "Custom Client Proposal" : leadValue?.suggested.label ?? "Custom Client Proposal"
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
  const offerOptions = currentPricing?.offerOptions?.length
    ? currentPricing.offerOptions
    : leadValue?.offers?.length
    ? leadValue.offers
    : buildOfferOptions(pageCount + 1, businessName);
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
            offerOptions,
            offerId: leadValue?.suggested.offerId,
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

        {offerOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">AI-generated offer ladder from this lead&apos;s business footprint</p>
            <div className="grid gap-2 sm:grid-cols-4">
              {offerOptions.map((offer) => (
                <div key={offer.id} className={`rounded-lg border p-3 ${leadValue?.suggested.offerId === offer.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-xs font-bold text-slate-900">{offer.label}</p>
                  <p className="mt-1 text-sm font-black text-indigo-700">${offer.setupPrice}{offer.monthlyPrice > 0 ? ` + $${offer.monthlyPrice}/mo` : " one time"}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-600">{offer.description}</p>
                </div>
              ))}
            </div>
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
                  setScopeItems([
                    `Custom homepage redesign tailored for ${businessName}`,
                    `${pageCount || 5} core service pages based on your real offerings`,
                    "Lead capture, quote request & click-to-call flow",
                    "LocalBusiness JSON-LD schema & technical SEO foundation",
                    "Responsive visual assets with custom footer & logo badge integration",
                    "100% client-owned website files with 2-4 week launch support",
                  ]);
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
                  setScopeItems([
                    `Custom homepage redesign tailored for ${businessName}`,
                    `${pageCount || 8} dedicated service & location pages based on real offerings`,
                    "Speed-engineered performance (95+ Google PageSpeed on mobile)",
                    "Lead capture, click-to-call, and callback flow",
                    "Full LocalBusiness SEO schema, OpenGraph cards & sitemap structure",
                    "100% client-owned website files with white-glove launch support",
                  ]);
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
                  setScopeItems([
                    `Full ${pageCount || 10}-page core website architecture for ${businessName}`,
                    "Dedicated service pages for all offerings + local area combinations",
                    "Speed-engineered performance (95+ Google PageSpeed on mobile)",
                    "Custom lead capture forms, click-to-call, and inquiry alerts",
                    "Full LocalBusiness SEO schema, OpenGraph cards & sitemap structure",
                    "100% client-owned website files with white-glove launch support",
                  ]);
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
                  setScopeItems([
                    `Full ${pageCount || 10}-page core website rebuild tailored for ${businessName}`,
                    "Dedicated service & territory pages based on your real offerings",
                    "Global high-speed edge hosting, SSL & automated weekly backups",
                    "Ongoing security monitoring, maintenance & monthly content updates",
                    "AI lead assistant with instant SMS/Email inquiry alerts",
                    "100% client-owned website files (cancel anytime without penalty)",
                  ]);
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

          {/* Detailed Inputs Collapsible */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">Advanced Proposal Overrides &amp; Scope</Label>
              <span className="text-[11px] text-muted-foreground">Adjust numbers or deliverables only if custom quote needed</span>
            </div>

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
                rows={5}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs leading-relaxed"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">One line becomes one bullet in the client checkout. Keep every claim specific and deliverable.</p>
            </div>
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
