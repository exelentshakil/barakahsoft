"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, MapPin, Menu, Phone, Sparkles, X, ShieldCheck, Star } from "lucide-react";
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

  // Modern Multi-Column Mega Menu Panel with high-fidelity visual cards and thumbnail media
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
                <div className="flex items-center gap-2">
                  <span className="bs-nav-mega-kicker">
                    {kind === "services" ? "Core Services" : "Coverage Locations"}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--bs-primary)]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {items.length} {kind === "services" ? "offerings available" : "zones covered"}
                </span>
              </div>
              <div className={`bs-nav-mega-cols ${items.length > 3 ? "bs-nav-mega-cols-2" : "bs-nav-mega-cols-1"}`}>
                {items.map((item) => {
                  const matchedService = kind === "services"
                    ? payload.services.find(
                        (s) => s.slug === item.slug || s.h2?.toLowerCase() === item.label?.toLowerCase()
                      )
                    : null;
                  const itemImg = matchedService?.imageUrl || matchedService?.imageUrls?.[0];

                  return (
                    <a
                      key={item.slug}
                      href={siteHref(payload, item.path)}
                      className="bs-nav-panel-item group"
                    >
                      {kind === "services" ? (
                        itemImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={itemImg}
                            alt={item.label}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200/90 shadow-xs shrink-0 group-hover:border-[var(--bs-primary)] transition-colors"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-[var(--bs-surface-alt,#f8fafc)] border border-[var(--bs-border-color,#e2e8f0)] flex items-center justify-center shrink-0 text-[var(--bs-primary-on-surface)] group-hover:bg-[var(--bs-primary)] group-hover:text-[var(--bs-on-primary)] transition-all">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                        )
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[var(--bs-surface-alt,#f8fafc)] border border-[var(--bs-border-color,#e2e8f0)] flex items-center justify-center shrink-0 text-[var(--bs-primary-on-surface)] group-hover:bg-[var(--bs-primary)] group-hover:text-[var(--bs-on-primary)] transition-all">
                          <MapPin className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="bs-nav-panel-title group-hover:text-[var(--bs-primary-on-surface)] transition-colors">
                            {item.label}
                          </span>
                          <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--bs-primary-on-surface)] shrink-0" />
                        </div>
                        {item.description ? (
                          <span className="bs-nav-panel-desc line-clamp-1">{item.description.slice(0, 68)}</span>
                        ) : (
                          <span className="bs-nav-panel-desc">Professional {item.label.toLowerCase()} services</span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Right Side Featured Promo Card in Mega Menu */}
            <div className="bs-nav-mega-featured">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bs-nav-featured-badge">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Rapid Response
                  </span>
                  {payload.proof.rating && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      {payload.proof.rating}★
                    </span>
                  )}
                </div>
                <p className="bs-nav-featured-title">Need Immediate On-Site Help?</p>
                <p className="bs-nav-featured-desc">
                  Certified local technicians are dispatched for fast emergency response and honest upfront estimates.
                </p>
              </div>

              <div className="bs-nav-featured-actions space-y-2 pt-2">
                {payload.nap.phone && (
                  <a
                    href={`tel:${phoneDigits}`}
                    className="bs-btn bs-btn-primary bs-btn-sm w-full text-center flex items-center justify-center gap-1.5 shadow-sm font-bold"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call {payload.nap.phone}
                  </a>
                )}
                <button
                  type="button"
                  onClick={openQuoteModal}
                  className="bs-btn bs-btn-ghost bs-btn-sm w-full text-center font-bold text-[11px] border border-slate-200 hover:bg-white"
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
