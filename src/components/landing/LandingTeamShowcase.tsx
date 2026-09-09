import { getTenant } from "@/lib/tenant";
import { ArrowRight, Mail, Phone } from "lucide-react";
import Image from "next/image";

export async function LandingTeamShowcase() {
  const { brand, landing } = await getTenant();

  // The team comes from the tenant. It was two hardcoded people, so a partner's
  // landing page introduced their prospects to somebody else's founder — the
  // single most obviously wrong thing a white-label could render.
  //
  // A tenant with no team listed renders nothing rather than an empty section:
  // "who you are working with" followed by a blank row reads worse than the
  // section not existing.
  const people = landing.team;
  if (people.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-24 border-t border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Who you are working with</p><h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">A small hands-on team behind the work.</h2></div><p className="max-w-xl text-lg leading-8 text-[#60778d]">Automation helps us collect evidence quickly. People still choose the design direction, review the content, and decide what is ready to send.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">{people.map((person) => <article key={person.name} className="group overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,40,77,0.12)]"><div className="grid min-h-[270px] sm:grid-cols-[190px_1fr]"><div className="relative h-64 overflow-hidden bg-[#eef7ff] sm:h-auto"><Image src={person.photoUrl ?? ""} alt={person.name} width={190} height={270} className="absolute inset-0 h-full w-full object-cover object-top grayscale-[15%] transition duration-500 group-hover:scale-105" /></div><div className="flex flex-col p-7"><p className="text-xl font-bold text-[#07284d]">{person.name}</p><p className="mt-1 whitespace-nowrap text-xs font-semibold text-[#0c68c8]">{person.role}</p><p className="mt-6 text-sm leading-6 text-[#60778d]">{person.bio}</p><div className="mt-auto pt-7"><div className="h-1 w-10 rounded-full bg-[#ffd12d]" /></div></div></div></article>)}</div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c8ddec] bg-white px-6 py-5"><p className="text-sm font-semibold text-[#07284d]">Questions before you start? Talk directly to the team.</p><div className="flex flex-wrap gap-4 text-sm font-bold"><a href={`tel:${brand.phoneE164}`} className="inline-flex items-center gap-2 text-[#07284d] hover:text-[#0c68c8]"><Phone className="h-4 w-4" /> {brand.phoneDisplay}</a><a href={`mailto:${brand.supportEmail}`} className="inline-flex items-center gap-2 text-[#07284d] hover:text-[#0c68c8]"><Mail className="h-4 w-4" /> Email us <ArrowRight className="h-4 w-4" /></a></div></div>
      </div>
    </section>
  );
}
