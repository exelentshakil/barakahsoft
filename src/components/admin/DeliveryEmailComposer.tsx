"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Lead } from "@/types/database";

export function DeliveryEmailComposer({ lead }: { lead: Lead }) {
  const router = useRouter();
  const businessName = lead.business_name || lead.source_url;

  const [subject, setSubject] = useState(
    `Your Rebuilt Homepage & Speed Audit are Ready! (${businessName})`
  );
  const [message, setMessage] = useState(
    `Hi ${lead.contact_name || "there"}, we finished your free 48-hour homepage redesign for ${businessName}. We audited your current mobile speed, mapped your local search rankings, and built a fresh concept tailored to your brand.`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(Boolean(lead.delivered_at));

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!lead.email) {
      alert("Lead has no email address configured.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Dispatch failed");
      }
      setSent(true);
      if (data.warning) {
        alert(data.warning);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send delivery email. Check Resend/Brevo API keys.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Delivery Email Composer (Email #2)</h3>
              <p className="text-[11px] text-muted-foreground">
                Sent to <code className="font-mono text-primary">{lead.email || "No email on file"}</code>
              </p>
            </div>
          </div>
          {sent && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Concept Delivered
            </span>
          )}
        </div>

        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <Label htmlFor="delivery-subject" className="text-xs font-semibold">Email Subject Line</Label>
            <Input
              id="delivery-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="delivery-message" className="text-xs font-semibold">Opening Message / Compliment</Label>
            <Textarea
              id="delivery-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              Automatically includes signed magic link to <code className="font-mono text-primary">/s/{lead.slug}</code>
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={sending || !lead.email}
              className="font-bold gap-1.5 bg-[#07284d] text-white hover:bg-[#0c68c8]"
            >
              <Send className="h-3.5 w-3.5 text-[#ffd12d]" />
              {sending ? "Sending..." : sent ? "Resend Delivery Email" : "Send Delivery Email Now"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
