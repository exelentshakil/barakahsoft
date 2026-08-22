"use client";

import { useEffect } from "react";

// The interaction layer for generated pages.
//
// This is reviewed application code, activated by data attributes the
// generator writes into the markup. It is deliberately NOT model-authored
// JavaScript: script on a client's public site can read cookies, exfiltrate
// form input and rewrite the DOM, and no amount of sanitising makes
// arbitrary script safe to publish under someone else's domain.
//
// The generator gets motion and interactivity by ASKING for it —
// data-reveal, data-count-to, data-accordion — which is the same trade the
// design tokens make: remove the possibility of the bad outcome rather than
// police it afterwards.
//
// Everything here degrades to a fully readable page with JavaScript off, and
// every behaviour respects prefers-reduced-motion. Content is never created
// by script, so nothing here affects what a crawler sees.

export function BespokeRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".bespoke-page");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // ---- Scroll reveal --------------------------------------------------
    // Elements start visible in CSS and are only hidden once this runs, so a
    // failure here leaves a readable page rather than an invisible one.
    const revealTargets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (revealTargets.length > 0 && !reduceMotion && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.revealDelay ?? 0);
            window.setTimeout(() => el.setAttribute("data-revealed", "true"), delay);
            observer.unobserve(el);
          }
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
      );

      revealTargets.forEach((el) => {
        el.setAttribute("data-reveal-armed", "true");
        observer.observe(el);
      });
      cleanups.push(() => observer.disconnect());
    } else {
      revealTargets.forEach((el) => el.setAttribute("data-revealed", "true"));
    }

    // ---- Counting numbers ----------------------------------------------
    // The final value is the element's own text content, so the real number
    // is in the HTML for crawlers and for anyone without script.
    const counters = root.querySelectorAll<HTMLElement>("[data-count-to]");
    if (counters.length > 0 && !reduceMotion && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            observer.unobserve(el);

            const target = Number(el.dataset.countTo);
            if (!Number.isFinite(target)) continue;

            const suffix = el.dataset.countSuffix ?? "";
            const decimals = target % 1 !== 0 ? 1 : 0;
            const duration = 1100;
            const start = performance.now();

            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              // Ease-out: fast to begin, settling at the end.
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = (target * eased).toFixed(decimals) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
    }

    // ---- Accordions -----------------------------------------------------
    // Built on <details> semantics where possible; this handles the
    // button/panel form so only one panel is open at a time.
    root.querySelectorAll<HTMLElement>("[data-accordion]").forEach((group) => {
      const items = Array.from(group.querySelectorAll<HTMLElement>("[data-accordion-item]"));

      const onClick = (event: Event) => {
        const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-accordion-trigger]");
        if (!trigger) return;
        const item = trigger.closest<HTMLElement>("[data-accordion-item]");
        if (!item) return;

        const wasOpen = item.getAttribute("data-open") === "true";
        items.forEach((other) => other.setAttribute("data-open", "false"));
        item.setAttribute("data-open", wasOpen ? "false" : "true");
        trigger.setAttribute("aria-expanded", wasOpen ? "false" : "true");
      };

      group.addEventListener("click", onClick);
      cleanups.push(() => group.removeEventListener("click", onClick));

      // First panel open, so the section never reads as an empty list.
      items.forEach((item, index) => item.setAttribute("data-open", index === 0 ? "true" : "false"));
    });

    // ---- Bar charts -----------------------------------------------------
    // Drawn from data attributes into elements that already contain their
    // own labels and values as text. No library, no external request.
    root.querySelectorAll<HTMLElement>("[data-bar]").forEach((bar) => {
      const value = Number(bar.dataset.bar);
      const max = Number(bar.dataset.barMax ?? 100);
      if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return;

      const pct = Math.max(0, Math.min(100, (value / max) * 100));
      const fill = bar.querySelector<HTMLElement>("[data-bar-fill]") ?? bar;

      if (reduceMotion) {
        fill.style.width = `${pct}%`;
        return;
      }

      fill.style.width = "0%";
      window.setTimeout(() => {
        fill.style.transition = "width 900ms cubic-bezier(0.22, 1, 0.36, 1)";
        fill.style.width = `${pct}%`;
      }, 120);
    });

    // ---- Sticky header state -------------------------------------------
    // Lets the generated page style itself differently once scrolled.
    const onScroll = () => {
      root.setAttribute("data-scrolled", window.scrollY > 40 ? "true" : "false");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
