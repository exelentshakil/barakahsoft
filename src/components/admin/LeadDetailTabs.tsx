"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface LeadTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

// Six lead tabs (plan §5/PRD atomic breakdown): Overview, Redesign, Audit,
// Map grid, Competitors, How to close. Plain client-side tab state rather
// than routed tabs — this is a single operator's working view of one lead,
// not something that needs deep-linkable URLs per tab.
export function LeadDetailTabs({ tabs }: { tabs: LeadTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
