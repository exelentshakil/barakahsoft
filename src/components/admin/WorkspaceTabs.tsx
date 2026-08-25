"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

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

  if (process.env.NODE_ENV !== "production" && !steps.some((s) => s.id === active)) {
    console.error(
      `[WorkspaceTabs] active tab "${active}" matches no step id (${steps.map((s) => s.id).join(", ")}). Its panel will render blank.`
    );
  }

  return (
    // The rail only. The step's content is a sibling of this component, not
    // a child, so that it can sit beside the rail and use the full remaining
    // width — rendering the rail and then the panels underneath left a
    // column of empty space next to the rail and pushed the work down.
    <div
      className="flex shrink-0 gap-1 overflow-x-auto lg:sticky lg:top-20 lg:w-[150px] lg:flex-col lg:self-start lg:overflow-visible"
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
            className={`flex min-w-0 shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors lg:w-full lg:shrink ${
              isActive
                ? "bg-indigo-600 font-bold text-white"
                : "font-semibold text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-black ${
                isActive
                  ? "bg-white/20 text-white"
                  : step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {step.done && !isActive ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
            <span className="truncate text-sm">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function WorkspaceTabHint({ steps, active }: { steps: WorkspaceStep[]; active: string }) {
  const current = steps.find((s) => s.id === active);
  if (!current) return null;
  return (
    <p className="rounded-lg border border-slate-200/60 bg-slate-50/80 px-3.5 py-2.5 text-sm leading-relaxed text-slate-600">
      <strong className="font-bold text-slate-900">{current.label}:</strong> {current.hint}
    </p>
  );
}

export function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" className={active ? "space-y-8" : "hidden"}>
      {children}
    </div>
  );
}
