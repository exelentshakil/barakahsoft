"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

// The lead workspace as a numbered route, not a wall.
//
// Everything in this workspace is one linear job — a lead arrives, a site is
// built, the evidence is measured, a human approves it, it is sent and paid
// for — but it rendered as a single 700-line scroll in which the order was
// implicit and the current position was not visible at all. Someone who has
// not built the pipeline cannot tell from that page what they are supposed
// to do next, which is the whole problem this solves.
//
// Each step reports whether it is DONE, so the tab strip doubles as the
// progress record for the lead: the next thing to do is the first step
// without a tick.
//
// IMPORTANT — panels are hidden with CSS, never unmounted. An earlier tabs
// layout in this file conditionally rendered its children, and the panels
// mounted inside it never ran at all: the approval gate and domain picker
// were unreachable, so no lead could be approved. Beyond that, these panels
// own real live state — the generation studio re-attaches to a running build
// job on mount, the audit and visibility panels poll, and the realtime hook
// drives them — and unmounting a tab would silently stop all of it. Hiding
// keeps every panel alive while only one is on screen.

export interface WorkspaceStep {
  id: string;
  /** Short tab label. */
  label: string;
  /** One line under the strip explaining what this step is for. */
  hint: string;
  icon: LucideIcon;
  /** Drives the tick. True once this stage has actually happened. */
  done: boolean;
}

export function WorkspaceTabs({
  steps,
  active,
  onChange,
}: {
  steps: WorkspaceStep[];
  active: string;
  onChange: (id: string) => void;
}) {
  const current = steps.find((s) => s.id === active) ?? steps[0];

  // A step whose id matches no panel renders an empty screen, and the tab
  // strip looks completely fine while it happens — which is exactly how the
  // audit and delivery panels went missing once. Shout in development
  // rather than let a silent blank pass for a working tab.
  if (process.env.NODE_ENV !== "production" && !steps.some((s) => s.id === active)) {
    console.error(
      `[WorkspaceTabs] active tab "${active}" matches no step id (${steps.map((s) => s.id).join(", ")}). Its panel will render blank.`
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-2 shadow-sm">
      {/* Two rows of four, never eight across. Eight columns in this panel
          leaves about forty pixels for the label, which truncated every one
          of them to "Thei…" and "App…" — a tab nobody can read is a tab
          nobody presses. */}
      <div
        className="grid grid-cols-2 gap-1 sm:grid-cols-4"
        role="tablist"
        aria-label="Lead delivery steps"
      >
        {steps.map((step, index) => {
          const isActive = step.id === active;
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={step.hint}
              onClick={() => onChange(step.id)}
              className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                isActive ? "bg-[#533afd] text-white shadow-sm" : "text-[#42506a] hover:bg-[#f0f3ff]"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : step.done
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#f0f3ff] text-[#533afd]"
                }`}
              >
                {step.done && !isActive ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-bold">{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {current && (
        <p className="px-2.5 pb-1 pt-2.5 text-[11px] leading-relaxed text-[#60778d]">
          <span className="font-bold text-[#0d1738]">{current.label}.</span> {current.hint}
        </p>
      )}
    </div>
  );
}

/**
 * One step's content.
 *
 * Hidden rather than unmounted — see the note above. `hidden` here is
 * Tailwind's display:none, which keeps the subtree mounted and its effects,
 * intervals and subscriptions running.
 */
export function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" className={active ? "space-y-8" : "hidden"}>
      {children}
    </div>
  );
}
