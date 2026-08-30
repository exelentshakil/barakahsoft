"use client";

import { useEffect } from "react";

// Behaviour for the generated site chrome.
//
// The nav is model-authored markup and the sanitizer strips <script>, so it
// cannot carry its own JavaScript — by design. It asks for behaviour with
// data attributes instead, and this reviewed component implements them:
//
//   [data-nav][data-sticky-nav]  gains data-scrolled="true" past 40px
//   [data-nav-dropdown]          wraps [data-nav-trigger] + [data-nav-panel]
//   [data-nav-toggle]            opens [data-nav-drawer]; [data-nav-close] shuts it
//
// It lives here rather than in BespokeRuntime because the chrome renders on
// every route, including inner pages whose body is a React template and which
// therefore never mount the page runtime.
//
// Everything degrades correctly with JavaScript off: the closed state is CSS,
// and every destination in the drawer is a real link that is reachable in the
// bar as well.
export function BespokeChromeRuntime() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (!nav) return;

    const cleanups: (() => void)[] = [];
    const dropdowns = Array.from(nav.querySelectorAll<HTMLElement>("[data-nav-dropdown]"));
    const drawer = document.querySelector<HTMLElement>("[data-nav-drawer]");

    const setDropdown = (dropdown: HTMLElement, open: boolean) => {
      dropdown.setAttribute("data-open", open ? "true" : "false");
      dropdown.querySelector("[data-nav-panel]")?.setAttribute("data-open", open ? "true" : "false");
      dropdown.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", open ? "true" : "false");
    };
    const closeAll = () => dropdowns.forEach((dropdown) => setDropdown(dropdown, false));
    closeAll();

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const trigger = target.closest<HTMLElement>("[data-nav-trigger]");
      if (trigger) {
        const dropdown = trigger.closest<HTMLElement>("[data-nav-dropdown]");
        if (dropdown) {
          const wasOpen = dropdown.getAttribute("data-open") === "true";
          closeAll();
          setDropdown(dropdown, !wasOpen);
          event.preventDefault();
          return;
        }
      }

      if (target.closest("[data-nav-toggle]")) {
        const open = drawer?.getAttribute("data-open") !== "true";
        drawer?.setAttribute("data-open", open ? "true" : "false");
        document.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.style.overflow = open ? "hidden" : "";
        return;
      }

      if (target.closest("[data-nav-close]") || (drawer && target.closest("[data-nav-drawer] a"))) {
        drawer?.setAttribute("data-open", "false");
        document.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        return;
      }

      // A click anywhere outside an open panel closes it. Without this a mega
      // menu opened by accident covers the page with no way back.
      if (!target.closest("[data-nav-panel]")) closeAll();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeAll();
      drawer?.setAttribute("data-open", "false");
      document.body.style.overflow = "";
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    cleanups.push(() => document.removeEventListener("click", onClick));
    cleanups.push(() => document.removeEventListener("keydown", onKey));

    if (nav.hasAttribute("data-sticky-nav")) {
      const onScroll = () => nav.setAttribute("data-scrolled", window.scrollY > 40 ? "true" : "false");
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    return () => {
      document.body.style.overflow = "";
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
