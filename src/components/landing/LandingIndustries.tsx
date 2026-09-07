import { Briefcase, Building, HeartPulse, Home, Scale, Store } from "lucide-react";

const INDUSTRIES = [
  { icon: Home, label: "Home Services", description: "Roofing, HVAC, Plumbing, Electrical & Remodeling", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: Store, label: "Franchises & Retail", description: "Multi-location storefronts & specialty local brands", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  { icon: Scale, label: "Legal & Professional", description: "Attorneys, CPA firms & financial advisory practices", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { icon: HeartPulse, label: "Healthcare & Med", description: "Private clinics, dental practices & therapy centers", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  { icon: Building, label: "B2B & Commercial", description: "Logistics, industrial equipment & enterprise contractors", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { icon: Briefcase, label: "High-Ticket Services", description: "Luxury moving, custom builders & high-value sales", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
];

export function LandingIndustries() {
  return (
    <section className="border-t border-[#d9e8f4] bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Proven Vertical Coverage</p>
          <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#07284d] sm:text-4xl">
            Industries We Build & Optimize For
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#60778d] sm:text-base">
            Every trade has unique conversion triggers. We build bespoke layouts tailored to your exact buyers, search intents, and local market.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.label}
                className="flex items-start gap-4 rounded-2xl border border-[#d9e8f4] bg-[#f8fbfe] p-5 transition hover:border-[#0c68c8] hover:bg-white hover:shadow-[0_8px_24px_rgba(7,40,77,0.06)]"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ind.bg} ${ind.color} ${ind.border} border`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#07284d]">{ind.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#60778d]">{ind.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
