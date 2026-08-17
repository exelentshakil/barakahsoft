const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

// Copyright + legal links verbatim from the live barakahsoft.com footer.
// Given a solid dark background (not just a thin border) so it reads as a
// real, unmistakable footer rather than blending into the page above it.
export function Footer() {
  return (
    <footer className="bg-foreground py-14 text-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 border-b border-background/10 pb-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto brightness-0 invert" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-background/65">BarakahSoft builds and manages conversion systems for US home-service businesses: landing pages, Meta ads, creative, lead routing, and follow-up.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/50">The sprint</p>
            <div className="mt-4 space-y-2 text-sm text-background/75"><p>$500/week management</p><p>Ad spend stays in your Meta account</p><p>No long-term obligation</p></div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/50">Talk to us</p>
            <div className="mt-4 space-y-2 text-sm"><a href="tel:+13075336678" className="block transition-colors hover:text-background">+1 (307) 533-6678</a><a href="mailto:hello@barakahsoft.com" className="block text-background/75 transition-colors hover:text-background">hello@barakahsoft.com</a><p className="text-background/50">Wyoming, United States</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6 text-xs text-background/50 sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright © 2026 BarakahSoft LLC. All Rights Reserved.</span>
          <div className="flex gap-5"><a href="/terms-and-conditions/" className="hover:text-background">Terms</a><a href="/privacy-policy/" className="hover:text-background">Privacy</a><a href="/refund-policy/" className="hover:text-background">Refund policy</a></div>
        </div>
      </div>
    </footer>
  );
}
