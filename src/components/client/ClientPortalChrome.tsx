import Link from "next/link";
import { MessageCircle } from "lucide-react";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

export function ClientPortalChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      <header className="border-b border-[#e5e7f2] bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-6 px-6 py-3">
          <Link href="/client-portal-prototype" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <small className="hidden text-xs text-[#777588] sm:block">Client portal</small>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-[#42506a] md:flex">
            <Link href="/client-portal-prototype" className="hover:text-[#533afd]">Overview</Link>
            <Link href="/client-portal-prototype/leads" className="hover:text-[#533afd]">Leads</Link>
            <Link href="/client-portal-prototype/reports" className="hover:text-[#533afd]">Reports</Link>
            <Link href="/client-portal-prototype/website" className="hover:text-[#533afd]">Website</Link>
            <Link href="/client-portal-prototype/account" className="hover:text-[#533afd]">Account</Link>
          </nav>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#42506a]">
            <MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Message your team</span>
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
