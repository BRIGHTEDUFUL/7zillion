import logoColor from "@/assets/brand/logo-color.png";

/**
 * The brand logo component.
 *
 * Supports rendering the full authentic color logo (`variant="color"`),
 * the white knockout (`variant="white"`), or default context-aware mode (`variant="auto"`).
 */
export function BrandLogo({
  className = "",
  variant = "auto",
  alt = "Seven Zillions — Cooperation and Interdependence",
}: {
  className?: string;
  variant?: "auto" | "color" | "white";
  alt?: string;
}) {
  const variantClass =
    variant === "color" ? "brand-logo--color" : variant === "white" ? "brand-logo--light" : "";

  return (
    <img
      className={`brand-logo ${variantClass} ${className}`.trim()}
      src={logoColor}
      alt={alt}
      decoding="async"
    />
  );
}
