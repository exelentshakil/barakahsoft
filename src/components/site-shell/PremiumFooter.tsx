import { ShieldCheck, ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import { sectionHref, type SitePayload } from "@/components/site-shell/types";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// Bank/fintech footer density (plan §5/§7), not three links and a
// copyright: 5 columns, a credentials row, a real disclaimer paragraph,
// and a legal bottom bar. NAP is real text here (crawlable), not baked
// into an image, with tel:/mailto: links. v4 (Phase V) -- brought onto
// Phase J's actual premium tokens (subtle gradient top border, IconBadge
// on contact rows, Reveal fade-in) instead of plain neutral borders/text,
// and every trace of agency branding removed -- a sold, white-label site
// never carries the agency's own name.
export function PremiumFooter({ payload }: { payload: SitePayload }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-muted/40">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary" aria-hidden="true" />
      <Reveal variant="fade-in">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <p className="font-display text-lg font-bold">{payload.businessName}</p>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{payload.differentiator}</p>
              {(payload.socialUrls.length > 0) && (
                <div className="mt-4 flex gap-3">
                  {payload.socialUrls.slice(0, 4).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold">Services</p>
              <ul className="mt-3 space-y-2">
                {payload.services.map((s) => (
                  <li key={s.slug}>
                    <a href={sectionHref(payload, "services", s.slug)} className="text-sm text-muted-foreground hover:text-foreground">
                      {s.h2}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold">Areas</p>
              <ul className="mt-3 space-y-2">
                {payload.areas.map((a) => (
                  <li key={a.slug}>
                    <a href={sectionHref(payload, "areas", a.slug)} className="text-sm text-muted-foreground hover:text-foreground">
                      {a.h2}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold">Contact</p>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                {payload.nap.phone && (
                  <li>
                    <a href={`tel:${payload.nap.phone}`} className="flex items-center gap-2.5 hover:text-foreground">
                      <IconBadge icon={Phone} size="sm" /> {payload.nap.phone}
                    </a>
                  </li>
                )}
                {payload.nap.email && (
                  <li>
                    <a href={`mailto:${payload.nap.email}`} className="flex items-center gap-2.5 hover:text-foreground">
                      <IconBadge icon={Mail} size="sm" /> {payload.nap.email}
                    </a>
                  </li>
                )}
                {payload.nap.address && (
                  <li className="flex items-center gap-2.5">
                    <IconBadge icon={MapPin} size="sm" /> {payload.nap.address}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            Every claim on this page is grounded in real business data — no invented reviews or service areas.
          </div>

          <p className="mt-6 max-w-3xl text-xs text-muted-foreground">
            {payload.businessName} makes reasonable efforts to keep information on this site accurate and up to date. Pricing,
            availability, and service area are subject to confirmation at time of booking.
          </p>
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <p>
              &copy; {year} {payload.businessName}. All rights reserved.
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
