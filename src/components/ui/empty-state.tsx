import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-14 text-center", className)}>
      {Icon && <Icon className="mb-1 h-8 w-8 text-muted-foreground/50" />}
      <p className="font-medium text-foreground">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}
