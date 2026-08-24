import { ArrowRight, CheckCircle2, PhoneCall } from "lucide-react";

interface LaunchStep {
  label: string;
  complete: boolean;
  detail: string;
}

interface ProposalDecisionBoxProps {
  businessName: string;
  setupPrice: number;
  monthlyPrice: number;
  priceFormattedLabel: string;
  isPaid: boolean;
  launchSteps: LaunchStep[];
  onOpenCheckout: () => void;
}

export function ProposalDecisionBox({
  businessName,
  setupPrice,
  monthlyPrice,
  priceFormattedLabel,
  isPaid,
  launchSteps,
  onOpenCheckout,
}: ProposalDecisionBoxProps) {
  const narrative =
    setupPrice === 0 && monthlyPrice > 0
      ? `A $0 setup fee + $${monthlyPrice}/month ongoing hosting and management plan tailored for ${businessName}.`
      : setupPrice > 0 && monthlyPrice > 0
      ? `A $${setupPrice} setup fee + $${monthlyPrice}/month ongoing management package tailored for ${businessName}.`
      : `A $${setupPrice} one-time build tailored for ${businessName}.`;

  return (
    <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-12 text-white shadow-lg text-center space-y-6">
      <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
        {isPaid ? "Launch Workflow Active" : "Ready to Launch?"}
      </span>
      <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {isPaid ? "Your Website Is Moving Into Production" : "Launch Your New Website in 2-4 Weeks"}
      </h2>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
        {narrative}
      </p>
      {!isPaid && (
        <p className="mx-auto max-w-xl text-xs leading-relaxed text-white/55">
          Official go-live is typically 2-4 weeks after payment, final content approval, and domain access.
        </p>
      )}

      {isPaid && (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/15 bg-white/5 p-4 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">Live launch checklist</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {launchSteps.map((step) => (
              <div key={step.label} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${step.complete ? "text-[#6ee7b7]" : "text-white/35"}`} />
                <div>
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="mt-0.5 text-xs text-white/55">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 flex flex-col items-center justify-center gap-4 sm:flex-row">
        {!isPaid && (
          <button
            onClick={onOpenCheckout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#432bd9]"
          >
            Put my site live ({priceFormattedLabel}) <ArrowRight className="h-5 w-5" />
          </button>
        )}
        <a
          href="tel:+13075336678"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
        >
          <PhoneCall className="h-4 w-4" /> Call Us with Questions
        </a>
        {!isPaid && (
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Message BarakahSoft
          </button>
        )}
      </div>

      {/* The landing page that won this lead answers "what's the catch?"
          out loud, and the portal never did. Saying nothing about it at the
          moment someone is deciding is what makes free look like bait --
          and this is the one paragraph on the page whose job is to remove a
          reason not to, rather than add a reason to. */}
      <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/70">
        <b className="text-white">The homepage is yours either way.</b> If you would rather take it to your own
        developer, or do nothing with it at all, that is fine — nobody will call you and there is nothing to cancel.
        The price above is only if you want us to put it live and look after it.
      </p>

      <p className="text-xs text-white/45">
        You own the site outright. No contract, no setup fee, no lock-in.
      </p>
    </section>
  );
}
