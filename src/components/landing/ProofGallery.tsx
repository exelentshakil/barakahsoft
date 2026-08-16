import fs from "node:fs";
import path from "node:path";
import { Marquee } from "@/components/landing/primitives/Marquee";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Sparkles } from "lucide-react";

const CLIENTS_DIR = path.join(process.cwd(), "public", "refs", "clients");
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

// Auto-renders whatever's dropped in public/refs/clients/ — no CMS, name
// files clearly (plumber-belfast.png, karting-coleraine.png) and they show
// up here, framed like a browser window so a flat screenshot reads as a
// live site rather than a static image (plan §3).
function labelFromFilename(filename: string): string {
  return filename
    .replace(IMAGE_EXT, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function GalleryCard({ file }: { file: string }) {
  return (
    <div className="w-[320px] overflow-hidden rounded-xl border border-border bg-card shadow-lift sm:w-[380px]">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/refs/clients/${file}`} alt={labelFromFilename(file)} className="aspect-[4/3] w-full object-cover object-top" />
      <p className="px-3 py-2 text-sm font-medium text-muted-foreground">{labelFromFilename(file)}</p>
    </div>
  );
}

export function ProofGallery() {
  let files: string[] = [];
  try {
    files = fs.readdirSync(CLIENTS_DIR).filter((f) => IMAGE_EXT.test(f));
  } catch {
    files = [];
  }

  // v4 Phase R1 — this used to silently return null with zero real
  // deliveries in public/refs/clients/, leaving a dead gap on the landing
  // page. A real placeholder is honest (we don't fabricate fake client
  // work here — see Phase R's plan note on never presenting reference
  // sites as our own portfolio) and keeps the page's flow intact until the
  // first few real redesigns land.
  if (files.length === 0) {
    return (
      <section id="proof" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Real redesigns, not mockups</h2>
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">Premium redesigns landing soon.</p>
          <p className="mt-1 text-xs text-muted-foreground">Every example here will be a real, delivered client site — not a mockup.</p>
        </div>
      </section>
    );
  }

  // Two rows, opposite directions -- every real delivery shown (not just a
  // curated slice), split evenly across the pair.
  const mid = Math.ceil(files.length / 2);
  const rowOne = files.slice(0, mid);
  const rowTwo = files.slice(mid);

  return (
    <section id="proof" className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionEyebrow icon={Sparkles}>Real client work</SectionEyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Real redesigns, not mockups</h2>
        <p className="mt-3 text-muted-foreground">Every one of these {files.length} sites is a real, delivered client redesign.</p>
      </div>

      <div className="mt-10 space-y-6">
        <Marquee gap="gap-6" durationSeconds={Math.max(40, rowOne.length * 6)}>
          {rowOne.map((file) => (
            <GalleryCard key={file} file={file} />
          ))}
        </Marquee>
        {rowTwo.length > 0 && (
          <Marquee gap="gap-6" reverse durationSeconds={Math.max(40, rowTwo.length * 6)}>
            {rowTwo.map((file) => (
              <GalleryCard key={file} file={file} />
            ))}
          </Marquee>
        )}
      </div>
    </section>
  );
}
