import type { LucideIcon } from "lucide-react";

// A small uppercase "kicker" above a section's h2 -- premium-marketing-site
// visual rhythm, and a cheap "authority" signal. Purely decorative, never
// carries a real claim itself.
export function SectionEyebrow({ icon: Icon, children, align = "center" }: { icon?: LucideIcon; children: React.ReactNode; align?: "left" | "center" }) {
  return (
    <div className={`${align === "center" ? "mx-auto" : ""} mb-3 flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}
