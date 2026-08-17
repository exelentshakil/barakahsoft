import { Check, ShieldCheck, Target, Workflow } from "lucide-react";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

const SYSTEM = [
  ["01", "The offer", "We turn your highest-value service into a clear reason for the right homeowner to respond."],
  ["02", "The landing page", "A focused page built for one action: submit a real request with enough detail to follow up."],
  ["03", "The creative", "Short-form ad concepts and copy that make the problem, service, and next step obvious in the feed."],
  ["04", "The follow-up", "Lead routing, response expectations, and tracking so opportunities do not disappear after the form."],
];

export function LeadEngineStory() {
  return (
    <>
      <section className="border-b border-border bg-[#f8f7fc] py-20 text-foreground lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><SectionEyebrow icon={Workflow}>What you are actually buying</SectionEyebrow><h2 className="mt-4 font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Not a website. A working path from attention to conversation.</h2></div>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">Your customer does not care what platform we use. They care whether the phone rings with people who need the work you do. That is the system we build, launch, and improve with you.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">{SYSTEM.map(([number, title, body]) => <div key={number} className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-9"><p className="text-sm font-bold text-primary">{number}</p><h3 className="mt-10 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></div>)}</div>
        </div>
      </section>

      <section className="border-b border-border py-20 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div><SectionEyebrow icon={Target}>The first 30 days</SectionEyebrow><h2 className="mt-4 font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">You get one week to judge the work. We get 30 days to prove the system.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Start at $500 per week with no long-term obligation. Your Meta budget stays in your own account. If the partnership is not right after the first week, you can stop. The landing page, creative, and campaign assets remain clearly accounted for in the written agreement.</p></div>
          <Reveal><div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-lift"><ShieldCheck className="h-8 w-8 text-primary" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">Risk reversal</p><p className="mt-3 font-sans text-3xl font-semibold tracking-tight">30 qualified leads in 30 days — or the agreed management-fee remedy applies.</p><p className="mt-5 text-sm leading-6 text-muted-foreground">Qualification, ad budget, response time, service area, and lead definition are agreed before launch. No vague “leads” promise.</p></div></Reveal>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40 py-20"><div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">{[["You own the account", "Your Meta account, pixel, billing, and lead data stay yours."], ["You see the work", "Creative, landing page, tracking, and lead flow are visible."], ["You can stop", "No long-term contract. Keep the conversation honest." ]].map(([title, body]) => <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-card"><Check className="h-5 w-5 text-primary" /><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>)}</div></section>
    </>
  );
}
