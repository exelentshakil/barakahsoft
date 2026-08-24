"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Search, CheckCircle2, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/database";

type Mode = "byod" | "search";

const emptyContact = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address1: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  companyName: "",
};

// Real functionality, not a placeholder: "bring your own domain" saves
// leads.custom_domain directly (and re-fires go-live if the lead already
// paid, since go-live.ts only ever runs once at payment time and skips
// silently if no domain is set yet); "search & buy" wraps Vercel's own
// domain registrar API end to end. The buy step always shows the exact
// live price and requires a separate deliberate click -- real money,
// charged to BarakahSoft's own Vercel payment method on file, not
// something to fire on a single click.
export function DomainManager({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("byod");

  // BYOD state
  const [byodDomain, setByodDomain] = useState("");
  const [savingByod, setSavingByod] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ domain: string; available: boolean; price: { purchasePrice: number; renewalPrice: number } | null } | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contact, setContact] = useState({ ...emptyContact, companyName: lead.business_name ?? "" });
  const [buying, setBuying] = useState(false);
  const [launching, setLaunching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function launchSite() {
    setLaunching(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/go-live`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not launch site");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not launch site");
    } finally {
      setLaunching(false);
    }
  }

  async function saveByod(e: React.FormEvent) {
    e.preventDefault();
    setSavingByod(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/domain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: byodDomain.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save domain");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save domain");
    } finally {
      setSavingByod(false);
    }
  }

  async function checkAvailability(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    setResult(null);
    setShowContactForm(false);
    try {
      const res = await fetch(`/api/leads/${lead.id}/domain?domain=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not check that domain");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that domain");
    } finally {
      setChecking(false);
    }
  }

  async function confirmBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setBuying(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/domain/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: result.domain, years: 1, contact }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setBuying(false);
    }
  }

  if (lead.custom_domain) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-medium">Domain</p>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{lead.custom_domain}</span>
            {lead.domain_source && <Badge variant="outline">{lead.domain_source === "purchased" ? "Purchased via us" : "Client-owned"}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {lead.live_at ? `Live since ${new Date(lead.live_at).toLocaleDateString()}` : "Attached after payment; waiting for final operator launch approval."}
          </p>
          {!lead.live_at && lead.paid_at && (
            <Button type="button" size="sm" className="mt-2 gap-1.5" onClick={launchSite} disabled={launching}>
              <Rocket className="h-3.5 w-3.5" /> {launching ? "Launching..." : "Go live after final QA"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <p className="text-sm font-medium">Domain</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={mode === "byod" ? "default" : "outline"} onClick={() => setMode("byod")}>
            Client already has one
          </Button>
          <Button type="button" size="sm" variant={mode === "search" ? "default" : "outline"} onClick={() => setMode("search")}>
            Find &amp; buy one
          </Button>
        </div>

        {mode === "byod" && (
          <form onSubmit={saveByod} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="byod-domain">Domain</Label>
              <Input
                id="byod-domain"
                required
                placeholder="theirbusiness.com"
                value={byodDomain}
                onChange={(e) => setByodDomain(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={savingByod}>
              {savingByod ? "Saving..." : "Save"}
            </Button>
          </form>
        )}

        {mode === "search" && (
          <div className="space-y-3">
            <form onSubmit={checkAvailability} className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="search-domain">Search for a domain</Label>
                <Input
                  id="search-domain"
                  required
                  placeholder="theirbusiness.com"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={checking}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Check
              </Button>
            </form>

            {result && (
              <div className="rounded-lg border border-border p-3 text-sm">
                {result.available ? (
                  <>
                    <p className="flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" /> {result.domain} is available
                    </p>
                    {result.price && (
                      <p className="mt-1 text-muted-foreground">
                        ${result.price.purchasePrice.toFixed(2)}/yr (renews at ${result.price.renewalPrice.toFixed(2)}/yr) — charged to your Vercel
                        account.
                      </p>
                    )}
                    {!showContactForm && (
                      <Button type="button" size="sm" className="mt-2" onClick={() => setShowContactForm(true)}>
                        Buy this domain
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">{result.domain} is already taken.</p>
                )}
              </div>
            )}

            {showContactForm && result?.available && (
              <form onSubmit={confirmBuy} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Registrant (WHOIS) contact — required by ICANN for the domain registration.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input required placeholder="First name" value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} />
                  <Input required placeholder="Last name" value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} />
                  <Input required type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                  <Input required placeholder="Phone (+15551234567)" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                  <Input required placeholder="Address" className="col-span-2" value={contact.address1} onChange={(e) => setContact({ ...contact, address1: e.target.value })} />
                  <Input required placeholder="City" value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
                  <Input required placeholder="State" value={contact.state} onChange={(e) => setContact({ ...contact, state: e.target.value })} />
                  <Input required placeholder="ZIP" value={contact.zip} onChange={(e) => setContact({ ...contact, zip: e.target.value })} />
                  <Input required placeholder="Country (US)" value={contact.country} onChange={(e) => setContact({ ...contact, country: e.target.value.toUpperCase() })} />
                </div>
                <Button type="submit" disabled={buying} className="w-full">
                  {buying ? "Purchasing..." : `Confirm purchase — $${result.price?.purchasePrice.toFixed(2) ?? "?"}`}
                </Button>
              </form>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </CardContent>
    </Card>
  );
}
