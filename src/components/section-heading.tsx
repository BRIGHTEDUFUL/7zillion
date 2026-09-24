import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  action,
  to,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && to && (
        <Link className="text-link" to={to}>
          {action} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
