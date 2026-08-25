"use client";

import { useEffect } from "react";
import { useQuoteModal } from "@/components/site-shell/QuoteModalProvider";

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

export function BespokeRuntime({ leadSlug }: { leadSlug: string }) {
  const openQuoteModal = useQuoteModal();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".bespoke-page");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // ---- Lead-capture trigger --------------------------------------------
    // The generator marks a repeat CTA with this attribute instead of
    // writing a real form: the actual form, validation and email delivery
    // already exist (QuoteRequestModal), and generated markup cannot call a
    // React hook to open it. This is the one bridge between the two.
    const onQuoteClick = (event: Event) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-open-quote-modal]");
      if (!trigger) return;
      event.preventDefault();
      openQuoteModal();
    };
    root.addEventListener("click", onQuoteClick);
    cleanups.push(() => root.removeEventListener("click", onQuoteClick));

    // ---- Real inline lead form -------------------------------------------
    // The generator writes the fields (name/phone/email/service) and a
    // status element; this submits them to the same real, email-delivering
    // endpoint the quote modal uses, and reflects submitting/success/error
    // back onto the form and its status element via data-state, which the
    // stylesheet pass was told to style. A native submit is never allowed
    // to fire — that would be a bare GET/reload to nowhere.
    const forms = root.querySelectorAll<HTMLFormElement>("[data-lead-form]");
    const formCleanups: (() => void)[] = [];
    forms.forEach((form) => {
      const message = form.querySelector<HTMLElement>("[data-lead-form-message]");
      const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');

      const onSubmit = async (event: Event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = String(data.get("name") ?? "").trim();
        const phone = String(data.get("phone") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        const service = String(data.get("service") ?? "").trim();

        if (!name || (!phone && !email)) {
          form.setAttribute("data-state", "error");
          if (message) message.textContent = "Please add your name and a phone number or email.";
          return;
        }

        form.setAttribute("data-state", "submitting");
        if (submitButton) submitButton.disabled = true;
        if (message) message.textContent = "Sending...";

        try {
          const res = await fetch(`/api/s/${leadSlug}/quote-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, email, service }),
          });
          const result = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(result.error || "Something went wrong — please try again or call directly.");
          form.setAttribute("data-state", "success");
          if (message) message.textContent = "Thanks — we'll be in touch shortly.";
        } catch (err) {
          form.setAttribute("data-state", "error");
          if (message) message.textContent = err instanceof Error ? err.message : "Something went wrong — please try again.";
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      };

      form.setAttribute("data-state", "idle");
      form.addEventListener("submit", onSubmit);
      formCleanups.push(() => form.removeEventListener("submit", onSubmit));
    });
    cleanups.push(() => formCleanups.forEach((fn) => fn()));

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
            window.setTimeout(() => {
              el.setAttribute("data-revealed", "true");
              el.classList.add("is-revealed");
            }, delay);
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
      revealTargets.forEach((el) => {
        el.setAttribute("data-revealed", "true");
        el.classList.add("is-revealed");
      });
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

    // ---- Review sliders -------------------------------------------------
    // All quotes remain in the document and the track remains swipeable when
    // script is off. These controls only add predictable previous/next steps.
    root.querySelectorAll<HTMLElement>("[data-review-slider]").forEach((slider) => {
      const track = slider.querySelector<HTMLElement>("[data-review-track]");
      if (!track) return;
      const move = (direction: number) => {
        const card = track.firstElementChild as HTMLElement | null;
        track.scrollBy({ left: direction * (card?.offsetWidth ?? track.clientWidth), behavior: reduceMotion ? "auto" : "smooth" });
      };
      const onClick = (event: Event) => {
        if ((event.target as HTMLElement).closest("[data-review-prev]")) move(-1);
        if ((event.target as HTMLElement).closest("[data-review-next]")) move(1);
      };
      slider.addEventListener("click", onClick);
      cleanups.push(() => slider.removeEventListener("click", onClick));
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
  }, [leadSlug, openQuoteModal]);

  return null;
}
