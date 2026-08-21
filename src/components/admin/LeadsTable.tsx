"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type LeadRow = { id: string; slug: string; business_name: string | null; contact_name: string | null; source_url: string; source: string; help_needed: string[]; status: string; created_at: string; paid_at: string | null; delivered_at: string | null };

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteOne(id: string) {
    if (!confirm("Delete this lead? This can't be undone.")) return;
    setBusy(true);
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} lead${selected.size > 1 ? "s" : ""}? This can't be undone.`)) return;
    setBusy(true);
    await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)))}
          />
          Select all
        </label>
        {selected.size > 0 && (
          <Button size="sm" variant="outline" disabled={busy} onClick={deleteSelected} className="text-danger">
            <Trash2 className="h-4 w-4" /> Delete {selected.size} selected
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 px-2 hover:bg-accent">
              <Checkbox checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} className="shrink-0" />
              <Link href={`/admin/leads/${lead.id}`} className="flex flex-1 items-center justify-between px-2 py-3">
                <div>
                    <div className="flex items-center gap-2"><p className="font-medium">{lead.business_name || lead.contact_name || lead.source_url}</p><Badge variant="secondary">{lead.source}</Badge></div>
                    <p className="text-sm text-muted-foreground">{lead.source_url}</p>
                    {lead.help_needed.length > 0 && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{lead.help_needed.join(" · ")}</p>}
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </Link>
              <a
                href={`/s/${lead.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Portal
              </a>
              <Button
                size="icon"
                variant="ghost"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  deleteOne(lead.id);
                }}
                aria-label="Delete lead"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
