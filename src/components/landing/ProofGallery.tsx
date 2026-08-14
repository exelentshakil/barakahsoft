import fs from "node:fs";
import path from "node:path";

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

export function ProofGallery() {
  let files: string[] = [];
  try {
    files = fs.readdirSync(CLIENTS_DIR).filter((f) => IMAGE_EXT.test(f));
  } catch {
    files = [];
  }

  if (files.length === 0) return null;

  return (
    <section id="proof" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight">Real redesigns, not mockups</h2>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file) => (
          <div key={file} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/refs/clients/${file}`} alt={labelFromFilename(file)} className="w-full object-cover" />
            <p className="px-3 py-2 text-sm font-medium text-muted-foreground">{labelFromFilename(file)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
