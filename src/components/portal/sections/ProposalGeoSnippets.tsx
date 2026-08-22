import { ShieldCheck, Sparkles } from "lucide-react";

interface PAAQuestion {
  q: string;
  a: string;
  article: string;
}

interface ProposalGeoSnippetsProps {
  questions: PAAQuestion[];
}

export function ProposalGeoSnippets({ questions }: ProposalGeoSnippetsProps) {
  return (
    <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 sm:p-10 shadow-sm space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-[#e5e7f2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#533afd]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Google AI Overview & Generative Search Readiness (GEO)
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
            How Your 8 Launch Articles Answer What Local Customers Ask Google & ChatGPT
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" /> FAQ Schema Fortified
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 pt-2">
        {questions.map((item) => (
          <div key={item.q} className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#533afd] uppercase tracking-wider">
                {item.article}
              </span>
              <span className="rounded bg-[#e3dfff] px-2 py-0.5 text-[10px] font-bold text-[#533afd]">
                Google AI Q&A
              </span>
            </div>
            <h4 className="font-bold text-sm text-[#0d1738]">
              "{item.q}"
            </h4>
            <div className="rounded-lg bg-white border border-[#e5e7f2] p-3 text-xs text-[#42506a] leading-relaxed">
              <strong className="text-[#0b8f5b] block mb-1">✓ Rebuilt Direct Answer Snippet:</strong>
              {item.a}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
