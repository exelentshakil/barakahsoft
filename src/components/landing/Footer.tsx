const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";
const STRIPE_BADGE = "https://barakahsoft.com/wp-content/uploads/2026/07/stripe-secure-payment.webp";

// Copyright + legal links verbatim from the live barakahsoft.com footer.
// Given a solid dark background (not just a thin border) so it reads as a
// real, unmistakable footer rather than blending into the page above it.
export function Footer() {
  return (
    <footer className="bg-foreground py-12 text-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto brightness-0 invert" />
            <span className="text-sm text-background/70">Copyright © 2026 BarakahSoft LLC. All Rights Reserved.</span>
          </div>
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-background/70">
              <a href="/terms-and-conditions/" className="transition-colors hover:text-background">
                Terms
              </a>
              <a href="/privacy-policy/" className="transition-colors hover:text-background">
                Privacy
              </a>
              <a href="/refund-policy/" className="transition-colors hover:text-background">
                Refund Policy
              </a>
              <a href="mailto:hello@barakahsoft.com" className="transition-colors hover:text-background">
                Contact
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={STRIPE_BADGE} alt="Secure payment powered by Stripe" className="h-6 w-auto opacity-80" />
          </div>
        </div>
      </div>
    </footer>
  );
}
