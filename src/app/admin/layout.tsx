import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Globe2, Zap, LogOut } from "lucide-react";
import { CrispChat } from "@/components/CrispChat";
import { NewLeadWatcher } from "@/components/admin/NewLeadWatcher";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initials = (user.email || "OP").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738] font-sans antialiased">
      {/* Realtime Lead Watcher with Soothing Shopify-Style Chime */}
      <NewLeadWatcher />

      {/* 1. TOP BAR (Direct from Admin Prototype) */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            </Link>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-bold text-[#533afd] shrink-0">
              <Zap className="h-3 w-3" /> Lead Fulfillment Engine
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs font-semibold text-[#0d1738] hover:text-[#533afd] transition"
            >
              Leads Workspace
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="text-xs font-semibold text-muted-foreground hover:text-danger transition flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <CrispChat />
    </div>
  );
}
