import { cn } from "@/lib/utils";

// Pure CSS infinite horizontal scroll -- content is duplicated once and the
// whole pair translates by -50% on a loop, reading as continuous with no
// JS, no layout thrash. Pauses on hover, disabled under
// prefers-reduced-motion (motion-reduce:animate-none). Right fit for a
// low-stakes logo strip, not the main storytelling gallery -- that's
// ScrollSlideRow, which tracks page scroll instead of autoplaying.
export function Marquee({ children, className, durationSeconds = 28 }: { children: React.ReactNode[]; className?: string; durationSeconds?: number }) {
  return (
    <div className={cn("group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]", className)}>
      <div
        className="flex w-max animate-marquee gap-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {[...children, ...children].map((child, i) => (
          <div key={i} className="flex shrink-0 items-center">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
