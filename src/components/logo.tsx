import logoColor from "@/assets/brand/logo-color.png";

/**
 * The single logo image used everywhere on the site.
 *
 * There is deliberately only one asset: `logo-white.png` used to be a second
 * copy rendered alongside it and hidden with CSS, which meant both could show
 * at once if a selector lost the specificity battle. The white knockout is now
 * produced from this same file with `filter: brightness(0) invert(1)`, which
 * reproduces the old asset exactly (identical alpha shape, 1058x371).
 */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      className={`brand-logo${className ? ` ${className}` : ""}`}
      src={logoColor}
      alt="Seven Zillions — Cooperation and Interdependence"
      decoding="async"
    />
  );
}
