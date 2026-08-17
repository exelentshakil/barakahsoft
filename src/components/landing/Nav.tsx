import { Button } from "@/components/ui/button";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#team", label: "Team" },
  { href: "#pricing", label: "Pricing" },
  { href: "#design-standard", label: "Design standard" },
  { href: "#industries", label: "Industries" },
  { href: "#faq", label: "FAQ" },
];

// Sticky header -- real logo hotlinked from the live marketing site, not
// present anywhere on the landing page before this redesign.
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
        </a>
         <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
           {LINKS.map((link) => (
             <a key={link.href} href={`/${link.href}`} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
         <div className="hidden items-center gap-4 lg:flex">
           <a href="tel:+13075336678" className="text-sm font-semibold text-foreground transition hover:text-primary">+1 (307) 533-6678</a>
           <a href="mailto:hello@barakahsoft.com" className="text-sm text-muted-foreground transition hover:text-primary">hello@barakahsoft.com</a>
           <Button asChild size="sm" className="rounded-lg bg-[#ffd12d] text-[#111] hover:bg-[#f5c400]"><a href="/#top">See if I qualify</a></Button>
         </div>
          <Button asChild size="sm" className="rounded-lg bg-[#ffd12d] text-[#111] hover:bg-[#f5c400] lg:hidden"><a href="/#top">See if I qualify</a></Button>
      </div>
    </header>
  );
}
