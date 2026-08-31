// The hero's review pill, in React.
//
// The generated site draws this with `reviewPills` in templates/parts.ts; the
// portal is React, so the treatment is mirrored rather than shared. Keep the
// two in step: overlapping platform marks, the score and stars on one line,
// the count underlined beneath as the thing a stranger can go and verify.

const GoogleMark = () => (
  <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(13,23,56,0.18)] ring-1 ring-[#e5e7f2]">
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  </span>
);

const FacebookMark = () => (
  <span className="-ml-2.5 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#1877F2] shadow-[0_1px_3px_rgba(13,23,56,0.18)] ring-1 ring-white">
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="#fff" aria-hidden="true">
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3 0-1.3-.1-2.45-.1-2.4 0-4.05 1.5-4.05 4.2v2.2H7.5V13h2.7v8z" />
    </svg>
  </span>
);

export function ReviewBadge({ rating, reviewCount }: { rating: number; reviewCount?: number | null }) {
  const filled = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-[#e5e7f2] bg-white px-4 py-3 shadow-sm shadow-[#533afd]/5">
      <span className="flex flex-none items-center">
        <GoogleMark />
        <FacebookMark />
      </span>
      <span className="flex flex-col gap-0.5 leading-tight">
        <span className="flex items-center gap-1.5">
          <strong className="text-base font-extrabold tracking-tight text-[#0d1738]">{rating}</strong>
          <span className="inline-flex gap-px text-[#f5b301]" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={i < filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
                <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </span>
        </span>
        <span className="whitespace-nowrap text-[0.7rem] font-bold text-[#7a86a1] underline underline-offset-2">
          {reviewCount ? `${reviewCount} Google reviews` : "Google reviews"}
        </span>
      </span>
    </div>
  );
}
