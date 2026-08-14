import { cn } from "@/lib/utils";

const COLORS = ["bg-primary", "bg-success", "bg-warning", "bg-danger"];

function colorFor(name: string) {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("inline-flex h-8 w-8 shrink-0 rounded-full object-cover", className)} />;
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        colorFor(name || "?"),
        className
      )}
    >
      {initials}
    </span>
  );
}
