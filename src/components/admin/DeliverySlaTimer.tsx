"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Timer } from "lucide-react";

// The 48-hour delivery promise, as a live clock.
//
// A lead that has been sitting for two days is the single most expensive
// thing in this pipeline: the client filled in a form expecting a rebuilt
// homepage, and every hour past that is trust spent. A status badge reading
// "qa_pending" does not communicate urgency; a clock counting down — and
// counting UP once it is blown — does, at a glance, without anyone having
// to work out when the lead came in.
//
// The clock stops the moment the site is delivered, and then reports
// whether the promise was kept rather than disappearing, because "delivered
// 6 hours late" is a fact worth seeing on the record.

const SLA_HOURS = 48;

export type SlaState = "on-track" | "urgent" | "overdue" | "met" | "missed";

interface SlaReading {
  state: SlaState;
  /** Milliseconds remaining (positive) or overdue (negative). */
  deltaMs: number;
}

export function readSla(createdAt: string, deliveredAt: string | null, now: number): SlaReading {
  const deadline = new Date(createdAt).getTime() + SLA_HOURS * 3_600_000;

  if (deliveredAt) {
    const delivered = new Date(deliveredAt).getTime();
    const delta = deadline - delivered;
    return { state: delta >= 0 ? "met" : "missed", deltaMs: delta };
  }

  const delta = deadline - now;
  if (delta < 0) return { state: "overdue", deltaMs: delta };
  // Six hours is roughly the point past which a same-day fix stops being
  // realistic, so it is where the badge starts demanding attention.
  if (delta < 6 * 3_600_000) return { state: "urgent", deltaMs: delta };
  return { state: "on-track", deltaMs: delta };
}

/** "2d 4h", "5h 12m", "48m 09s" — the unit that matters at that range. */
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

const STYLES: Record<SlaState, { wrap: string; dot: string; label: string }> = {
  "on-track": {
    wrap: "border-[#c7d0fb] bg-[#f0f3ff] text-[#533afd]",
    dot: "bg-[#533afd]",
    label: "left to deliver",
  },
  urgent: {
    wrap: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500 animate-pulse",
    label: "left to deliver",
  },
  overdue: {
    wrap: "border-red-300 bg-red-50 text-red-700",
    dot: "bg-red-500 animate-pulse",
    label: "past the 48h promise",
  },
  met: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    label: "inside the 48h promise",
  },
  missed: {
    wrap: "border-[#e5e7f2] bg-[#fbfbfd] text-[#777588]",
    dot: "bg-[#777588]",
    label: "late when delivered",
  },
};

function Icon({ state }: { state: SlaState }) {
  if (state === "overdue") return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
  if (state === "met") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
  if (state === "missed") return <Clock3 className="h-3.5 w-3.5 shrink-0" />;
  return <Timer className="h-3.5 w-3.5 shrink-0" />;
}

export function DeliverySlaTimer({
  createdAt,
  deliveredAt,
  compact = false,
}: {
  createdAt: string;
  deliveredAt?: string | null;
  compact?: boolean;
}) {
  // Null until mounted: the server and the client would otherwise render two
  // different "now" values and React would report a hydration mismatch on
  // every lead in the list.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    // A delivered lead is frozen — there is nothing left to count.
    if (deliveredAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deliveredAt]);

  if (now === null) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e5e7f2] bg-[#fbfbfd] font-semibold text-[#777588] ${
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Timer className="h-3.5 w-3.5 shrink-0" />
        <span className="tabular-nums">--</span>
      </span>
    );
  }

  const { state, deltaMs } = readSla(createdAt, deliveredAt ?? null, now);
  const style = STYLES[state];
  const duration = formatDuration(deltaMs);

  return (
    <span
      title={
        deliveredAt
          ? `Delivered ${new Date(deliveredAt).toLocaleString()} · 48h target from ${new Date(createdAt).toLocaleString()}`
          : `48h target from ${new Date(createdAt).toLocaleString()}`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold ${style.wrap} ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      <Icon state={state} />
      <span className="tabular-nums">{duration}</span>
      {!compact && <span className="font-medium opacity-80">{style.label}</span>}
    </span>
  );
}
