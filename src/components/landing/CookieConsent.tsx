"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Settings, X, Check, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "barakahsoft-cookie-consent-v2";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function CookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);

  // Customise toggle states
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [marketingAllowed, setMarketingAllowed] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences(parsed);
        setAnalyticsAllowed(parsed.analytics ?? true);
        setMarketingAllowed(parsed.marketing ?? true);
        applyConsent(parsed);
      }
    } catch {
      // Ignore parse errors, treat as not set
    }
    setHydrated(true);
  }, []);

  function applyConsent(prefs: CookiePreferences) {
    if (typeof window === "undefined") return;

    // Meta Pixel Consent Mode
    if (window.fbq) {
      if (prefs.marketing) {
        window.fbq("consent", "grant");
      } else {
        window.fbq("consent", "revoke");
      }
    }

    // Microsoft Clarity Consent
    if (window.clarity) {
      if (prefs.analytics) {
        window.clarity("consent");
      }
    }

    // Notify any custom listeners
    window.dispatchEvent(new CustomEvent("barakahsoft_cookie_consent", { detail: prefs }));
  }

  function saveDecision(analytics: boolean, marketing: boolean) {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable
    }
    setPreferences(prefs);
    setShowCustomise(false);
    applyConsent(prefs);
  }

  function handleAcceptAll() {
    saveDecision(true, true);
  }

  function handleRejectAll() {
    saveDecision(false, false);
  }

  function handleSaveCustom() {
    saveDecision(analyticsAllowed, marketingAllowed);
  }

  if (!hydrated) return null;

  return (
    <>
      {/* 1. Main Floating Privacy Banner */}
      {!preferences && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie Privacy Consent"
          className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5 flex justify-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    We value your privacy
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.{" "}
                    <Link
                      href="/privacy-policy"
                      className="font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Cookie Policy
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomise(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Customise
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Reject All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="text-xs font-bold bg-[#533afd] hover:bg-[#432ec4] text-white shadow-sm"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customise Preferences Modal */}
      {showCustomise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Cookie &amp; Privacy Preferences
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomise(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Essential / Necessary */}
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Necessary Cookies</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Always Active
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Essential for website security, form verification, navigation, and core functionality.
                  </p>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Analytics Cookies</span>
                    <span className="text-[10px] font-medium text-slate-400">(Microsoft Clarity)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Helps us understand user navigation, heatmap interactions, and improve page speed and layout.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={analyticsAllowed}
                    onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-indigo-600 peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                </label>
              </div>

              {/* Marketing & Ads */}
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">Marketing &amp; Advertising Cookies</span>
                    <span className="text-[10px] font-medium text-slate-400">(Meta Pixel)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Used to measure conversion performance from Facebook/Instagram ads and deliver relevant offers.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={marketingAllowed}
                    onChange={(e) => setMarketingAllowed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-300 peer-checked:bg-indigo-600 peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-slate-700"></div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="text-xs font-semibold"
              >
                Reject All
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveCustom}
                className="text-xs font-semibold"
              >
                Save Preferences
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs font-bold bg-[#533afd] hover:bg-[#432ec4] text-white"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Discreet Cookie Preferences Revisit Button in bottom-left */}
      {preferences && (
        <button
          type="button"
          onClick={() => setShowCustomise(true)}
          aria-label="Manage Cookie Preferences"
          className="fixed bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-md backdrop-blur-xs transition hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:text-white"
        >
          <Cookie className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          <span>Cookies</span>
        </button>
      )}
    </>
  );
}
