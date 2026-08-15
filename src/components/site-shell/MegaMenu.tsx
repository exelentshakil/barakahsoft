"use client";

import { useState } from "react";
import { Menu, X, Phone, Wrench, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionHref, type SitePayload } from "@/components/site-shell/types";

// The complete, sellable IA (plan §5/§7): every scraped service and area
// gets a real mega-menu row (icon + short description), not three generic
// links. Anchor text matches the on-page H2s exactly, satisfying the
// "descriptive anchor text, not Learn more" SEO requirement.
export function MegaMenu({ payload }: { payload: SitePayload }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<"services" | "areas" | null>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href={`/s/${payload.leadSlug}`} className="flex items-center gap-2 font-display text-lg font-bold">
          {payload.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.logoUrl} alt={payload.businessName} className="h-8 w-auto" />
          ) : (
            payload.businessName
          )}
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {payload.services.length > 0 && (
            <div className="relative" onMouseEnter={() => setDesktopOpen("services")} onMouseLeave={() => setDesktopOpen(null)}>
              <button className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Services</button>
              {desktopOpen === "services" && (
                <div className="absolute left-0 top-full w-96 rounded-lg border border-border bg-card p-2 shadow-popover">
                  {payload.services.map((service) => (
                    <a
                      key={service.slug}
                      href={sectionHref(payload, "services", service.slug)}
                      className="flex items-start gap-3 rounded-md p-2.5 hover:bg-accent"
                    >
                      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        <span className="block text-sm font-medium">{service.h2}</span>
                        <span className="block text-xs text-muted-foreground">{service.body_content.slice(0, 70)}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          {payload.areas.length > 0 && (
            <div className="relative" onMouseEnter={() => setDesktopOpen("areas")} onMouseLeave={() => setDesktopOpen(null)}>
              <button className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Service Areas</button>
              {desktopOpen === "areas" && (
                <div className="absolute left-0 top-full w-72 rounded-lg border border-border bg-card p-2 shadow-popover">
                  {payload.areas.map((area) => (
                    <a key={area.slug} href={sectionHref(payload, "areas", area.slug)} className="flex items-center gap-2 rounded-md p-2.5 hover:bg-accent">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-medium">{area.h2}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          <a href="#reviews" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
            Reviews
          </a>
          <a
            href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/faq` : "#faq"}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            FAQ
          </a>
          <a
            href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/contact` : "#contact"}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Contact
          </a>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {payload.nap.phone && (
            <a href={`tel:${payload.nap.phone}`} className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-4 w-4 text-primary" /> {payload.nap.phone}
            </a>
          )}
          <Button asChild size="sm">
            <a href="#contact">Get a free quote</a>
          </Button>
        </div>

        <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border px-6 py-4 lg:hidden">
          {payload.services.map((service) => (
            <a
              key={service.slug}
              href={sectionHref(payload, "services", service.slug)}
              onClick={() => setMobileOpen(false)}
              className={cn("block py-2 text-sm font-medium")}
            >
              {service.h2}
            </a>
          ))}
          {payload.areas.map((area) => (
            <a key={area.slug} href={sectionHref(payload, "areas", area.slug)} onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium">
              {area.h2}
            </a>
          ))}
          <a
            href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/faq` : "#faq"}
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium"
          >
            FAQ
          </a>
          <a
            href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/contact` : "#contact"}
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium"
          >
            Contact
          </a>
        </nav>
      )}
    </header>
  );
}
