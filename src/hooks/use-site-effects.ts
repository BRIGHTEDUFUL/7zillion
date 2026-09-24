import { useEffect } from "react";

/**
 * Whole-page reveals: every section below the hero fades and de-blurs in as it
 * enters the viewport, with an 85ms stagger across its direct children.
 *
 * Shared by the home page and every internal page so the motion language stays
 * identical across the site. Honours `prefers-reduced-motion` through CSS.
 */
export function useSectionReveal() {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("main > section:not(.hero), main > footer"),
    );
    if (targets.length === 0) return;

    targets.forEach((target) => {
      target.setAttribute("data-reveal", "");
      Array.from(target.children).forEach((child, index) => {
        child.setAttribute("data-reveal-item", "");
        (child as HTMLElement).style.setProperty("--reveal-delay", `${Math.min(index, 5) * 85}ms`);
      });
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
}

/**
 * Entrance gate: nothing animates until two frames have actually painted.
 * rAF is throttled (or paused outright) in a background tab, so a timer opens
 * the gate as a fallback — an invisible header would be unrecoverable.
 *
 * Runs once from the root layout so internal pages get the same entrance.
 */
export function useEntranceGate() {
  useEffect(() => {
    let settled = false;
    let inner = 0;
    const open = () => {
      if (settled) return;
      settled = true;
      document.documentElement.classList.add("is-ready");
    };
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(open);
    });
    const safety = window.setTimeout(open, 1500);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      window.clearTimeout(safety);
    };
  }, []);
}
