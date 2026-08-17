import { Eye, BriefcaseBusiness, Clapperboard, LockKeyhole, Megaphone, Route, ShieldCheck, Target, Workflow } from "lucide-react";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";

const SYSTEM = [
  ["01", "The offer", "We turn your highest-value service into a clear reason for the right homeowner to respond.", BriefcaseBusiness],
  ["02", "The landing page", "A focused page built for one action: submit a real request with enough detail to follow up.", Route],
  ["03", "The creative", "Short-form ad concepts and copy that make the problem, service, and next step obvious in the feed.", Clapperboard],
  ["04", "The follow-up", "Lead routing, response expectations, and tracking so opportunities do not disappear after the form.", Megaphone],
] as const;

const TRUST = [
  [LockKeyhole, "Ownership", "You own the Meta account, pixel, billing, audience, and lead data.", "Nothing is trapped inside our agency."],
  [Eye, "Visibility", "You can see the landing page, creative, campaign, tracking, and lead flow.", "No black-box reporting."],
  [ShieldCheck, "Low risk", "Start for one week and decide whether the working relationship is right.", "No long-term obligation."],
] as const;

export function LeadEngineStory() {
  return (
    <>
      <section className="border-b border-border bg-[#f8f7fc] py-20 text-foreground lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><SectionEyebrow icon={Workflow} align="left">What you are actually buying</SectionEyebrow><h2 className="mt-4 font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Not a website. A working path from attention to conversation.</h2></div>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">Your customer does not care what platform we use. They care whether the phone rings with people who need the work you do. That is the system we build, launch, and improve with you.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">{SYSTEM.map(([number, title, body, Icon]) => <div key={number} className="group rounded-2xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:shadow-lift sm:p-9"><div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"><Icon className="h-6 w-6" strokeWidth={1.7} /></div><p className="text-sm font-bold text-primary">{number}</p></div><h3 className="mt-10 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p><div className="mt-7 h-1 w-10 rounded-full bg-primary/20 transition-all group-hover:w-16 group-hover:bg-primary" /></div>)}</div>
        </div>
      </section>

      <section className="border-b border-border py-20 lg:py-24">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div><SectionEyebrow icon={Target}>The first 30 days</SectionEyebrow><h2 className="mt-4 font-sans text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">You get one week to judge the work. We get 30 days to prove the system.</h2><p className="mt-6 text-lg leading-8 text-muted-foreground">Start at $500 per week with no long-term obligation. Your Meta budget stays in your own account. If the partnership is not right after the first week, you can stop. The landing page, creative, and campaign assets remain clearly accounted for in the written agreement.</p></div>
          <Reveal><div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-lift"><ShieldCheck className="h-8 w-8 text-primary" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">Risk reversal</p><p className="mt-3 font-sans text-3xl font-semibold tracking-tight">30 qualified leads in 30 days — or the agreed management-fee remedy applies.</p><p className="mt-5 text-sm leading-6 text-muted-foreground">Qualification, ad budget, response time, service area, and lead definition are agreed before launch. No vague “leads” promise.</p></div></Reveal>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40 py-16 lg:py-20"><div className="mx-auto max-w-5xl px-6"><div className="mb-8 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The relationship</p><h2 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.03em]">Clear ownership. Visible work. A fair way to start.</h2></div><div className="grid gap-4 md:grid-cols-3">{TRUST.map(([Icon, title, body, note]) => <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift"><div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"><Icon className="h-6 w-6" strokeWidth={1.7} /></div><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span></div><h3 className="mt-8 text-lg font-semibold">{body}</h3><p className="mt-3 text-sm font-medium text-primary">{note}</p></div>)}</div></div></section>
    </>
  );
}
