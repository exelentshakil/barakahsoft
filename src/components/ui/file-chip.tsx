import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileChip({ name, url, className }: { name: string; url?: string; className?: string }) {
  const Comp = url ? "a" : "span";
  return (
    <Comp
      {...(url ? { href: url, target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted",
        className
      )}
    >
      <Paperclip className="h-3 w-3 text-muted-foreground" />
      {name}
    </Comp>
  );
}
