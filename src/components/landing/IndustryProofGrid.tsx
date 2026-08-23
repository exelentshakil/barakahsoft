const SUPABASE_STORAGE_URL = "https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/design-reference";

// Every trade we build for, with a real rebuild behind each one.
//
// The marquee above shows concepts scrolling past, which proves the work
// looks good but not that it covers the reader's own trade. A plumber
// watching roofing sites go by has no reason to believe we understand
// plumbing, and "we work with home services" does not answer it.
//
// Each image here is a real rebuild from that trade's folder in storage,
// and each line says the one thing that actually changes for that trade —
// which is the part a template cannot do and the reason the page is worth
// scrolling.
const TRADES = [
  {
    name: "Roofers",
    image: `${SUPABASE_STORAGE_URL}/roofers/1.jpg`,
    note: "Storm damage is urgent and a replacement is considered. The page has to serve both without burying either.",
  },
  {
    name: "Electricians",
    image: `${SUPABASE_STORAGE_URL}/electricians/1.jpg`,
    note: "Panel upgrades and EV chargers are searched by name. Each one gets its own page rather than a bullet on a list.",
  },
  {
    name: "Plumbers",
    image: `${SUPABASE_STORAGE_URL}/plumbers/1.jpg`,
    note: "Someone with a leak is not reading. The number is tappable on every screen and answering is the whole offer.",
  },
  {
    name: "HVAC",
    image: `${SUPABASE_STORAGE_URL}/hvac/1.jpg`,
    note: "Emergency call-outs and planned installs are two different customers, so they get two different paths.",
  },
  {
    name: "Remodelers",
    image: `${SUPABASE_STORAGE_URL}/remodelers/1.jpg`,
    note: "Nobody buys a kitchen from a paragraph. Finished work carries this page, at the size it deserves.",
  },
  {
    name: "Restoration",
    image: `${SUPABASE_STORAGE_URL}/restoration/1.jpg`,
    note: "Water and fire work arrives at three in the morning through an insurer. The page is built to be trusted fast.",
  },
  {
    name: "Movers",
    image: `${SUPABASE_STORAGE_URL}/movers/1.jpg`,
    note: "Quotes are compared side by side, so the estimate has to be the easiest thing on the page to ask for.",
  },
  {
    name: "Contractors",
    image: `${SUPABASE_STORAGE_URL}/contractors/1.jpg`,
    note: "Residential and commercial buyers judge differently. Both find their own proof without wading through the other's.",
  },
];

export function IndustryProofGrid() {
  return (
    <section className="border-b border-[#d9e8f4] bg-[#f7fbff] py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Built for your trade</p>
          <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
            We have already rebuilt a site like yours.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#60778d]">
            Every one of these is a real rebuild, not a template with a different photograph. What changes between them is
            not the colour — it is what the page leads with, because a leaking pipe and a new kitchen are not the same
            decision.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRADES.map((trade) => (
            <article
              key={trade.name}
              className="group overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition duration-300 hover:-translate-y-1.5 hover:border-[#0c68c8] hover:shadow-[0_20px_45px_rgba(7,40,77,0.12)]"
            >
              <div className="relative h-52 overflow-hidden bg-[#eef7ff]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trade.image}
                  alt={`A homepage we rebuilt for a ${trade.name.toLowerCase().replace(/s$/, "")} business`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="text-base font-bold text-[#07284d]">{trade.name}</p>
                <p className="mt-2 text-sm leading-6 text-[#60778d]">{trade.note}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-[#60778d]">
          Not on this list? If people find you on Google and ring you, the same thing applies. Send the address and we
          will show you rather than describe it.
        </p>
      </div>
    </section>
  );
}
