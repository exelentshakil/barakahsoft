import { CheckCircle2, ExternalLink, MessageCircle, MousePointerClick, Rocket } from "lucide-react";
import { SocialLaunchMockup, type MockupData } from "@/components/mockup/SocialLaunchMockup";

interface ProposalHeroProps {
  businessName: string;
  address: string | null;
  rating: string | null;
  reviewCount: string | null;
  leadSlug: string;
  isPaid: boolean;
  chatContext: string;
  mockupData: MockupData;
}

/**
 * The town out of a formatted postal address.
 */
function townFrom(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
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
  mockupData,
}: ProposalHeroProps) {
  const town = townFrom(address);

  return (
    <section className="rounded-3xl border border-[#c7d0fb] bg-white shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#533afd]/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#ffd12d]/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center p-8 sm:p-12">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Your rebuilt homepage
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#0d1738] sm:text-5xl leading-tight">
              {businessName}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-[#42506a] sm:text-lg">
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
          </div>

          <div className="flex flex-wrap gap-4">
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
          <div className="border-t border-[#e5e7f2] pt-10 mt-6 max-w-2xl">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777588] mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#e5e7f2]"></span>
              Your Path to Launch
              <span className="flex-1 h-[1px] bg-[#e5e7f2]"></span>
            </h3>

            <div className="relative">
              {/* Continuous Progress Bar Background */}
              <div className="absolute top-5 left-[16.666%] right-[16.666%] h-1.5 bg-[#eef0f6] rounded-full overflow-hidden">
                 {/* Animated dashed overlay for inactive part */}
                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgwLCAwLCAwLCAwLjA1KSIvPjwvZz48L3N2Zz4=')] bg-[length:10px_10px]" />
              </div>

              {/* Active Progress Bar */}
              <div
                className="absolute top-5 left-[16.666%] h-1.5 bg-gradient-to-r from-[#533afd] to-[#806bff] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(83,58,253,0.5)] z-0"
                style={{ width: isPaid ? "66.666%" : "33.333%" }}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpIi8+PC9nPjwvc3ZnPg==')] bg-[length:10px_10px] animate-[slide_1s_linear_infinite]" />
              </div>

              <div className="grid grid-cols-3 gap-3 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#533afd] to-[#432bd9] text-white flex items-center justify-center shadow-[0_0_20px_rgba(83,58,253,0.4)] ring-4 ring-[#f9f9ff] mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="bg-[#f8f9fc] rounded-xl p-4 w-full border border-[#e5e7f2] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#533afd] opacity-20" />
                    <span className="font-extrabold text-[#533afd] text-[11px] uppercase tracking-wider">Done ✓</span>
                    <p className="mt-1.5 text-[#0d1738] font-bold text-[13px] leading-snug">We rebuilt your<br/>homepage</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-4 ring-[#f9f9ff] mb-4 transition-all duration-500 ${isPaid ? 'bg-gradient-to-br from-[#533afd] to-[#432bd9] text-white shadow-[0_0_20px_rgba(83,58,253,0.4)]' : 'bg-white border-[3px] border-[#533afd] text-[#533afd] shadow-xl scale-110'}`}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <MousePointerClick className="w-5 h-5" />}
                  </div>
                  <div className={`rounded-xl p-4 w-full border transition-all duration-500 shadow-md relative overflow-hidden ${isPaid ? 'bg-[#f8f9fc] border-[#e5e7f2]' : 'bg-white border-[#533afd] ring-1 ring-[#533afd]/10 scale-105'}`}>
                    {(!isPaid) && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#533afd] to-[#806bff]" />}
                    <span className={`font-extrabold text-[11px] uppercase tracking-wider ${isPaid ? 'text-[#533afd]' : 'text-[#533afd]'}`}>{isPaid ? 'Done ✓' : 'You are here'}</span>
                    <p className="mt-1.5 text-[#0d1738] font-bold text-[13px] leading-snug">{isPaid ? 'You said yes' : 'Have a look at it'}</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ring-4 ring-[#f9f9ff] mb-4 transition-all duration-500 ${isPaid ? 'bg-white border-[3px] border-[#0b8f5b] text-[#0b8f5b] shadow-xl scale-110' : 'bg-white border-[2px] border-[#e5e7f2] text-[#a1a1aa]'}`}>
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div className={`rounded-xl p-4 w-full border transition-all duration-500 shadow-sm relative overflow-hidden ${isPaid ? 'bg-white border-[#0b8f5b] ring-1 ring-[#0b8f5b]/10 scale-105 shadow-md' : 'bg-[#f8f9fc] border-[#e5e7f2]'}`}>
                    {isPaid && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0b8f5b] to-[#12b375]" />}
                    <span className={`font-extrabold text-[11px] uppercase tracking-wider ${isPaid ? 'text-[#0b8f5b]' : 'text-[#8b97a8]'}`}>{isPaid ? 'In progress' : 'If you want it'}</span>
                    <p className={`mt-1.5 font-bold text-[13px] leading-snug ${isPaid ? 'text-[#0d1738]' : 'text-[#8b97a8]'}`}>Live within<br/>2-4 weeks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <SocialLaunchMockup
            data={mockupData}
            showControls={false}
            className="w-full max-w-[480px] xl:max-w-[540px] transform hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}
