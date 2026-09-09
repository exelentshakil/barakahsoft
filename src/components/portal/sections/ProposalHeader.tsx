import type { Tenant } from "@/tenants/types";
import { CheckCircle2, Phone } from "lucide-react";

interface ProposalHeaderProps {
  businessName: string;
  isPaid: boolean;
  isApproved: boolean;
  /** Whoever sold this. The logo and phone at the top of the page are theirs. */
  tenant: Tenant;
}

export function ProposalHeader({ businessName, isPaid, isApproved, tenant }: ProposalHeaderProps) {
  const { brand } = tenant;
  return (
    <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto" />
          <span className="hidden text-xs font-medium text-[#777588] sm:inline">
            · {businessName} Proposal & X-Ray Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-semibold text-[#0b8f5b] shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />{" "}
            {isPaid ? "Launch in Progress" : isApproved ? "Proposal Ready" : "Analyzing & Rebuilding"}
          </span>
          {brand.phoneE164 && (
            <a
              href={`tel:${brand.phoneE164}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d1738] transition hover:text-[#533afd]"
            >
              <Phone className="h-3.5 w-3.5 text-[#533afd]" />
              <span>{brand.phoneDisplay}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
