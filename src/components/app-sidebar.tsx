"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, LayoutDashboard } from "lucide-react";
import { NavMain, type NavGroup } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pipeline",
    items: [{ title: "Leads", url: "/admin", icon: LayoutDashboard }],
  },
];

export function AppSidebar({
  userEmail,
  newLeadsCount = 0,
  ...props
}: React.ComponentProps<typeof Sidebar> & { userEmail: string; newLeadsCount?: number }) {
  const groups: NavGroup[] = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.map((item) => (item.title === "Leads" ? { ...item, badge: newLeadsCount } : item)),
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="cursor-default hover:bg-transparent">
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-display truncate font-semibold">BarakahSoft</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Lead Engine</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser userEmail={userEmail} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
