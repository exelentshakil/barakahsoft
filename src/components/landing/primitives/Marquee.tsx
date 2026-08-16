import { cn } from "@/lib/utils";

// Pure CSS infinite horizontal scroll -- content is duplicated once and the
// whole pair translates by -50% (or +50% when reversed) on a loop, reading
// as continuous with no JS, no layout thrash. Pauses on hover, disabled
// under prefers-reduced-motion (motion-reduce:animate-none).
//
// Deliberately NOT scroll-linked (contrast: a pinned `position: sticky`
// track driven by scroll progress) -- that technique was tried first for
// the proof/industry galleries and broke under any full-page/all-in-one
// screenshot capture (the tall artificial track renders as dead blank
// space when a tool captures the whole document height as one viewport,
// since `sticky` has nothing real to pin against there). A plain looping
// animation always has real content on screen at any single frame,
// including a static capture, so it's the safer choice for a page this
// gets screenshotted for review.
export function Marquee({
  children,
  className,
  durationSeconds = 28,
  reverse = false,
  gap = "gap-16",
}: {
  children: React.ReactNode[];
  className?: string;
  durationSeconds?: number;
  reverse?: boolean;
  gap?: string;
}) {
  return (
    <div className={cn("group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]", className)}>
      <div
        className={cn(
          "flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none",
          gap,
          reverse && "[animation-direction:reverse]"
        )}
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
