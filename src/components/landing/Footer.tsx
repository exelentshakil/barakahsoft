const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

// Copyright + legal links verbatim from the live barakahsoft.com footer.
export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-14 text-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 border-b border-border pb-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">BarakahSoft creates human-reviewed homepage redesigns and complete lead-ready websites built from the business&apos;s real content and branding.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">The offer</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>Free homepage concept</p><p>Complete website: $797 flat</p><p>No obligation to continue</p></div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Talk to us</p>
            <div className="mt-4 space-y-2 text-sm"><a href="tel:+13075336678" className="block transition-colors hover:text-primary">+1 (307) 533-6678</a><a href="mailto:hello@barakahsoft.com" className="block text-muted-foreground transition-colors hover:text-primary">hello@barakahsoft.com</a><p className="text-muted-foreground">Wyoming, United States</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright © 2026 BarakahSoft LLC. All Rights Reserved.</span>
          <div className="flex gap-5"><a href="/terms-and-conditions/" className="hover:text-primary">Terms</a><a href="/privacy-policy/" className="hover:text-primary">Privacy</a><a href="/refund-policy/" className="hover:text-primary">Refund policy</a></div>
        </div>
      </div>
    </footer>
  );
}
