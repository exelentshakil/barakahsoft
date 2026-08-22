import { ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import { sectionHref, type SitePayload } from "@/components/site-shell/types";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

function SocialMark({ url }: { url: string }) {
  const kind = /facebook/i.test(url) ? "facebook" : /instagram/i.test(url) ? "instagram" : /linkedin/i.test(url) ? "linkedin" : /youtube/i.test(url) ? "youtube" : null;
  if (!kind) return null;
  const paths = {
    facebook: "M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H7v3h3v5h3v-5h3l1-3h-4V9c0-.6.4-1 1-1Z",
    instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-1h.01",
    linkedin: "M6 9v9M6 6v.01M10 18v-5a4 4 0 0 1 8 0v5M10 9v9",
    youtube: "m10 15 5-3-5-3v6Zm11-3c0 4-1 5-1 5s-1 1-5 1H9c-4 0-5-1-5-1s-1-1-1-5 1-5 1-5 1-1 5-1h6c4 0 5 1 5 1s1 1 1 5Z",
  } as const;
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d={paths[kind]} /></svg>;
}

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
                  {payload.socialUrls.slice(0, 4).map((url) => {
                    if (!/facebook|instagram|linkedin|youtube/i.test(url)) return null;
                    return (
                    <a key={url} href={url} target="_blank" rel="noreferrer" aria-label="Social profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary">
                      <SocialMark url={url} />
                    </a>
                    );
                  })}
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
                {payload.areas.slice(0, 12).map((a) => (
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
            {/* Privacy and Terms routes existed but nothing linked to them,
                leaving two orphaned pages on every delivered site. A real
                business site is expected to carry both, and their absence
                from the footer is the first thing a cautious buyer notices. */}
            {payload.innerPagesBuilt && (
              <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <a href={`/s/${payload.leadSlug}/about`} className="hover:text-foreground">
                  About
                </a>
                <a href={`/s/${payload.leadSlug}/contact`} className="hover:text-foreground">
                  Contact
                </a>
                <a href={`/s/${payload.leadSlug}/privacy`} className="hover:text-foreground">
                  Privacy Policy
                </a>
                <a href={`/s/${payload.leadSlug}/terms`} className="hover:text-foreground">
                  Terms of Service
                </a>
              </nav>
            )}
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
