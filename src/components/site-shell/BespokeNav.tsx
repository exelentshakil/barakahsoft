"use client";

import { useState } from "react";
import { Menu, Phone, Star, X } from "lucide-react";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";
import type { ChromeSpec } from "@/lib/chrome-spec";
import type { SitePayload } from "@/components/site-shell/types";

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

function href(payload: SitePayload, path: string): string {
  return `/s/${payload.leadSlug}${path}`;
}

function anchorOr(payload: SitePayload, path: string, anchor: string): string {
  return payload.innerPagesBuilt ? href(payload, path) : anchor;
}

export function BespokeNav({ payload, spec }: { payload: SitePayload; spec: ChromeSpec }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<"services" | "areas" | null>(null);
  const openQuoteModal = useQuoteModal();

  const { nav } = spec;
  const services = payload.services;
  const areas = payload.areas;
  const phoneDigits = payload.nap.phone?.replace(/[^\d+]/g, "") ?? "";

  const logo = (
    <a href={href(payload, "")} className="bs-logo">
      {payload.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={payload.logoUrl} alt={payload.businessName} />
      ) : (
        <span>{payload.businessName}</span>
      )}
    </a>
  );

  const cta = (
    <button
      type="button"
      onClick={openQuoteModal}
      className={`bs-btn ${nav.ctaStyle === "accent" ? "bs-btn-accent" : nav.ctaStyle === "ghost" ? "bs-btn-ghost" : "bs-btn-primary"}`}
    >
      Get a free quote
    </button>
  );

  // A dropdown holding one item is worse than a plain link, so the spec
  // decides whether these are panels or single links at all.
  const dropdown = (
    kind: "services" | "areas",
    label: string,
    items: { slug: string; h2: string; body_content: string }[],
    basePath: string
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
              href={anchorOr(payload, `${basePath}/${item.slug}`, `#${item.slug}`)}
              className="bs-nav-panel-item"
            >
              <span>
                <span className="bs-nav-panel-title">{item.h2}</span>
                {item.body_content && (
                  <span className="bs-nav-panel-desc">{item.body_content.slice(0, 88)}</span>
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
      {nav.servicesDropdown && services.length > 0
        ? dropdown("services", "Services", services, "/services")
        : services.length > 0 && (
            <a href={anchorOr(payload, "/services", "#services")} className="bs-nav-link">
              Services
            </a>
          )}
      {nav.areasDropdown && areas.length > 0 && dropdown("areas", "Service areas", areas, "/areas")}
      <a href={anchorOr(payload, "/about", "#about")} className="bs-nav-link">
        About
      </a>
      <a href={anchorOr(payload, "/faq", "#faq")} className="bs-nav-link">
        FAQ
      </a>
      <a href={anchorOr(payload, "/contact", "#contact")} className="bs-nav-link">
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
            {nav.showRating && payload.proof.rating && payload.proof.reviewCount && (
              <span>
                {payload.proof.rating.toFixed(1)} stars · {payload.proof.reviewCount} Google reviews
              </span>
            )}
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
                {nav.showRating && payload.proof.rating && payload.proof.reviewCount && !nav.utilityBar && (
                  <span className="bs-rating-badge">
                    <Star className="h-3.5 w-3.5" aria-hidden />
                    {payload.proof.rating.toFixed(1)} ({payload.proof.reviewCount})
                  </span>
                )}
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
                href={anchorOr(payload, `/services/${service.slug}`, `#${service.slug}`)}
                onClick={() => setMobileOpen(false)}
              >
                {service.h2}
              </a>
            ))}
            {areas.length > 0 && <span className="bs-nav-mobile-heading">Service areas</span>}
            {areas.map((area) => (
              <a
                key={area.slug}
                href={anchorOr(payload, `/areas/${area.slug}`, `#${area.slug}`)}
                onClick={() => setMobileOpen(false)}
              >
                {area.h2}
              </a>
            ))}
            <span className="bs-nav-mobile-heading">More</span>
            <a href={anchorOr(payload, "/about", "#about")} onClick={() => setMobileOpen(false)}>
              About
            </a>
            <a href={anchorOr(payload, "/faq", "#faq")} onClick={() => setMobileOpen(false)}>
              FAQ
            </a>
            <a href={anchorOr(payload, "/contact", "#contact")} onClick={() => setMobileOpen(false)}>
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
