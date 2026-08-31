import type { MockupData } from "@/components/mockup/SocialLaunchMockup";
import { Shield } from "lucide-react";

export function ProposalAbout({ data }: { data: MockupData }) {
  // The business's own about copy arrives as one string with its paragraph
  // breaks intact; rendering it in a single <p> made a company history read
  // as an unbroken wall of text.
  const aboutParagraphs = (data.aboutBody ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const proof = [
    data.city ? `Serving ${data.city}` : null,
    data.yearsExperience ? `${data.yearsExperience}+ years in business` : null,
    data.reviewCount ? `${data.reviewCount} customer reviews` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#e5e7f2] bg-white p-8 sm:p-12 shadow-xl shadow-[#533afd]/5">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#533afd]/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#ffd12d]/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Right side (Image) now on Left for visual balance, or we can keep text left */}
        
        <div className="order-2 lg:order-1 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#533afd] to-[#263477] rounded-[2.5rem] transform -rotate-3 scale-[1.02] opacity-10" />
          {/* No fixed aspect ratio on the frame. The capture is a full About
              section, whose height varies with how much copy the business
              wrote; a 4/5 box with object-cover cut the bottom off every
              tall one. The frame now takes its height from the image. */}
          <div className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-white shadow-2xl bg-[#0d1738]">
            {data.aboutCaptureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.aboutCaptureUrl}
                alt={`${data.businessName} About and team section`}
                className="block h-auto w-full"
              />
            ) : (
              // The placeholder has no intrinsic height, so it keeps one.
              <div className="flex aspect-[4/5] items-end bg-gradient-to-br from-[#533afd] via-[#263477] to-[#0d1738] p-10">
                <p className="max-w-xs text-3xl font-bold leading-tight text-white">Built around the people behind the work.</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1738]/60 via-transparent to-transparent" />
            
            {/* Overlay trust badge */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Owner-Operated by {data.founderName || "the founder"}</h4>
                    <p className="text-white/80 text-xs mt-1 leading-relaxed">
                      Direct oversight on every project to ensure structural integrity and a flawless finish.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#533afd]/20 bg-[#533afd]/5 px-3 py-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#533afd]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Built for {data.businessName}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0d1738] sm:text-4xl leading-tight">
              Your reputation should be doing more of the selling.
            </h2>
          </div>
          
          <div className="space-y-5">
            <p className="text-base leading-relaxed text-[#42506a] sm:text-lg">
              We did not start with a template. We started with your real business, your team, and the proof customers already
              have to trust you. The redesign puts that credibility in front of the right customer before they call someone else.
            </p>
            {aboutParagraphs.map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-[#42506a] sm:text-lg font-medium">
                {para}
              </p>
            ))}
          </div>

          {proof.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-[#e5e7f2]">
              {proof.map((item) => (
                <span key={item} className="inline-flex items-center rounded-full bg-[#f0f3ff] px-4 py-2 text-sm font-bold text-[#533afd] border border-[#c7d0fb]">
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
