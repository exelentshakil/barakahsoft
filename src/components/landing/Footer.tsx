import { getTenant } from "@/lib/tenant";
// Copyright and legal links. The entity named here is the one that contracts
// with the client, so it has to be whichever brand's domain this is — a
// partner's footer claiming another company's copyright is a real problem, not
// a cosmetic one.
export async function Footer() {
  const { brand } = await getTenant();

  return (
    <footer className="border-t border-border bg-background py-14 text-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 border-b border-border pb-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{brand.name} creates human-reviewed homepage redesigns for businesses that want to look as good online as they do in real life.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">The offer</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>Free homepage redesign</p><p>Built around your real business</p><p>No obligation to continue</p></div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Talk to us</p>
            <div className="mt-4 space-y-3 text-sm">
              <a href={`tel:${brand.phoneE164}`} className="block transition-colors hover:text-primary">{brand.phoneDisplay}</a>
              <a href={`mailto:${brand.supportEmail}`} className="block text-muted-foreground transition-colors hover:text-primary">{brand.supportEmail}</a>
              <address className="not-italic text-muted-foreground">30 N. Gould St. Ste R, Sheridan, WY 82801</address>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Copyright © {new Date().getFullYear()} {brand.legalEntity}. All Rights Reserved.</span>
          <div className="flex gap-5"><a href="/terms-and-conditions/" className="hover:text-primary">Terms</a><a href="/privacy-policy/" className="hover:text-primary">Privacy</a><a href="/refund-policy/" className="hover:text-primary">Refund policy</a></div>
        </div>
      </div>
    </footer>
  );
}
