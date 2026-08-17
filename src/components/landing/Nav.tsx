import { Button } from "@/components/ui/button";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#team", label: "Team" },
  { href: "#faq", label: "FAQ" },
];

// Sticky header -- real logo hotlinked from the live marketing site, not
// present anywhere on the landing page before this redesign.
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="#" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm">
          <a href="#top">Get my free redesign</a>
        </Button>
      </div>
    </header>
  );
}
