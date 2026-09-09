import type { Tenant } from "@/tenants/types";

/**
 * Whoever sold this proposal signs it.
 *
 * Every value here was a literal, so a partner's prospect read BarakahSoft's
 * entity, phone number and portal hostname at the bottom of a page that had
 * their own partner's logo at the top.
 */
export function ProposalFooter({ tenant }: { tenant: Tenant }) {
  const { brand } = tenant;
  const portalHost = tenant.portalBaseUrl.replace(/^https?:\/\//, "");

  return (
    <footer className="border-t border-[#e5e7f2] bg-white py-6 text-center text-xs text-[#777588] mt-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {brand.legalEntity} · Verified Client Proposal Portal ({portalHost})
        </p>
        <div className="flex items-center gap-6">
          {brand.phoneE164 && (
            <a href={`tel:${brand.phoneE164}`} className="hover:text-[#533afd] transition font-medium">
              Direct line: {brand.phoneDisplay}
            </a>
          )}
          <a href={`mailto:${brand.supportEmail}`} className="hover:text-[#533afd] transition font-medium">
            {brand.supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
