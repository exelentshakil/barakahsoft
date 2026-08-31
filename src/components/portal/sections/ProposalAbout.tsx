import type { MockupData } from "@/components/mockup/SocialLaunchMockup";
import { Shield, MapPin, CalendarDays } from "lucide-react";
import { ReviewBadge } from "@/components/portal/ReviewBadge";
import { trimParagraphs } from "@/lib/text-trim";

export function ProposalAbout({ data }: { data: MockupData }) {
  // One paragraph, not the company's full history. This column is balanced
  // against a fixed capture on the left, and the standing intro paragraph
  // above it already carries four lines before the client's own words start.
  const aboutParagraphs = trimParagraphs(data.aboutBody ?? "", 180, 1)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Only facts we actually hold. A default here is a claim about someone
  // else's business printed on a document they are meant to trust.
  const facts = [
    data.city ? { icon: MapPin, value: data.city, label: "Service area" } : null,
    data.yearsExperience ? { icon: CalendarDays, value: `${data.yearsExperience}+ years`, label: "In business" } : null,
  ].filter(Boolean) as { icon: typeof MapPin; value: string; label: string }[];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#e5e7f2] bg-white p-8 sm:p-12 shadow-xl shadow-[#533afd]/5">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#533afd]/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#ffd12d]/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 grid gap-10 lg:gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="order-2 lg:order-1 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#533afd] to-[#263477] rounded-[2.5rem] transform -rotate-3 scale-[1.02] opacity-10" />
          {/* No fixed aspect ratio: the capture is a whole About section, and
              its height varies with how much copy the business wrote. */}
          <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-[#0d1738]">
            {data.aboutCaptureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.aboutCaptureUrl}
                alt={`${data.businessName} About and team section`}
                className="block h-auto w-full"
              />
            ) : (
              <div className="flex aspect-[4/5] items-end bg-gradient-to-br from-[#533afd] via-[#263477] to-[#0d1738] p-10">
                <p className="max-w-xs text-3xl font-bold leading-tight text-white">Built around the people behind the work.</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1738]/80 via-[#0d1738]/10 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 p-2 bg-white/20 rounded-xl">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/60">Owner-operated</p>
                    <p className="font-bold text-sm leading-tight">{data.founderName || "The founding team"}</p>
                    <p className="mt-1 text-[0.7rem] leading-snug text-white/70">
                      Direct oversight on every project, start to finish.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#533afd]/20 bg-[#533afd]/5 px-3 py-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#533afd]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Built for {data.businessName}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-4xl leading-tight">
              Your reputation should be selling for you.
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-base leading-relaxed text-[#42506a]">
              No template. We started with your real business, your team, and the proof customers already trust.
            </p>
            {aboutParagraphs.map((para, i) => (
              <p key={i} className="border-l-2 border-[#533afd]/25 pl-4 text-base italic leading-relaxed text-[#42506a]">
                {para}
              </p>
            ))}
          </div>

          {(data.rating || facts.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {data.rating && <ReviewBadge rating={data.rating} reviewCount={data.reviewCount} />}
              {facts.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-3 rounded-2xl border border-[#e5e7f2] bg-white px-4 py-3 shadow-sm shadow-[#533afd]/5"
                >
                  <span className="inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[#f0f3ff] text-[#533afd]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex flex-col gap-0.5 leading-tight">
                    <strong className="text-base font-extrabold tracking-tight text-[#0d1738]">{value}</strong>
                    <span className="whitespace-nowrap text-[0.7rem] font-bold text-[#7a86a1]">{label}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
