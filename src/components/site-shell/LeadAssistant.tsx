"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageSquare, Send } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";

// The client's own AI receptionist, on their own site.
//
// This replaces a three-step picker that was a form wearing a chat's
// clothing: choose a service, type your details, submit. A visitor with an
// actual question ("do you do flat roofs on a 1920s row home?") had nowhere
// to put it, and the business never heard the question that would have won
// the job.
//
// It now talks — grounded in this business's real services, areas and
// number by /api/s/[slug]/assistant — and captures the enquiry mid
// conversation rather than making the visitor fill anything in. The moment
// they have given a name and a way to be reached, the business gets the
// email.
//
// Styled from the lead's own design tokens, because it sits on THEIR site:
// a widget in someone else's brand colours reads as a bolted-on third-party
// tool, which is exactly what it must not look like.

interface Message {
  role: "visitor" | "assistant";
  text: string;
  at: number;
}

function timeLabel(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function LeadAssistant({ payload }: { payload: SitePayload }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [captured, setCaptured] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const greeting = `Hi — ask me anything about ${payload.businessName}.`;

  // Newest message in view, without yanking the whole page around.
  useEffect(() => {
    if (!open) return;
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, busy]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    const next: Message[] = [...messages, { role: "visitor", text, at: Date.now() }];
    setMessages(next);
    setDraft("");
    setBusy(true);

    try {
      const res = await fetch(`/api/s/${payload.leadSlug}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, text: m.text })) }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data.reply ||
        (payload.nap.phone
          ? `Sorry — I couldn't get that. Call us on ${payload.nap.phone} and we'll help straight away.`
          : "Sorry — I couldn't get that. Leave your name and number and we'll come back to you.");
      setMessages((prev) => [...prev, { role: "assistant", text: reply, at: Date.now() }]);
      if (data.captured) setCaptured(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: payload.nap.phone
            ? `Sorry — I lost connection. Call us on ${payload.nap.phone} and we'll help straight away.`
            : "Sorry — I lost connection. Please try again in a moment.",
          at: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="bs-assistant fixed bottom-24 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl sm:right-6"
          style={{
            background: "var(--bs-surface, #ffffff)",
            borderColor: "var(--bs-border-color, #e5e7f2)",
            maxHeight: "min(32rem, calc(100vh - 8rem))",
          }}
        >
          <div
            className="flex items-center justify-between gap-2 px-4 py-3"
            style={{ background: "var(--bs-primary, #0d1738)", color: "var(--bs-on-primary, #ffffff)" }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {payload.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={payload.logoUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-0.5"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {payload.businessName.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">We&apos;re online</p>
                <p className="truncate text-[11px] opacity-80">Ask us anything</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 transition hover:bg-white/15"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            <Bubble payload={payload} text={greeting} at={null} />
            {messages.map((message, index) =>
              message.role === "assistant" ? (
                <Bubble key={index} payload={payload} text={message.text} at={message.at} />
              ) : (
                <div key={index} className="flex justify-end">
                  <div
                    className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm"
                    style={{
                      background: "var(--bs-primary, #0d1738)",
                      color: "var(--bs-on-primary, #ffffff)",
                    }}
                  >
                    {message.text}
                    <span className="mt-1 block text-[10px] opacity-70">{timeLabel(message.at)}</span>
                  </div>
                </div>
              )
            )}

            {busy && (
              <div className="flex items-center gap-1.5 pl-11" aria-live="polite">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </div>
            )}

            {captured && (
              <p
                className="rounded-lg px-3 py-2 text-[11px] font-semibold"
                style={{ background: "var(--bs-surface-alt, #f4f6fb)", color: "var(--bs-ink-muted, #5f6b7a)" }}
              >
                Thanks — your details are with us and someone will follow up directly.
              </p>
            )}
          </div>

          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t px-3 py-2.5"
            style={{ borderColor: "var(--bs-border-color, #e5e7f2)" }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message"
              aria-label="Type a message"
              className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm outline-none"
              style={{ color: "var(--bs-ink, #1b1b1b)" }}
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40"
              style={{ background: "var(--bs-primary, #0d1738)", color: "var(--bs-on-primary, #ffffff)" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <p
            className="px-4 pb-2.5 text-center text-[10px]"
            style={{ color: "var(--bs-ink-muted, #777588)" }}
          >
            Powered by {payload.businessName}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition hover:scale-105 sm:right-6"
        style={{ background: "var(--bs-primary, #0d1738)", color: "var(--bs-on-primary, #ffffff)" }}
      >
        {open ? <ChevronDown className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </>
  );
}

function Bubble({
  payload,
  text,
  at,
}: {
  payload: SitePayload;
  text: string;
  at: number | null;
}) {
  return (
    <div className="flex items-end gap-2">
      {payload.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={payload.logoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-contain"
          style={{ background: "var(--bs-surface-alt, #f4f6fb)" }}
        />
      ) : (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--bs-surface-alt, #f4f6fb)", color: "var(--bs-ink, #1b1b1b)" }}
        >
          {payload.businessName.charAt(0)}
        </span>
      )}
      <div
        className="max-w-[80%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm"
        style={{ background: "var(--bs-surface-alt, #f4f6fb)", color: "var(--bs-ink, #1b1b1b)" }}
      >
        {text}
        {at !== null && (
          <span className="mt-1 block text-[10px]" style={{ color: "var(--bs-ink-muted, #777588)" }}>
            {timeLabel(at)}
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ background: "var(--bs-ink-muted, #777588)", animationDelay: delay }}
    />
  );
}
