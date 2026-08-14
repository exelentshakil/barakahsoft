"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export type NavMainItem = { title: string; url: string; icon: LucideIcon; external?: boolean; badge?: number };
export type NavGroup = { label: string; items: NavMainItem[] };

function isActivePath(pathname: string, item: NavMainItem) {
  if (item.external) return false;
  return item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url);
}

function NavItems({ items, pathname }: { items: NavMainItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActivePath(pathname, item);
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
              {item.external ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              ) : (
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                  {!!item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function NavGroupSection({ label, items, pathname }: { label: string; items: NavMainItem[]; pathname: string }) {
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="flex cursor-pointer items-center hover:text-sidebar-foreground">
            {label}
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <NavItems items={items} pathname={pathname} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

// Grouped, collapsible sections for the main nav; `ungrouped` (e.g. the
// external "Public funnel" link) renders as a plain trailing menu, matching
// its previous flat treatment.
export function NavMain({ groups, ungrouped }: { groups: NavGroup[]; ungrouped?: NavMainItem[] }) {
  const pathname = usePathname();
  return (
    <>
      {groups.map((group) => (
        <NavGroupSection key={group.label} label={group.label} items={group.items} pathname={pathname} />
      ))}
      {ungrouped && ungrouped.length > 0 && (
        <SidebarGroup>
          <SidebarGroupContent>
            <NavItems items={ungrouped} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
