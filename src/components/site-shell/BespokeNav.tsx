"use client";

import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import type { ChromeSpec } from "@/lib/chrome-spec";
import { homepageAnchor, siteHref, type SiteNavItem, type SitePayload } from "@/components/site-shell/types";

// The per-lead header.
//
// Rendered from a spec rather than generated as markup: navigation carries
// real routing, real click tracking and the quote modal, and model-authored
// nav is how a site ends up with a beautiful menu pointing at four pages
// that were never built.
//
// Styled entirely in the lead's own design tokens. The previous header used
// the app's shadcn tokens while the page body used the lead's, so the frame
// and the page it framed were visibly two different designs.

export function BespokeNav({ payload, spec }: { payload: SitePayload; spec: ChromeSpec }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<"services" | "areas" | null>(null);
  const openQuoteModal = useQuoteModal();

  const { nav } = spec;
  const services = payload.navigation.services;
  const areas = payload.navigation.areas;
  const phoneDigits = payload.nap.phone?.replace(/[^\d+]/g, "") ?? "";

  const logo = (
    <a href={siteHref(payload)} className="bs-logo">
      {payload.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={payload.logoUrl} alt={payload.businessName} />
      ) : (
        <span>{payload.businessName}</span>
      )}
    </a>
  );

  const cta = nav.showPhone && payload.primaryAction === "call-now" && payload.nap.phone ? (
    <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-primary">
      {payload.primaryActionLabel}
    </a>
  ) : (
    <button
      type="button"
      onClick={openQuoteModal}
      className="bs-btn bs-btn-primary"
    >
      {payload.primaryActionLabel}
    </button>
  );

  // A dropdown holding one item is worse than a plain link, so the spec
  // decides whether these are panels or single links at all.
  const dropdown = (
    kind: "services" | "areas",
    label: string,
    items: SiteNavItem[]
  ) => (
    <div
      className="bs-nav-group"
      onMouseEnter={() => setOpenPanel(kind)}
      onMouseLeave={() => setOpenPanel(null)}
    >
      <button type="button" className="bs-nav-link">
        {label}
      </button>
      {openPanel === kind && (
        <div className={`bs-nav-panel ${nav.archetype === "mega" ? "bs-nav-panel-wide" : ""}`}>
          {items.map((item) => (
            <a
              key={item.slug}
              href={siteHref(payload, item.path)}
              className="bs-nav-panel-item"
            >
              <span>
                <span className="bs-nav-panel-title">{item.label}</span>
                {item.description && (
                  <span className="bs-nav-panel-desc">{item.description.slice(0, 88)}</span>
                )}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const links = (
    <>
      {nav.servicesDropdown && services.length >= 2
        ? dropdown("services", "Services", services)
        : payload.services.length > 0 && (
            <a href={homepageAnchor(payload, "services")} className="bs-nav-link">
              Services
            </a>
          )}
      {nav.areasDropdown && areas.length >= 2 ? dropdown("areas", "Service areas", areas) : payload.areas.length > 0 && (
        <a href={homepageAnchor(payload, "areas")} className="bs-nav-link">Service areas</a>
      )}
      <a href={payload.bespokePages.about && payload.innerPagesBuilt ? siteHref(payload, "/about") : homepageAnchor(payload, "about")} className="bs-nav-link">
        About
      </a>
      <a href={payload.bespokePages.faq && payload.innerPagesBuilt ? siteHref(payload, "/faq") : homepageAnchor(payload, "faq")} className="bs-nav-link">
        FAQ
      </a>
      <a href={payload.bespokePages.contact && payload.innerPagesBuilt ? siteHref(payload, "/contact") : homepageAnchor(payload, "contact")} className="bs-nav-link">
        Contact
      </a>
    </>
  );

  return (
    <div className="bs-chrome">
      {nav.utilityBar && payload.nap.phone && (
        <div className="bs-utility">
          <div className="bs-utility-inner">
            <span>
              Need help now? <strong>Call {payload.nap.phone}</strong>
            </span>
          </div>
        </div>
      )}

      <header
        className={`bs-nav ${nav.sticky ? "bs-nav-sticky" : ""} ${nav.archetype === "centered" ? "bs-nav-centered" : ""}`}
      >
        <div className="bs-nav-inner">
          {nav.archetype === "centered" ? (
            <>
              <nav className="bs-nav-links">{links}</nav>
              {logo}
              <div className="bs-nav-actions">{cta}</div>
            </>
          ) : (
            <>
              {logo}
              {nav.archetype !== "minimal" && <nav className="bs-nav-links">{links}</nav>}
              <div className="bs-nav-actions">
                {nav.showPhone && payload.nap.phone && (
                  <a href={`tel:${phoneDigits}`} className="bs-nav-phone">
                    <Phone className="h-4 w-4" aria-hidden />
                    {payload.nap.phone}
                  </a>
                )}
                {cta}
              </div>
            </>
          )}

          <button
            type="button"
            className="bs-nav-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="bs-nav-mobile">
            {payload.services.length > 0 && <span className="bs-nav-mobile-heading">Services</span>}
            {services.length > 0 ? services.map((service) => (
              <a
                key={service.slug}
                href={siteHref(payload, service.path)}
                onClick={() => setMobileOpen(false)}
              >
                {service.label}
              </a>
            )) : payload.services.length > 0 && (
              <a href={homepageAnchor(payload, "services")} onClick={() => setMobileOpen(false)}>View services</a>
            )}
            {/* Area names are always derivable from the scrape, but the
                /areas routes only exist once phase 2 has built them. The
                spec is the single source of truth for whether they may be
                linked -- listing them here unconditionally put dead links
                in the mobile menu while the desktop menu correctly hid
                them. */}
            {payload.areas.length > 0 && (
              <>
                <span className="bs-nav-mobile-heading">Service areas</span>
                {areas.length > 0 ? areas.map((area) => (
                  <a
                    key={area.slug}
                    href={siteHref(payload, area.path)}
                    onClick={() => setMobileOpen(false)}
                  >
                    {area.label}
                  </a>
                )) : (
                  <a href={homepageAnchor(payload, "areas")} onClick={() => setMobileOpen(false)}>View service areas</a>
                )}
              </>
            )}
            <span className="bs-nav-mobile-heading">More</span>
            <a href={payload.bespokePages.about && payload.innerPagesBuilt ? siteHref(payload, "/about") : homepageAnchor(payload, "about")} onClick={() => setMobileOpen(false)}>
              About
            </a>
            <a href={payload.bespokePages.faq && payload.innerPagesBuilt ? siteHref(payload, "/faq") : homepageAnchor(payload, "faq")} onClick={() => setMobileOpen(false)}>
              FAQ
            </a>
            <a href={payload.bespokePages.contact && payload.innerPagesBuilt ? siteHref(payload, "/contact") : homepageAnchor(payload, "contact")} onClick={() => setMobileOpen(false)}>
              Contact
            </a>
            {payload.nap.phone && (
              <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-primary bs-btn-block" style={{ marginTop: "0.9rem" }}>
                Call {payload.nap.phone}
              </a>
            )}
          </nav>
        )}
      </header>
    </div>
  );
}
