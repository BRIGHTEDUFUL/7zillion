import { Link } from "@tanstack/react-router";
import { Menu, MessageSquareText, X } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/logo";
import { navLinks } from "@/data/site";

/**
 * Shared header used by every route. It renders exactly one logo image — the
 * white knockout is a CSS filter applied to that same file, so there is no
 * second copy that can drift out of sync or appear twice.
 *
 * Its transparent / light-ink state comes from the `hero-theme-*` class on the
 * page's `<main>`; scrolling past 24px switches it to the solid state and it
 * holds that position on every page.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sticky-header state — rAF-throttled so scrolling stays smooth.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Close the menu if the viewport grows back past the breakpoint.
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 1021px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [menuOpen]);

  // While the menu is open: hold the page still and let Escape dismiss it.
  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add("is-nav-locked");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("is-nav-locked");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${menuOpen ? " is-menu-open" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="shell nav-wrap">
        <Link to="/" className="brand" aria-label="Seven Zillions home">
          <BrandLogo />
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} activeProps={{ className: "is-active" }}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link to="/contact" className="quote-button desktop-quote">
          <MessageSquareText size={15} /> Get a Quote
        </Link>

        <button
          className="mobile-menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <nav id="site-mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link to="/contact" className="mobile-nav-quote" onClick={() => setMenuOpen(false)}>
            <MessageSquareText size={15} /> Get a Quote
          </Link>
        </nav>
      )}
    </header>
  );
}
