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
  return (
    <div
      className="flex shrink-0 gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:w-[160px] lg:flex-col lg:self-start lg:overflow-visible lg:pb-0"
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
            className={`group relative flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-150 lg:w-full lg:shrink ${
              isActive
                ? "bg-[#533afd] text-white font-bold shadow-sm shadow-indigo-500/20"
                : "text-slate-600 font-semibold hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black transition-colors ${
                isActive
                  ? "bg-white/20 text-white"
                  : step.done
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
              }`}
            >
              {step.done && !isActive ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
            </span>
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
              }`}
            />
            <span className="truncate text-xs tracking-tight">{step.label}</span>
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
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-2.5 text-xs leading-relaxed text-slate-600 shadow-2xs backdrop-blur-xs">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 font-bold text-[11px]">
        ℹ
      </span>
      <p className="min-w-0 truncate">
        <strong className="font-bold text-slate-900 mr-1.5">{current.label}:</strong>
        {current.hint}
      </p>
    </div>
  );
}

export function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div role="tabpanel" className={active ? "space-y-6" : "hidden"}>
      {children}
    </div>
  );
}
