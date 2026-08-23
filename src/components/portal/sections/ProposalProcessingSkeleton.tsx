import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

interface ProposalProcessingSkeletonProps {
  businessName: string;
}

// The wait, said the way the page that won this lead says things.
//
// It read "Ingestion & Brand Extraction", "Speed & Competitor Scan",
// "Final Human QA Review" — our internal step names, shown to a roofer.
// "Ingestion" is not a word anybody uses about their own business, and a
// person who has just handed over their website address and is waiting to
// see what strangers make of it does not want to be told about diagnostics.
//
// The one thing worth saying here is the thing that is actually true and
// that no competitor can say: a person looks at it before you do.
export function ProposalProcessingSkeleton({ businessName }: ProposalProcessingSkeletonProps) {
  const steps = [
    {
      icon: CheckCircle2,
      tone: "text-[#0b8f5b]",
      title: "Reading your site",
      body: "Your logo, your colours, your reviews — the things that are already yours.",
    },
    {
      icon: Loader2,
      tone: "animate-spin text-[#533afd]",
      title: "Looking at your market",
      body: "Where you show up when someone searches for your trade, and who is ahead of you.",
    },
    {
      icon: Clock,
      tone: "text-[#777588]",
      title: "Building the page",
      body: "A real homepage you can open and click, not a picture of one.",
    },
    {
      icon: ShieldCheck,
      tone: "text-[#777588]",
      title: "Someone checks it",
      body: "A person goes through it before it reaches you. That is the part most tools skip.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 pb-6 pt-10">
      <div className="space-y-6 rounded-3xl border border-[#c7d0fb] bg-white p-8 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f3ff] px-4 py-1.5 text-xs font-bold text-[#533afd]">
          <Loader2 className="h-4 w-4 animate-spin text-[#533afd]" />
          Working on it now
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#0d1738] sm:text-3xl">
            We are rebuilding the homepage for {businessName}
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#42506a]">
            Most people have theirs back the same business day. There is nothing for you to do in the meantime — no call
            to book, and nobody will chase you.
          </p>
        </div>

        <div className="grid gap-3 pt-2 text-left sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex items-start gap-2.5 rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-3.5"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${step.tone}`} />
                <div>
                  <p className="text-sm font-bold text-[#0d1738]">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="pt-2 text-xs text-[#777588]">
          We will email you the moment it is ready. It is yours to keep either way.
        </p>
      </div>
    </div>
  );
}
