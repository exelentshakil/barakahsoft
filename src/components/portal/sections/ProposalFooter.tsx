export function ProposalFooter() {
  return (
    <footer className="border-t border-[#e5e7f2] bg-white py-6 text-center text-xs text-[#777588] mt-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p>© 2026 BarakahSoft LLC · Verified Client Proposal Portal (portal.barakahsoft.com)</p>
        <div className="flex items-center gap-6">
          <a href="tel:+13075336678" className="hover:text-[#533afd] transition font-medium">
            Direct line: +1 (307) 533-6678
          </a>
          <a href="mailto:hello@barakahsoft.com" className="hover:text-[#533afd] transition font-medium">
            hello@barakahsoft.com
          </a>
        </div>
      </div>
    </footer>
  );
}
