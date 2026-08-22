import {
  Bot,
  CircleDollarSign,
  FileText,
  MapPin,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";

interface ProposalFrictionGridProps {
  businessName: string;
  phone: string;
  reviewCount: string;
  rating: string;
  beforeLcp: string;
}

export function ProposalFrictionGrid({
  businessName,
  phone,
  reviewCount,
  rating,
  beforeLcp,
}: ProposalFrictionGridProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
            Website Diagnostic X-Ray
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0d1738] sm:text-3xl">
            6 Critical Friction Points Found on Your Old Site & How We Solved Them
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
          <Zap className="h-3.5 w-3.5" /> Direct Solution Mapping
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Mobile Design */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Smartphone className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Target className="h-3 w-3" /> Selected Focus
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">1. Outdated Mobile Design & Slow Load Time</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">Took {beforeLcp} to load on 4G cellular. Users had to hunt through clunky menus just to find your phone number.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">0.12s mobile load time with a persistent 1-tap "Call {phone}" emergency bar fixed to the mobile screen.</p>
            </div>
          </div>
        </div>

        {/* 2. Hidden Reviews */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Star className="h-4 w-4 fill-[#ffd12d] text-[#ffd12d]" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Target className="h-3 w-3" /> Selected Focus
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">2. Buried {reviewCount} Reviews & Credentials</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">Your strongest proof ({reviewCount} 5-star reviews & licensing) was hidden at the very bottom where 70% of visitors never scroll.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">Google {rating} Verified badge & verified license proof placed front-and-center before customers bounce.</p>
            </div>
          </div>
        </div>

        {/* 3. Local Search Invisible */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e3dfff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Target className="h-3 w-3" /> Selected Focus
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">3. Invisible on Local Google Searches</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">Our 49-point local area scan showed you missing from over 75% of surrounding customer search zones.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">Dedicated localized service landing pages establishing direct geographic relevance across all target zip codes.</p>
            </div>
          </div>
        </div>

        {/* 4. AI Search */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <Bot className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Sparkles className="h-3 w-3" /> Audit Discovery
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">4. Invisible in AI Search (ChatGPT & Gemini)</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">Zero structured schema. When users ask ChatGPT or Google AI for trusted local businesses, AI models cannot verify your credentials.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">Complete LocalBusiness JSON-LD schema & Entity FAQ markup so AI search models verify and cite {businessName} as #1.</p>
            </div>
          </div>
        </div>

        {/* 5. Big Jobs */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <CircleDollarSign className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Sparkles className="h-3 w-3" /> Audit Discovery
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">5. High-Ticket Jobs Lumped in 1 Paragraph</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">High-value jobs were lumped in a generic bulleted list, losing all high-intent search traffic.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">Dedicated high-ticket landing routes with technical details and instant commercial quote forms.</p>
            </div>
          </div>
        </div>

        {/* 6. Thin Content */}
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-7 shadow-sm space-y-4">
          <div className="border-b border-[#e5e7f2] pb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                <FileText className="h-4 w-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-2.5 py-0.5 text-xs font-bold text-[#533afd]">
                <Sparkles className="h-3 w-3" /> Audit Discovery
              </span>
            </div>
            <h3 className="font-bold text-base text-[#0d1738]">6. Thin Content & Empty Website Pages</h3>
          </div>
          <div className="space-y-2.5 text-xs leading-relaxed">
            <div className="rounded-lg bg-[#fff8f8] border border-[#ffdad6] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#ba1a1a] text-[10px]">Old Site X-Ray (Friction)</span>
              <p className="mt-1 text-[#42506a]">Zero helpful articles or FAQs explaining common customer questions, signaling to search engines that the site was inactive.</p>
            </div>
            <div className="rounded-lg bg-[#f0fcf4] border border-[#c8ead8] p-3.5">
              <span className="font-bold uppercase tracking-wider text-[#0b8f5b] text-[10px]">Rebuilt Resolution</span>
              <p className="mt-1 text-[#0d1738] font-semibold">8 original, human-reviewed launch articles so your website has authoritative depth from day one.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
