"use client";

import { useState } from "react";
import { Menu, X, Phone, Wrench, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sectionHref, type SitePayload } from "@/components/site-shell/types";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";

// The complete, sellable IA (plan §5/§7): every scraped service and area
// gets a real mega-menu row (icon + short description), not three generic
// links. Anchor text matches the on-page H2s exactly, satisfying the
// "descriptive anchor text, not Learn more" SEO requirement. v4 (Phase V)
// -- brought onto Phase J's premium tokens (IconBadge on dropdown rows,
// shadow-lift panels, a subtle gradient underline) instead of plain
// default-nav styling that looked out of place next to the "masterpiece"
// premium sections below it.
export function MegaMenu({ payload }: { payload: SitePayload }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<"services" | "areas" | null>(null);
  const openQuoteModal = useQuoteModal();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-primary opacity-60" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href={`/s/${payload.leadSlug}`} className="flex items-center gap-2 font-display text-lg font-bold">
          {payload.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.logoUrl} alt={payload.businessName} className="h-8 w-auto" />
          ) : (
            <span className="text-gradient-primary">{payload.businessName}</span>
          )}
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {payload.services.length > 0 && (
            <div className="relative" onMouseEnter={() => setDesktopOpen("services")} onMouseLeave={() => setDesktopOpen(null)}>
              <button className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">Services</button>
              {desktopOpen === "services" && (
                <div className="absolute left-0 top-full w-96 rounded-lg border border-border bg-card p-2 shadow-lift">
                  {payload.services.map((service) => (
                    <a
                      key={service.slug}
                      href={sectionHref(payload, "services", service.slug)}
                      className="flex items-start gap-3 rounded-md p-2.5 hover:bg-accent"
                    >
                      <IconBadge icon={Wrench} size="sm" />
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
                <div className="absolute left-0 top-full w-72 rounded-lg border border-border bg-card p-2 shadow-lift">
                  {payload.areas.map((area) => (
                    <a key={area.slug} href={sectionHref(payload, "areas", area.slug)} className="flex items-center gap-2.5 rounded-md p-2.5 hover:bg-accent">
                      <IconBadge icon={MapPin} size="sm" />
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
          <Button size="sm" className="shadow-lift" onClick={openQuoteModal}>
            Get a free quote
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
