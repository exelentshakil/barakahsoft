"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, MapPin, Menu, Phone, Sparkles, X } from "lucide-react";
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
// Styled entirely in the lead's own design tokens.

export function BespokeNav({ payload, spec }: { payload: SitePayload; spec: ChromeSpec }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<"services" | "areas" | null>(null);
  const openQuoteModal = useQuoteModal();

  const { nav } = spec;
  const services = payload.navigation.services.length > 0
    ? payload.navigation.services
    : payload.services.map((s) => ({
        slug: s.slug || "services",
        label: s.h2,
        description: s.body_content,
        path: `/services/${s.slug}`,
      }));

  const areas = payload.navigation.areas.length > 0
    ? payload.navigation.areas
    : payload.areas.map((a) => ({
        slug: a.slug || "areas",
        label: a.h2,
        description: a.body_content,
        path: `/areas/${a.slug}`,
      }));

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

  // Modern Multi-Column Mega Menu Panel
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
      <button type="button" className="bs-nav-link bs-nav-link-dropdown">
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-200" />
      </button>
      {openPanel === kind && (
        <div className="bs-nav-panel bs-nav-panel-mega">
          <div className="bs-nav-mega-grid">
            <div className="bs-nav-mega-links">
              <div className="bs-nav-mega-header">
                <span className="bs-nav-mega-kicker">
                  {kind === "services" ? "Core Services" : "Coverage Locations"}
                </span>
                <span className="text-[11px] opacity-60">
                  {items.length} {kind === "services" ? "offerings" : "coverage zones"}
                </span>
              </div>
              <div className={`bs-nav-mega-cols ${items.length > 4 ? "bs-nav-mega-cols-2" : "bs-nav-mega-cols-1"}`}>
                {items.map((item) => (
                  <a
                    key={item.slug}
                    href={siteHref(payload, item.path)}
                    className="bs-nav-panel-item"
                  >
                    {kind === "areas" ? (
                      <MapPin className="h-4 w-4 text-[var(--bs-primary-on-surface)] shrink-0 mt-0.5" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[var(--bs-primary)] shrink-0 mt-1.5" />
                    )}
                    <span className="min-w-0">
                      <span className="bs-nav-panel-title">{item.label}</span>
                      {item.description ? (
                        <span className="bs-nav-panel-desc">{item.description.slice(0, 72)}</span>
                      ) : null}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Right Side Featured Promo Card in Mega Menu */}
            <div className="bs-nav-mega-featured">
              <span className="bs-nav-featured-badge">
                <Sparkles className="h-3 w-3" /> 24/7 Rapid Response
              </span>
              <p className="bs-nav-featured-title">Need Immediate On-Site Help?</p>
              <p className="bs-nav-featured-desc">
                Certified technicians are ready for emergency dispatch and fast estimates.
              </p>
              <div className="bs-nav-featured-actions">
                {payload.nap.phone && (
                  <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-primary bs-btn-sm w-full text-center">
                    <Phone className="mr-1.5 inline h-3.5 w-3.5" /> Call {payload.nap.phone}
                  </a>
                )}
                <button
                  type="button"
                  onClick={openQuoteModal}
                  className="bs-btn bs-btn-ghost bs-btn-sm w-full text-center"
                >
                  Request Fast Quote →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const links = (
    <>
      {services.length >= 2
        ? dropdown("services", "Services", services)
        : payload.services.length > 0 && (
            <a href={homepageAnchor(payload, "services")} className="bs-nav-link">
              Services
            </a>
          )}
      {areas.length >= 2
        ? dropdown("areas", "Service Areas", areas)
        : payload.areas.length > 0 && (
            <a href={homepageAnchor(payload, "areas")} className="bs-nav-link">
              Service Areas
            </a>
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
            {services.length > 0 && <span className="bs-nav-mobile-heading">Services</span>}
            {services.map((service) => (
              <a
                key={service.slug}
                href={siteHref(payload, service.path)}
                onClick={() => setMobileOpen(false)}
              >
                {service.label}
              </a>
            ))}

            {areas.length > 0 && (
              <>
                <span className="bs-nav-mobile-heading">Service areas</span>
                {areas.map((area) => (
                  <a
                    key={area.slug}
                    href={siteHref(payload, area.path)}
                    onClick={() => setMobileOpen(false)}
                  >
                    {area.label}
                  </a>
                ))}
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
