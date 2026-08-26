"use client";

import { CheckCircle2, Clock, Mail, MapPin, Phone, ShieldCheck, Star } from "lucide-react";
import type { ChromeSpec } from "@/lib/chrome-spec";
import { homepageAnchor, siteHref, type SitePayload } from "@/components/site-shell/types";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 12 5 12 5s6.255 0 7.812.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
    </svg>
  );
}

function YelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.27 12.56l3.35 1.93a1.44 1.44 0 0 0 1.97-.52 1.44 1.44 0 0 0-.52-1.97l-3.35-1.93-1.45 2.49zm-.54-1.56l-.01-3.87a1.44 1.44 0 0 0-1.44-1.44 1.44 1.44 0 0 0-1.44 1.44l.01 3.87 2.88 0zm-2.02.94L6.36 10a1.44 1.44 0 0 0-1.97.52 1.44 1.44 0 0 0 .52 1.97l3.35 1.94 1.45-2.49zm.55 1.57l-.01 3.87a1.44 1.44 0 0 0 1.44 1.44 1.44 1.44 0 0 0 1.44-1.44l.01-3.87-2.88 0zm2.02-.95l3.35 1.93a1.44 1.44 0 0 0 1.97-.52 1.44 1.44 0 0 0-.52-1.97l-3.35-1.93-1.45 2.49z"/>
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

