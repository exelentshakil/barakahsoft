import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Eye,
  FileText,
  Megaphone,
  Rocket,
  ShieldCheck,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { Footer } from "@/components/landing/Footer";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { Nav } from "@/components/landing/Nav";
import { IndustryShowcase } from "@/components/landing/IndustryShowcase";
import { LandingTeamShowcase } from "@/components/landing/LandingTeamShowcase";
import { IndustryCoverage } from "@/components/landing/IndustryCoverage";
import { CrispChat } from "@/components/CrispChat";
import landing from "../../../content/landing.json";

const NAVY = "#07284D";
const YELLOW = "#FFD12D";

const SYSTEM = [
  {
    icon: Target,
    number: "01",
    title: "Audit the current website",
    body: "We identify evidenced mobile, conversion, content, and visibility problems.",
  },
  {
    icon: FileText,
    number: "02",
    title: "Benchmark the quality bar",
    body: "We study the strongest category examples before choosing the redesign direction.",
  },
  {
    icon: Megaphone,
    number: "03",
    title: "Design the homepage concept",
    body: "We use your real logo, colours, services, facts, and best usable images.",
  },
  {
    icon: Workflow,
    number: "04",
    title: "Deliver the preview and audit",
    body: "You see what was wrong, what changed, and whether the direction is worth continuing.",
  },
];

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
      {children}
    </p>
  );
}

