import { ArrowRight, Mail, Phone } from "lucide-react";

const PEOPLE = [
  { name: "Shakil Ahmed", role: "Founder · Strategy and campaign direction", image: "https://barakahsoft.com/wp-content/uploads/2026/07/Shak-Headshot-Medium.jpeg", body: "I own the offer, research the market, direct the campaign, and make sure the work is built around the jobs you actually want." },
  { name: "Jim Sabellico", role: "Client relations · Communication and support", image: "https://barakahsoft.com/wp-content/uploads/2026/07/Jim-Headshot-Medium.jpeg", body: "I keep communication clear, make sure you know what is happening next, and help turn campaign activity into a useful weekly conversation." },
];

export function LandingTeamShowcase() {
  return (
    <section id="team" className="scroll-mt-24 border-t border-[#d9e8f4] bg-[#f8fbfe] py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">Who you are working with</p><h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">A small hands-on team behind the work.</h2></div><p className="max-w-xl text-lg leading-8 text-[#60778d]">Automation helps us move quickly. People research the market, shape the offer, edit the creative, watch the campaign, and explain what changes next.</p></div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">{PEOPLE.map((person) => <article key={person.name} className="group overflow-hidden rounded-2xl border border-[#c8ddec] bg-white shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,40,77,0.12)]"><div className="grid sm:grid-cols-[180px_1fr]"><div className="h-52 overflow-hidden bg-[#eef7ff] sm:h-full"><img src={person.image} alt={person.name} className="h-full w-full object-cover object-top grayscale-[15%] transition duration-500 group-hover:scale-105" /></div><div className="p-7"><p className="text-xl font-bold text-[#07284d]">{person.name}</p><p className="mt-1 text-sm font-semibold text-[#0c68c8]">{person.role}</p><p className="mt-6 text-sm leading-6 text-[#60778d]">{person.body}</p><div className="mt-7 h-1 w-10 rounded-full bg-[#ffd12d]" /></div></div></article>)}</div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#c8ddec] bg-white px-6 py-5"><p className="text-sm font-semibold text-[#07284d]">Questions before you start? Talk directly to the team.</p><div className="flex flex-wrap gap-4 text-sm font-bold"><a href="tel:+13075336678" className="inline-flex items-center gap-2 text-[#07284d] hover:text-[#0c68c8]"><Phone className="h-4 w-4" /> +1 (307) 533-6678</a><a href="mailto:hello@barakahsoft.com" className="inline-flex items-center gap-2 text-[#07284d] hover:text-[#0c68c8]"><Mail className="h-4 w-4" /> Email us <ArrowRight className="h-4 w-4" /></a></div></div>
      </div>
    </section>
  );
}
