import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string };

/** Home › Products › detail — the hierarchy the sitemap is built on. */
export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  if (items.length === 0) return null;
  const last = items.length - 1;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label}>
            <ChevronRight size={13} aria-hidden="true" />
            {index < last && item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