interface SocialItem {
  pattern: RegExp;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIAL_ITEMS: SocialItem[] = [
  { pattern: /facebook\.com/i, label: "Facebook", icon: FacebookIcon },
  { pattern: /instagram\.com/i, label: "Instagram", icon: InstagramIcon },
  { pattern: /youtube\.com/i, label: "YouTube", icon: YouTubeIcon },
  { pattern: /(twitter|x)\.com/i, label: "X", icon: XIcon },
  { pattern: /linkedin\.com/i, label: "LinkedIn", icon: LinkedInIcon },
  { pattern: /tiktok\.com/i, label: "TikTok", icon: TikTokIcon },
  { pattern: /yelp\.com/i, label: "Yelp", icon: YelpIcon },
];

export function BespokeFooter({ payload, spec }: { payload: SitePayload; spec: ChromeSpec }) {
  const openQuoteModal = useQuoteModal();
  const { footer } = spec;
  const year = new Date().getFullYear();
  const phoneDigits = payload.nap.phone?.replace(/[^\d+]/g, "") ?? "";

  const isCompact = footer.archetype === "compact";
  const primaryCta = payload.primaryAction === "call-now" && payload.nap.phone ? (
    <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-primary bs-btn-lg">
      {payload.primaryActionLabel}
    </a>
  ) : (
    <button type="button" onClick={openQuoteModal} className="bs-btn bs-btn-primary bs-btn-lg">
      {payload.primaryActionLabel}
    </button>
  );

  // Collect active social icons
  const activeSocials = payload.socialUrls
    .map((url) => {
      const match = SOCIAL_ITEMS.find((s) => s.pattern.test(url));
      return match ? { url, label: match.label, Icon: match.icon } : null;
    })
    .filter((item): item is { url: string; label: string; Icon: React.ComponentType<{ className?: string }> } => Boolean(item));

  // Determine services to list
  const servicesList = payload.services.length > 0 ? payload.services : [];
  const areasList = payload.areas.length > 0 ? payload.areas : [];

  const companyBio = payload.differentiator || `${payload.businessName} is dedicated to providing premium local ${(payload as any).industry ? (payload as any).industry.toLowerCase() : "professional"} solutions with expert service and verified customer satisfaction.`;

  return (
    <footer className="bs-footer">
      <div className="bs-footer-inner">
        {footer.ctaBand && !isCompact && (
          <div className="bs-footer-cta">
            <div>
              {(payload as any).industry ? (
                <>
                  <p className="bs-footer-kicker">Professional {(payload as any).industry} Services</p>
                  <h2>Ready to get started with your project?</h2>
                  <p className="bs-footer-cta-sub">
                    Speak directly with a specialist or request a consultation today. We are here to help you achieve your goals.
                  </p>
                </>
              ) : (
                <>
                  <p className="bs-footer-kicker">Expert Services &amp; Free Quotes</p>
                  <h2>Need professional assistance or an expert consultation?</h2>
                  <p className="bs-footer-cta-sub">
                    Our team is ready to help. Speak directly with a specialist or request an instant assessment.
                  </p>
                </>
              )}
            </div>
            <div className="bs-row bs-footer-cta-actions">
              {primaryCta}
              {payload.nap.phone && (
                <a href={`tel:${phoneDigits}`} className="bs-btn bs-btn-ghost bs-btn-lg">
                  <Phone className="mr-2 inline h-4 w-4" /> Call {payload.nap.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {!isCompact && (
          <div className={`bs-footer-cols ${areasList.length === 0 ? "bs-footer-cols-3" : "bs-footer-cols-4"}`}>
            {/* Col 1: Brand, Bio, Contact, Trust, Socials */}
            <div className="bs-footer-col-brand">
              <a href={siteHref(payload)} className="bs-logo bs-footer-logo">
                {payload.footerLogoUrl || payload.logoUrl ? (
                  <div className="bs-footer-logo-badge">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={payload.footerLogoUrl || payload.logoUrl || ""} alt={payload.businessName} />
                  </div>
                ) : (
                  <span className="bs-footer-brand-text">{payload.businessName}</span>
                )}
              </a>

              <p className="bs-footer-desc">{companyBio}</p>

              <div className="bs-footer-badges">
                <span className="bs-footer-badge">
                  {(payload as any).industry ? (
                    <><Clock className="h-3.5 w-3.5 text-emerald-400" /> Fast &amp; Reliable Response</>
                  ) : (
                    <><Clock className="h-3.5 w-3.5 text-emerald-400" /> 24/7 Emergency Service</>
                  )}
                </span>
                <span className="bs-footer-badge">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Licensed &amp; Insured
                </span>
              </div>

              <div className="bs-footer-list bs-footer-contact">
                {payload.nap.phone && (
                  <a href={`tel:${phoneDigits}`} className="bs-footer-contact-link">
                    <Phone className="mr-2 inline h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span>{payload.nap.phone}</span>
                  </a>
                )}
                {payload.nap.email && (
                  <a href={`mailto:${payload.nap.email}`} className="bs-footer-contact-link">
                    <Mail className="mr-2 inline h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span>{payload.nap.email}</span>
                  </a>
                )}
                {payload.nap.address && (
                  <span className="bs-footer-contact-link">
                    <MapPin className="mr-2 inline h-4 w-4 shrink-0 opacity-80" aria-hidden />
                    <span>{payload.nap.address}</span>
                  </span>
                )}
                {payload.googleReviewsUrl && payload.proof.rating && (
                  <a href={payload.googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="bs-footer-rating-link">
                    <Star className="mr-2 inline h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    <strong>{payload.proof.rating.toFixed(1)} Stars</strong> on Google
                    {payload.proof.reviewCount ? ` (${payload.proof.reviewCount}+ reviews)` : ""}
                  </a>
                )}
              </div>

              {activeSocials.length > 0 && (
                <div className="bs-footer-socials">
                  {activeSocials.map(({ url, label, Icon }) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bs-footer-social-btn"
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Col 2: Core Services */}
            <div>
              <p className="bs-footer-heading">Core Services</p>
              <div className="bs-footer-list">
                {servicesList.length > 0 ? (
                  servicesList.map((service) => {
                    const hasPage = payload.bespokePages[`services/${service.slug}`] && payload.innerPagesBuilt;
                    const href = hasPage
                      ? siteHref(payload, `/services/${service.slug}`)
                      : homepageAnchor(payload, service.slug || "services");
                    return (
                      <a key={service.slug || service.h2} href={href}>
                        {service.h2}
                      </a>
                    );
                  })
                ) : (
                  <a href={homepageAnchor(payload, "services")}>View all services</a>
                )}
              </div>
            </div>

            {/* Col 3: Service Areas / Locations */}
            {areasList.length > 0 && (
              <div>
                <p className="bs-footer-heading">Service Areas</p>
                <div className="bs-footer-list">
                  {areasList.map((area) => {
                    const hasPage = payload.bespokePages[`areas/${area.slug}`] && payload.innerPagesBuilt;
                    const href = hasPage
                      ? siteHref(payload, `/areas/${area.slug}`)
                      : homepageAnchor(payload, "areas");
                    return (
                      <a key={area.slug || area.h2} href={href} className="bs-footer-area-item">
                        <MapPin className="mr-1.5 inline h-3.5 w-3.5 opacity-60 shrink-0" />
                        <span>{area.h2}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Col 4: Quick Links / Sitemap */}
            <div>
              <p className="bs-footer-heading">Useful Links</p>
              <div className="bs-footer-list">
                <a href={siteHref(payload)}>Home</a>
                <a href={payload.bespokePages.about && payload.innerPagesBuilt ? siteHref(payload, "/about") : homepageAnchor(payload, "about")}>
                  About Us
                </a>
                <a href={payload.bespokePages.faq && payload.innerPagesBuilt ? siteHref(payload, "/faq") : homepageAnchor(payload, "faq")}>
                  Frequently Asked Questions
                </a>
                <a href={payload.bespokePages.contact && payload.innerPagesBuilt ? siteHref(payload, "/contact") : homepageAnchor(payload, "contact")}>
                  Contact Us
                </a>
                <button
                  type="button"
                  onClick={openQuoteModal}
                  className="text-left cursor-pointer hover:underline opacity-80 hover:opacity-100"
                >
                  Request Fast Quote
                </button>
                <a href={siteHref(payload, "/terms")}>Terms of Service</a>
                <a href={siteHref(payload, "/privacy")}>Privacy Policy</a>
              </div>
            </div>
          </div>
        )}

        <div className="bs-footer-legal">
          <div className="bs-footer-legal-copy">
            <p>
              &copy; {year} {payload.businessName}. All rights reserved. {(payload as any).industry ? `Professional ${(payload as any).industry} Services.` : ""}
            </p>
          </div>
          <nav>
            {isCompact && (
              <a href={payload.bespokePages.contact && payload.innerPagesBuilt ? siteHref(payload, "/contact") : homepageAnchor(payload, "contact")}>
                Contact
              </a>
            )}
            {!payload.hideLegalLinks && (
              <>
                <a href={siteHref(payload, "/privacy")}>Privacy Policy</a>
                <a href={siteHref(payload, "/terms")}>Terms of Service</a>
              </>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
