import type { MockupData } from "@/components/mockup/SocialLaunchMockup";

export function ProposalAbout({ data }: { data: MockupData }) {
  const proof = [
    data.city ? `Serving ${data.city}` : null,
    data.yearsExperience ? `${data.yearsExperience}+ years in business` : null,
    data.reviewCount ? `${data.reviewCount} customer reviews` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#c7d0fb] bg-white shadow-sm relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#533afd]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch relative z-10">
        <div className="relative min-h-[280px] bg-[#0d1738]">
          {data.aboutCaptureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.aboutCaptureUrl}
              alt={`${data.businessName} About and team section`}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full min-h-[280px] items-end bg-gradient-to-br from-[#533afd] via-[#263477] to-[#0d1738] p-8">
              <p className="max-w-xs text-2xl font-bold leading-tight text-white">Built around the people behind the work.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1738]/45 to-transparent" />
        </div>

        <div className="space-y-5 p-7 sm:p-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#533afd]">Built for {data.businessName}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
              Your reputation should be doing more of the selling.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[#42506a]">
            We did not start with a template. We started with your real business, your team, and the proof customers already
            have to trust you. The redesign puts that credibility in front of the right customer before they call someone else.
          </p>
          {data.aboutBody && <p className="text-sm leading-relaxed text-[#42506a]">{data.aboutBody}</p>}
          {proof.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-[#e5e7f2] pt-4">
              {proof.map((item) => (
                <span key={item} className="rounded-full border border-[#c7d0fb] bg-[#f0f3ff] px-3 py-1.5 text-xs font-bold text-[#533afd]">
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
