"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";

// Queens 7x7 grid points simplified for visual understanding
const MAP_POINTS = Array.from({ length: 49 }, (_, i) => ({
  id: i + 1,
  visible: i < 10,
  outside: i >= 10 && i < 20,
}));

export function ClientPortalPrototype() {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#0d1738]">
      {/* 1. CLEAN HEADER */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="BarakahSoft" className="h-7 w-auto" />
            <span className="hidden text-xs font-semibold text-[#777588] sm:inline">
              · York Electrical Proposal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#eaf8f0] px-3 py-1 text-xs font-bold text-[#0b8f5b] sm:inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Concept Ready
            </span>
            <a
              href="tel:+13075336678"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d1738] hover:text-[#533afd]"
            >
              <Phone className="h-3.5 w-3.5 text-[#533afd]" />
              <span>(307) 533-6678</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 space-y-12">
        {/* 2. HERO STORY */}
        <section className="rounded-2xl border border-[#c7d0fb] bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#533afd] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              Your Free Redesign Is Ready
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0d1738] sm:text-5xl">
            York Electrical Contractors
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#42506a] sm:text-lg">
            We reviewed your website, your 37-year history in NYC, and your 450+ 5-star Google reviews. We rebuilt your homepage to make sure customers call you instead of checking your competitors.
          </p>

          {/* Big Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/s/york-electrical"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#533afd] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#432bd9]"
            >
              Open New Homepage Preview <ExternalLink className="h-4 w-4" />
            </a>
            <button
              onClick={() => setShowCheckout(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[#0b8f5b] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#09744a]"
            >
              Launch Complete Website ($797) <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Simple 3-Step Timeline */}
          <div className="mt-10 border-t border-[#e5e7f2] pt-6">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-[#f0f3ff] p-3">
                <span className="font-bold text-[#533afd]">Step 1: Done ✓</span>
                <p className="mt-1 text-[#0d1738] font-semibold">Free Redesign Built</p>
              </div>
              <div className="rounded-lg border-2 border-[#533afd] bg-white p-3 shadow-sm">
                <span className="font-bold text-[#533afd]">Step 2: Current</span>
                <p className="mt-1 text-[#0d1738] font-semibold">You Review the Work</p>
              </div>
              <div className="rounded-lg bg-[#f9f9ff] p-3 text-[#777588]">
                <span className="font-bold">Step 3: Next</span>
                <p className="mt-1 font-semibold">Launch & Get More Calls</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THE 3 BIG PROBLEMS WE FIXED */}
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
              The 3 Big Changes
            </span>
            <h2 className="mt-1 text-2xl font-bold text-[#0d1738] sm:text-3xl">
              Why Your Old Site Was Losing Calls & How We Fixed It
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Fix 1 */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#0d1738]">
                  1. Phone Number Was Hard to Find on Mobile
                </h3>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-2.5 text-[#ba1a1a]">
                    <strong>Old Site:</strong> Users had to zoom in and hunt through menus to find your phone number.
                  </p>
                  <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-2.5 text-[#0b8f5b]">
                    <strong>New Site:</strong> Big, sticky "Call (718) 353-7227" button right at the top of every mobile screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Fix 2 */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                  <Star className="h-5 w-5 fill-[#ffd12d] text-[#ffd12d]" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#0d1738]">
                  2. 450+ Reviews & NYC License Were Buried
                </h3>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-2.5 text-[#ba1a1a]">
                    <strong>Old Site:</strong> Your 37 years of experience and 5-star rating were hidden at the bottom.
                  </p>
                  <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-2.5 text-[#0b8f5b]">
                    <strong>New Site:</strong> Verified 5.0 Google badge & Master Lic. #11288 front-and-center.
                  </p>
                </div>
              </div>
            </div>

            {/* Fix 3 */}
            <div className="flex flex-col justify-between rounded-xl border border-[#e5e7f2] bg-white p-6 shadow-sm">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f3ff] text-[#533afd]">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#0d1738]">
                  3. Big Jobs Were Lumped into 1 Generic List
                </h3>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="rounded bg-[#fff8f8] border border-[#ffdad6] p-2.5 text-[#ba1a1a]">
                    <strong>Old Site:</strong> EV Chargers, Panel Upgrades, and DOB Violations were in one paragraph.
                  </p>
                  <p className="rounded bg-[#f0fcf4] border border-[#c8ead8] p-2.5 text-[#0b8f5b]">
                    <strong>New Site:</strong> Dedicated pages for every service so customers find you on Google.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. WHERE YOU RANK ON GOOGLE (QUEENS MAP) */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Where You Rank on Google
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                Queens Local Search Visibility
              </h2>
              <p className="mt-1 text-sm text-[#42506a]">
                We checked 49 neighborhoods across Queens for "licensed electrician near me".
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#533afd]">
                <span className="h-3 w-3 rounded-full bg-[#533afd]" /> You Rank #1–3 (Flushing/Bayside)
              </span>
              <span className="flex items-center gap-1.5 text-[#ba1a1a]">
                <span className="h-3 w-3 rounded-full bg-[#ffdad6]" /> Missing (39 Areas)
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            {/* Visual Grid */}
            <div className="rounded-xl border border-[#e5e7f2] bg-[#f9f9ff] p-5">
              <div className="grid grid-cols-7 gap-2">
                {MAP_POINTS.map((pt) => (
                  <div
                    key={pt.id}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
                      pt.visible
                        ? "bg-[#533afd] text-white"
                        : pt.outside
                        ? "bg-[#ffe086] text-[#231b00]"
                        : "bg-[#ffdad6] text-[#ba1a1a]"
                    }`}
                  >
                    {pt.visible ? "✓" : pt.id}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-[#777588]">
                Each box is a Queens neighborhood (Astoria, Long Island City, Forest Hills, Jamaica, etc.)
              </p>
            </div>

            {/* Plain English Explanation */}
            <div className="space-y-4 rounded-xl bg-[#f0f3ff] p-6 text-xs sm:text-sm">
              <p className="font-bold text-[#0d1738]">What this means for your business:</p>
              <p className="text-[#42506a] leading-relaxed">
                When homeowners in <strong>Flushing and Bayside</strong> search for an electrician, you show up at the top. But in <strong>Astoria, Long Island City, and Forest Hills</strong>, competitors are taking those calls because your old site didn't mention those areas.
              </p>
              <p className="text-[#0b8f5b] font-bold">
                ✓ The new website adds dedicated pages for all your services across Queens to capture those calls.
              </p>
            </div>
          </div>
        </section>

        {/* 5. WHAT'S INCLUDED IN THE $797 PACKAGE */}
        <section className="rounded-2xl border border-[#e5e7f2] bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end border-b border-[#e5e7f2] pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#533afd]">
                Complete Package
              </span>
              <h2 className="mt-1 text-2xl font-bold text-[#0d1738]">
                Everything Included in Your New Website
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl font-bold text-[#0d1738]">$797</span>
              <span className="text-xs text-[#777588] block">Flat one-time price · You own everything</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            {[
              "Custom Modern Homepage built with your real logo, photos, and colors",
              "28 Dedicated Pages for all your real services (Panel Upgrades, EV Chargers, etc.)",
              "8 Helpful Articles written for Queens homeowners so your site is never blank",
              "Opens in 0.12s on any phone with 1-tap call & estimate buttons",
              "Connected to your domain (yorkelectrical.com) with SSL security",
              "You own 100% of the website files (zero monthly hostage fees)",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-[#e5e7f2] p-4 bg-[#f9f9ff]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0b8f5b] mt-0.5" />
                <span className="font-semibold text-[#0d1738]">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. BIG CLEAR DECISION BOX */}
        <section className="rounded-2xl bg-[#0d1738] p-8 sm:p-10 text-white shadow-lg text-center space-y-6">
          <span className="rounded-full bg-[#533afd] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Ready to Launch?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Launch Your New Website in 48 Hours
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            No long contracts, no monthly hostage fees. We connect your domain, set up the full 28 pages, and make sure your phone starts ringing.
          </p>

          <div className="pt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-[#533afd] px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-[#432bd9]"
            >
              Approve & Launch My Website ($797) <ArrowRight className="h-5 w-5" />
            </button>
            <a
              href="tel:+13075336678"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <PhoneCall className="h-4 w-4" /> Call Us with Questions
            </a>
          </div>

          <p className="text-xs text-white/50">
            Backed by our satisfaction review. You only launch if you love the build.
          </p>
        </section>

        {/* Checkout Modal Simulation */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-[#0d1738] border border-[#e5e7f2]">
              <div className="flex items-center justify-between border-b border-[#e5e7f2] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0d1738]">Launch York Electrical Website</h3>
                  <p className="text-xs text-[#777588]">One-time flat build payment · Zero recurring lock-in</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="rounded-md p-1.5 text-sm font-bold text-[#777588] hover:bg-[#f0f3ff] hover:text-[#0d1738]"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-xl bg-[#f0f3ff] p-5 text-xs space-y-3 border border-[#c7d0fb]">
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Scope of Work</span>
                  <span className="font-bold text-[#0d1738]">28 Service Pages + 8 Launch Articles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Domain Setup</span>
                  <span className="font-bold text-[#0d1738]">yorkelectrical.com (SSL & DNS Included)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Delivery Time</span>
                  <span className="font-bold text-[#0b8f5b]">48 Hours to Official Go-Live</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#777588] font-semibold">Ownership</span>
                  <span className="font-bold text-[#0d1738]">100% You Own All Files</span>
                </div>
                <div className="flex justify-between items-center border-t border-[#c7d0fb] pt-3 text-sm">
                  <span className="font-bold text-[#0d1738]">Total Due Today</span>
                  <span className="text-xl font-bold text-[#533afd]">$797.00 USD</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => alert("Directing to secure Stripe Checkout for York Electrical ($797.00 USD)...")}
                  className="w-full rounded-md bg-[#533afd] py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#432bd9]"
                >
                  Pay $797 via Card / Apple Pay
                </button>
                <p className="text-center text-[11px] text-[#777588]">
                  🔒 256-bit encrypted checkout via Stripe · Verified BarakahSoft LLC
                </p>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full text-center text-xs font-semibold text-[#777588] hover:text-[#0d1738] pt-1"
                >
                  Cancel and review website preview
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7f2] bg-white py-8 text-center text-xs text-[#777588]">
        <p>© 2026 BarakahSoft LLC · Direct line: +1 (307) 533-6678 · hello@barakahsoft.com</p>
      </footer>
    </div>
  );
}
