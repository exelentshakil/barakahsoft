import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4",
  md: "h-11 w-11 rounded-xl [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-14 w-14 rounded-2xl [&>svg]:h-6 [&>svg]:w-6",
} as const;

// A lucide icon in a gradient-filled badge -- the recurring "authority"
// building block across trust-strip/expertise/process/certifications/
// audience-segments and the new page templates.
export function IconBadge({ icon: Icon, size = "md", className }: { icon: LucideIcon; size?: keyof typeof SIZE_CLASSES; className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center bg-gradient-primary text-primary-foreground shadow-lift", SIZE_CLASSES[size], className)}>
      <Icon />
    </div>
  );
}
