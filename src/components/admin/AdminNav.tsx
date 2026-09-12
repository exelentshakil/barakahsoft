"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Two screens. The whole product.
const LINKS = [
  { href: "/admin", label: "Pipeline" },
  { href: "/admin/review", label: "Review" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => {
        // /admin is a prefix of everything, so it only lights up on an exact
        // match; /admin/review stays lit on its own children.
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? "bg-[#f0f3ff] text-[#533afd]" : "text-[#0d1738] hover:bg-[#f6f7fc]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
