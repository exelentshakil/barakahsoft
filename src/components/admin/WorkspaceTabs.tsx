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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm space-y-2.5">
      <div
        className="grid grid-cols-2 gap-1.5 sm:grid-cols-4"
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
              className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                  isActive
                    ? "bg-white/20 text-white"
                    : step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {step.done && !isActive ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span className="truncate text-sm">{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {current && (
        <div className="rounded-xl bg-slate-50/80 px-3.5 py-2.5 border border-slate-200/60 flex items-start gap-2">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            <strong className="font-bold text-slate-900">{current.label}:</strong> {current.hint}
          </p>
        </div>
      )}
    </div>
  );
}

export function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" className={active ? "space-y-8" : "hidden"}>
      {children}
    </div>
  );
}
