import { CheckCircle2, ExternalLink, MessageCircle } from "lucide-react";

interface ProposalHeroProps {
  businessName: string;
  address: string | null;
  rating: string | null;
  reviewCount: string | null;
  leadSlug: string;
  isPaid: boolean;
  chatContext: string;
}

/**
 * The town out of a formatted postal address.
 *
 * Google returns "9751 Susan Rd, Philadelphia, PA 19115, USA", and dropping
 * that whole string into a sentence gave a client "most of the businesses
 * near 9751 Susan Rd, Philadelphia, PA 19115, USA you are competing with".
 * Nobody says their own address that way, and reading it in a sentence
 * written for them is the tell that nobody wrote it.
 */
function townFrom(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  // Street, town, region + postcode, country. Two parts or fewer is not a
  // full postal address, so there is nothing safe to pull out of it.
  if (parts.length < 3) return null;
  return parts[parts.length - 3] || null;
}

export function ProposalHero({
  businessName,
  address,
  rating,
  reviewCount,
  leadSlug,
  isPaid,
  chatContext,
}: ProposalHeroProps) {
  const town = townFrom(address);

  return (
    <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-12 shadow-sm space-y-6">
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
          Your rebuilt homepage
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl leading-tight">
        {businessName}
      </h1>

      {/* The lead was won by a page that said "you already know it's not
          good" and then handed to one that said "Digital X-Ray & Proposal
          Ready". That voice change lands at the exact moment someone is
          deciding whether to trust us, and it reads as the salesperson
          arriving. Same plain voice throughout.

          Written only from what is known: the previous copy asserted a
          rating, a review count and a city unconditionally, so a business
          with none of them was told about its "real proof" of undefined
          reviews. */}
      <p className="max-w-3xl text-base leading-relaxed text-[#42506a] sm:text-lg">
        {rating && reviewCount ? (
          <>
            {reviewCount} people have rated you {rating} stars. That is better than most of the businesses
            {town ? ` in ${town}` : " near you"} you are competing with — and almost none of it is on your website. You
            are not losing work because of the work. You are losing it before anyone gets that far.
          </>
        ) : (
          <>
            We went through your site{town ? `, and how you show up around ${town}` : ""}, page by page. Everything
            below is on your site today, so you can open it alongside this and check any of it.
          </>
        )}
      </p>

      <div className="pt-2 flex flex-wrap gap-4">
        <a
          href={`/s/${leadSlug}?view=preview`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#432bd9]"
        >
          See your new homepage <ExternalLink className="h-4 w-4" />
        </a>
        {isPaid ? (
          <div className="inline-flex items-center gap-2 rounded-md bg-[#eaf8f0] px-6 py-3.5 text-sm font-semibold text-[#0b8f5b]">
            <CheckCircle2 className="h-4 w-4" /> Payment received · launch workflow active
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              const crisp = (window as Window & { $crisp?: unknown[] }).$crisp;
              crisp?.push(["set", "message:text", [chatContext]]);
              crisp?.push(["do", "chat:open"]);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#09744a]"
          >
            Claim Your Launch Spot · 100% Risk-Free <MessageCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="border-t border-[#e5e7f2] pt-8">
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div className="rounded-xl bg-[#f0f3ff] p-4 border border-[#e5e7f2]">
            {/* Said the way the page that won this lead says things. "Website
                X-Ray & Audit" is our word for it, not theirs. */}
            <span className="font-bold text-[#533afd]">Done ✓</span>
            <p className="mt-1 text-[#0d1738] font-semibold text-sm">We rebuilt your homepage</p>
          </div>
          <div className="rounded-xl border-2 border-[#533afd] bg-white p-4 shadow-sm">
            <span className={`font-bold ${isPaid ? "text-[#0b8f5b]" : "text-[#533afd]"}`}>{isPaid ? "Done ✓" : "You are here"}</span>
            <p className="mt-1 text-[#0d1738] font-semibold text-sm">{isPaid ? "You said yes" : "Have a look at it"}</p>
          </div>
          <div className={`rounded-xl p-4 border ${isPaid ? "border-2 border-[#0b8f5b] bg-[#eaf8f0] text-[#0b8f5b]" : "border-[#e5e7f2] bg-[#f9f9ff] text-[#777588]"}`}>
            <span className="font-bold">{isPaid ? "In progress" : "If you want it"}</span>
            <p className="mt-1 font-semibold text-sm">{isPaid ? "Live within 48 hours" : "Live within 48 hours"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
