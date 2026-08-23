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

  return (
    <div className="rounded-2xl border border-[#e5e7f2] bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Lead delivery steps">
        {steps.map((step, index) => {
          const isActive = step.id === active;
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(step.id)}
              className={`group flex flex-1 min-w-[7.5rem] items-center gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                isActive ? "bg-[#533afd] text-white shadow-sm" : "text-[#42506a] hover:bg-[#f0f3ff]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                  isActive
                    ? "bg-white/15 text-white"
                    : step.done
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[#f0f3ff] text-[#533afd]"
                }`}
              >
                {step.done && !isActive ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{step.label}</span>
                </span>
                <span
                  className={`block text-[10px] font-medium ${
                    isActive ? "text-white/70" : step.done ? "text-emerald-600" : "text-[#777588]"
                  }`}
                >
                  {step.done ? "Done" : "To do"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {current && (
        <p className="px-3 pb-1 pt-2 text-[11px] leading-relaxed text-[#60778d]">{current.hint}</p>
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
