import { CheckCircle2, Circle, Loader2 } from "lucide-react";

// Shown when a real lead's site is not ready yet.
//
// This route used to 404. A client following their link before the build
// finished — which is exactly when an interested client follows it — saw a
// not-found page and concluded the whole thing was broken. A page that says
// "we are working on it" costs nothing and saves the deal.
export function PortalPending({
  businessName,
  analysed,
  built,
}: {
  businessName: string;
  analysed: boolean;
  built: boolean;
}) {
  const steps = [
    { label: "Reading your current website", done: analysed },
    { label: "Designing your new homepage", done: built },
    // The one thing here worth saying that a competitor cannot.
    { label: "A person checks it before you see it", done: false },
  ];

  const current = steps.findIndex((s) => !s.done);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f9ff] px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#533afd]">In progress</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#0d1738]">
            We&apos;re building your redesign
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5b6270]">
            {businessName} — your new homepage will appear right here. Most people have theirs back the same business
            day, and we&apos;ll email you the moment it&apos;s ready. Nothing to do in the meantime.
          </p>

          <ol className="mt-7 space-y-3">
            {steps.map((step, index) => (
              <li key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : index === current ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#533afd]" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-[#c7cbd6]" />
                )}
                <span
                  className={`text-sm ${
                    step.done ? "text-[#0d1738]" : index === current ? "font-semibold text-[#0d1738]" : "text-[#989db0]"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        

        
      </div>
    </main>
  );
}
