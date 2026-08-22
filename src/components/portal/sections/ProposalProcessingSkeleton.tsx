import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

interface ProposalProcessingSkeletonProps {
  businessName: string;
}

export function ProposalProcessingSkeleton({ businessName }: ProposalProcessingSkeletonProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-10 pb-6">
      <div className="rounded-3xl border border-[#c7d0fb] bg-white p-8 shadow-xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f3ff] px-4 py-1.5 text-xs font-bold text-[#533afd]">
          <Loader2 className="h-4 w-4 animate-spin text-[#533afd]" />
          Analyzing Your Website & Rebuilding Concept
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#0d1738] sm:text-3xl">
            We are building your 48-hour custom concept for {businessName}
          </h2>
          <p className="text-xs text-[#42506a] max-w-lg mx-auto leading-relaxed sm:text-sm">
            Our engineering and design team is extracting your verified brand proof, running local speed diagnostics, and creating a modern mobile-first homepage.
          </p>
        </div>

        {/* Live Step Progress Tracker */}
        <div className="grid gap-3 sm:grid-cols-2 text-left text-xs pt-2">
          <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
            <CheckCircle2 className="h-4 w-4 text-[#0b8f5b] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0d1738]">1. Ingestion & Brand Extraction</p>
              <p className="text-[11px] text-muted-foreground">Scraped genuine brand colors & reviews</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
            <Loader2 className="h-4 w-4 animate-spin text-[#533afd] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0d1738]">2. Speed & Competitor Scan</p>
              <p className="text-[11px] text-muted-foreground">Measuring mobile load times & search gaps</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
            <Clock className="h-4 w-4 text-[#777588] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0d1738]">3. Desktop & Mobile Rebuild</p>
              <p className="text-[11px] text-muted-foreground">Tailored 0.12s first-paint layout</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5">
            <ShieldCheck className="h-4 w-4 text-[#777588] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0d1738]">4. Final Human QA Review</p>
              <p className="text-[11px] text-muted-foreground">Verification before proposal unlocks</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#777588] pt-2">
          🔒 You will receive an instant notification as soon as your concept and audit are ready to review.
        </p>
      </div>
    </div>
  );
}