export function LeadEngineLanding() {
  const brandStyle = {
    "--primary": "213 83% 16%",
    "--ring": "213 83% 16%",
    "--primary-h": "213",
    "--primary-s": "83%",
    "--primary-l": "16%",
    "--brand-gold": "47 100% 59%",
  } as React.CSSProperties;

  return (
    <main id="top" style={brandStyle} className="bg-white text-[#1e212b]">
      <Nav />

      <section className="relative overflow-hidden border-b border-[#d9e8f4] bg-white">
        <div
          className="absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#e5f4ff] blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgba(7,40,77,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(7,40,77,0.045)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute left-[9%] top-32 hidden h-3 w-3 rounded-full bg-[#ffd12d] shadow-[0_0_0_8px_rgba(255,209,45,0.14)] lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[12%] top-52 hidden h-2 w-2 rounded-full bg-[#0c68c8] shadow-[0_0_0_7px_rgba(12,104,200,0.12)] lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-28 left-[16%] hidden h-2 w-2 rounded-full bg-[#702486] shadow-[0_0_0_7px_rgba(112,36,134,0.1)] lg:block" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto mb-6 w-fit rounded-full bg-[#e8f4ff] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#075da8]">
              Free homepage redesign
            </p>
            <h1 className="font-sans text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#07284d] sm:text-7xl">
              Get your homepage redesigned for free.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#5c7186]">
              See exactly how your homepage could look. We&apos;ll create a custom
              concept around your real business and deliver it for review in 48 hours.
            </p>
            <div className="mt-9">
              <RedesignIntakeFlow />
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-[#c8ddec] bg-[#f6fbff] shadow-[0_20px_60px_rgba(7,40,77,0.12)]">
            <div className="relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="aspect-[2/1] w-full object-cover"
              >
                <source
                  src="https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4"
                  type="video/mp4"
                />
              </video>
              <span className="absolute left-5 top-5 rounded-md bg-[#07284d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                The industries we serve
              </span>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#c8ddec] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-[#07284d]">
                   A custom homepage concept
                </p>
                <p className="mt-1 text-sm text-[#71869a]">
                   Researched, designed, and reviewed by our team around your business.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
                Research · Build · Manage
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] bg-[#07284d] py-7 text-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 sm:grid-cols-3">
          <div className="border-white/20 sm:border-r sm:pr-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              Free first step
            </p>
            <p className="mt-2 font-semibold">
              Premium homepage concept
            </p>
          </div>
          <div className="border-white/20 sm:border-r sm:pr-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              What you receive
            </p>
            <p className="mt-2 font-semibold">
              Redesign + evidenced audit
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
              Your decision
            </p>
            <p className="mt-2 font-semibold">
              Continue only if you value it
            </p>
          </div>
        </div>
      </section>

      <section className="landing-grid-surface border-b border-[#d9e8f4] py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <Kicker>Why start with the homepage?</Kicker>
              <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
                You should see the direction before you hire anyone.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#60778d]">
              Your website is often the first place a customer decides whether
              to trust you. We make that first impression easier to judge before
              you commit to a larger project.
            </p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              [
                "The visual gap",
                "The site works, but looks weaker than the businesses customers already trust.",
              ],
              [
                "The mobile gap",
                "The message, services, and contact path become harder to use on a phone.",
              ],
              [
                "The visibility gap",
                "Weak structure, thin service coverage, and unclear answers limit search visibility.",
              ],
            ].map(([title, body], index) => (
              <div
                key={title}
                className="rounded-xl border border-[#c8ddec] bg-[#f8fbfe] p-6"
              >
                <p className="text-4xl font-semibold tracking-tight text-[#b8d8ef]">
                  0{index + 1}
                </p>
                <h3 className="mt-8 text-lg font-bold text-[#07284d]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#657c90]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b border-[#d9e8f4] bg-[#eef7ff] py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <Kicker>What we actually do</Kicker>
            <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
              A free redesign, built by people who look at the details.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#60778d]">
              We use modern tools to move quickly, but the research, judgment,
              editing, and final review stay with our team.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {SYSTEM.map(({ icon: Icon, number, title, body }) => (
              <div
                key={number}
                className="group rounded-2xl border border-[#c8ddec] bg-white p-7 shadow-[0_8px_24px_rgba(7,40,77,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,40,77,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7c7] text-[#07284d]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-[#0c68c8]">
                    {number}
                  </span>
                </div>
                <h3 className="mt-9 text-xl font-bold text-[#07284d]">
                  {title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#657c90]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-grid-surface border-b border-[#d9e8f4] py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Kicker>What you receive</Kicker>
            <h2 className="font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#07284d] sm:text-5xl">
              Something useful, not another sales pitch.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#60778d]">
              You receive a clear homepage direction and an honest explanation
              of what could improve on the current site.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Evidence from the current website.",
                "A human-reviewed homepage concept.",
                "A clear next step only if you want one.",
              ].map((line) => (
                <p
                  key={line}
                  className="flex items-center gap-3 text-sm font-semibold text-[#07284d]"
                >
                  <Check className="h-5 w-5 text-[#0c68c8]" />
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-7 max-w-xl text-sm leading-6 text-[#657c90]">
              If you decide to continue, we can carry over useful existing blog
              posts or create 8-10 original launch posts so the finished website
              has useful depth from day one.
            </p>
          </div>
          <div className="rounded-2xl border border-[#c8ddec] bg-white p-5 shadow-[0_20px_60px_rgba(7,40,77,0.1)]">
            <div className="flex items-center justify-between border-b border-[#e2edf5] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0c68c8]">
                  Illustrative delivery view
                </p>
                <p className="mt-1 font-bold text-[#07284d]">
                  Your redesign report
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-[#0c68c8]" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["Audit", "Evidence", Target],
                ["Homepage", "Mockup", CircleDollarSign],
                ["Review", "Human", Eye],
              ].map(([label, value, Icon]) => (
                <div
                  key={label as string}
                  className="rounded-xl bg-[#eef7ff] p-4"
                >
                  <Icon className="h-5 w-5 text-[#0c68c8]" />
                  <p className="mt-5 text-xl font-bold text-[#07284d]">
                    {value as string}
                  </p>
                  <p className="mt-1 text-xs text-[#657c90]">
                    {label as string}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[#e2edf5] p-4">
              <div className="flex items-center justify-between border-b border-[#e2edf5] pb-3 text-xs font-bold uppercase tracking-wider text-[#71869a]">
                <span>What we watch</span>
                <span>Status</span>
              </div>
              {[
                  "Mobile clarity",
                  "Service messaging",
                  "Trust signals",
                  "Contact path",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between border-b border-[#eef3f7] py-3 text-sm"
                >
                  <span className="font-semibold text-[#07284d]">{item}</span>
                  <span className="text-xs font-bold text-emerald-700">
                    Reviewing
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#71869a]">
              Illustrative preview of a homepage audit. The final report reflects
              your business, current website, and selected design direction.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e8f4] bg-[#07284d] py-12 text-white lg:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <Kicker>A clear exchange</Kicker>
              <h2 className="max-w-lg font-sans text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                You share the business. We show what better could look like.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "You provide",
                  "Your current website, selected pain points, and the contact details needed to deliver the concept.",
                ],
                [
                  "We provide",
                  "A homepage concept, website audit, category benchmark, and a clear explanation of what changed.",
                ],
                [
                  "The concept",
                  "Free. No card, no deposit, and no obligation to continue.",
                ],
                [
                  "You decide",
                  "Use the direction, ask a question, or simply walk away.",
                ],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/15 bg-white/5 p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffd12d]">
                    {title}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-slate-200">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-200">Ready to see a better direction before you spend anything?</p><a href="#top" className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#ffd12d] px-5 py-3 text-sm font-bold text-[#111] transition hover:bg-[#f5c400]">Get my free redesign <ArrowRight className="h-4 w-4" /></a></div>
        </div>
      </section>

      <LandingTeamShowcase />
      <IndustryShowcase />
      <IndustryCoverage />
      <FAQAccordion />
      <section className="border-t border-[#d9e8f4] bg-[#eef7ff] py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <Kicker>Start with the first impression</Kicker>
          <h2 className="font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d] sm:text-6xl">
            See what your business could look like.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#60778d]">
            Send us your website. We&apos;ll review it and create a free homepage
            direction worth talking about.
          </p>
          <div className="mt-8 flex justify-center">
            <RedesignIntakeFlow />
          </div>
        </div>
      </section>
      <Footer />
      <CrispChat />
    </main>
  );
}
