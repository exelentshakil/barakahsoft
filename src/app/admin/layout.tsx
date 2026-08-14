import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Service-role client — `leads` has RLS enabled with zero policies, so the
  // session-bound client above (which respects RLS) would silently return 0.
  const { count: newLeadsCount } = await createAdminClient()
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <SidebarProvider>
      <AppSidebar userEmail={user.email ?? ""} newLeadsCount={newLeadsCount ?? 0} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <p className="text-sm font-medium">BarakahSoft Admin</p>
        </header>
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
