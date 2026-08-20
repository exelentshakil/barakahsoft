import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { StripeDashboardTheme } from "@/components/prototype/StripeDashboardTheme";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

export function ClientPortalChrome({ children }: { children: React.ReactNode }) {
  return <div data-prototype-dashboard className="min-h-screen bg-[#f5f9fc]"><StripeDashboardTheme /><header className="border-b border-[#d9e8f4] bg-white"><div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-6 px-6 py-3"><Link href="/client-portal-prototype" className="flex items-center gap-3"><img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" /><small className="hidden text-xs text-[#7890a5] sm:block">Client portal</small></Link><nav className="hidden items-center gap-5 text-sm font-semibold text-[#60778d] md:flex"><Link href="/client-portal-prototype">Overview</Link><Link href="/client-portal-prototype/leads">Leads</Link><Link href="/client-portal-prototype/reports">Reports</Link><Link href="/client-portal-prototype/website">Website</Link><Link href="/client-portal-prototype/account">Account</Link></nav><span className="inline-flex items-center gap-2 text-sm font-semibold text-[#60778d]"><MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">Message your team</span></span></div></header>{children}</div>;
}
