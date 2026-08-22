import { Mail, MapPin, Phone } from "lucide-react";
import type { ChromeSpec } from "@/lib/chrome-spec";
import type { SitePayload } from "@/components/site-shell/types";

// The per-lead footer, rendered from the same spec and the same design
// tokens as the header and the page body.
//
// Privacy and Terms are unconditional. Those routes existed for every
// delivered site and nothing linked to them, leaving two orphaned pages;
// a real business site carries both, and their absence is exactly what a
// cautious buyer notices.

function href(payload: SitePayload, path: string): string {
  return `/s/${payload.leadSlug}${path}`;
}

export function BespokeFooter({ payload, spec }: { payload: SitePayload; spec: ChromeSpec }) {
  const { footer } = spec;
  const year = new Date().getFullYear();
  const phoneDigits = payload.nap.phone?.replace(/[^\d+]/g, "") ?? "";

  const showServices = footer.showServices && payload.services.length > 0;
  const showAreas = footer.showAreas && payload.areas.length > 0;
  const columnCount = 2 + (showServices ? 1 : 0) + (showAreas ? 1 : 0);

  const isCompact = footer.archetype === "compact";

  return (
    <footer className="bs-footer">
      <div className="bs-footer-inner">
        {footer.ctaBand && !isCompact && (
          <div className="bs-footer-cta">
            <h2>Ready to get this sorted?</h2>
            <div className="bs-row">
              {payload.nap.phone && (
                <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-accent bs-btn-lg">
                  Call {payload.nap.phone}
                </a>
              )}
              <a href={href(payload, "/contact")} className="bs-btn bs-btn-ghost bs-btn-lg">
                Send a message
              </a>
            </div>
          </div>
        )}

        {!isCompact && (
          <div className={`bs-footer-cols ${columnCount >= 4 ? "bs-footer-cols-4" : "bs-footer-cols-3"}`}>
            <div>
              <p className="bs-logo" style={{ marginBottom: "0.75rem" }}>
                {payload.businessName}
              </p>
              <div className="bs-footer-list">
                {payload.nap.phone && (
                  <a href={`tel:${phoneDigits}`}>
                    <Phone className="mr-2 inline h-4 w-4" aria-hidden />
                    {payload.nap.phone}
                  </a>
                )}
                {payload.nap.email && (
                  <a href={`mailto:${payload.nap.email}`}>
                    <Mail className="mr-2 inline h-4 w-4" aria-hidden />
                    {payload.nap.email}
                  </a>
                )}
                {payload.nap.address && (
                  <span>
                    <MapPin className="mr-2 inline h-4 w-4" aria-hidden />
                    {payload.nap.address}
                  </span>
                )}
              </div>
            </div>

            {showServices && (
              <div>
                <p className="bs-footer-heading">Services</p>
                <div className="bs-footer-list">
                  {payload.services.map((service) => (
                    <a
                      key={service.slug}
                      href={payload.innerPagesBuilt ? href(payload, `/services/${service.slug}`) : `#${service.slug}`}
                    >
                      {service.h2}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {showAreas && (
              <div>
                <p className="bs-footer-heading">Service areas</p>
                <div className="bs-footer-list">
                  {payload.areas.map((area) => (
                    <a
                      key={area.slug}
                      href={payload.innerPagesBuilt ? href(payload, `/areas/${area.slug}`) : `#${area.slug}`}
                    >
                      {area.h2}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="bs-footer-heading">Company</p>
              <div className="bs-footer-list">
                <a href={href(payload, "/about")}>About</a>
                <a href={href(payload, "/faq")}>FAQ</a>
                <a href={href(payload, "/contact")}>Contact</a>
                {payload.fullSiteBuilt && <a href={href(payload, "/blog")}>Advice</a>}
              </div>
            </div>
          </div>
        )}

        <div className="bs-footer-legal">
          <p>
            &copy; {year} {payload.businessName}. All rights reserved.
          </p>
          <nav>
            {isCompact && <a href={href(payload, "/contact")}>Contact</a>}
            <a href={href(payload, "/privacy")}>Privacy Policy</a>
            <a href={href(payload, "/terms")}>Terms of Service</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
