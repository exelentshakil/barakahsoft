import { Users } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

const TEAM = [
  {
    name: "Shakil Ahmed",
    title: "Founder, BarakahSoft",
    photo: "https://barakahsoft.com/wp-content/uploads/2026/07/Shak-Headshot-Medium.jpeg",
    quote:
      "There are a lot of business owners who lose sales every hour their site is down, and no one picks up the phone. That's why I started BarakahSoft, to be the person who actually answers.",
  },
  {
    name: "Jim Sabellico",
    title: "Client Relations, BarakahSoft",
    photo: "https://barakahsoft.com/wp-content/uploads/2026/07/Jim-Headshot-Medium.jpeg",
    quote:
      "Every client of ours gets a real person on the other end, not a support ticket. That's the whole reason I make sure someone always answers within minutes.",
  },
];

// Real people, real quotes — the direct answer to "is this just an AI
// black box." Same headshots and verbatim quotes already live on
// barakahsoft.com.
export function Team() {
  return (
    <section id="team" className="border-t border-border bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow icon={Users}>Who you are hiring</SectionEyebrow>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">A small hands-on team built for execution.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">The system is automated where it should be. The judgment is not. We research the market, shape the offer, edit the creative, watch the campaign, and improve what the data tells us.</p>
        </div>
        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2">
          {TEAM.map((member, i) => (
            <RevealItem key={member.name} index={i}>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-card">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.photo} alt={member.name} className="h-14 w-14 rounded-full object-cover shadow-lift" />
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.title}</p>
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-300">&ldquo;{member.quote}&rdquo;</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
