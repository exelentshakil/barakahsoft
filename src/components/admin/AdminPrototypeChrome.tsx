import Link from "next/link";
import { BarChart3, Globe2, LayoutDashboard, Menu, Send, Settings2, Users } from "lucide-react";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const LINKS = [
  [LayoutDashboard, "Command center", "/admin-prototype"],
  [Users, "Leads", "/admin-prototype/leads"],
  [BarChart3, "Reports", "/admin-prototype/reports"],
  [Send, "Communications", "/admin-prototype/communications"],
  [Globe2, "Domains", "/admin-prototype/domains"],
  [Settings2, "Settings", "/admin-prototype/settings"],
] as const;

export function AdminPrototypeChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#e5e7f2] bg-white text-[#0d1738] lg:block">
        <div className="flex h-16 items-center border-b border-[#e5e7f2] px-6">
          <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
        </div>
        <nav className="space-y-1 px-4 py-6">
          {LINKS.map(([Icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#42506a] transition hover:bg-[#f0f3ff] hover:text-[#533afd]"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e5e7f2] bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <Menu className="h-5 w-5 lg:hidden text-[#0d1738]" />
            <div>
              <p className="text-sm font-bold text-[#0d1738]">BarakahSoft Admin</p>
              <p className="text-xs text-[#777588]">Owner workspace</p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3dfff] text-xs font-bold text-[#533afd]">
            SA
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
