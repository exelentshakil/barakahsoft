import { getTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#team", label: "Team" },
  // { href: "#design-standard", label: "Design standard" },
  // Pointed at #industries, which lives in a section this page does not
  // render — the link scrolled nowhere.
  { href: "#design-quality", label: "Design Quality" },
  { href: "#faq", label: "FAQ" },
];

// Sticky header -- real logo hotlinked from the live marketing site, not
// present anywhere on the landing page before this redesign.
/**
 * Resolves its own brand rather than taking it as a prop.
 *
 * The nav appears on the landing page and on all three legal pages; threading
 * a prop through each of those is four places to forget, and this is a server
 * component so the lookup is free.
 */
export async function Nav() {
  const { brand } = await getTenant();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoUrl} alt={brand.name} className="h-6 sm:h-7 w-auto object-contain" />
        </a>
         <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
           {LINKS.map((link) => (
             <a key={link.href} href={`/${link.href}`} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
         <div className="hidden items-center gap-4 lg:flex">
           <a href={`tel:${brand.phoneE164}`} className="text-sm font-semibold text-foreground transition hover:text-primary">{brand.phoneDisplay}</a>
           <a href={`mailto:${brand.supportEmail}`} className="text-sm text-muted-foreground transition hover:text-primary">{brand.supportEmail}</a>
           <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground hover:brightness-110">
             <a href="/#top">See My New Homepage (Free)</a>
           </Button>
         </div>
         <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground hover:brightness-110 lg:hidden">
           <a href="/#top">Free Redesign</a>
         </Button>
      </div>
    </header>
  );
}
