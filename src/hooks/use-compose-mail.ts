import { company } from "@/data/site";
import { type FormEvent, type FormEventHandler } from "react";

type Fields = {
  name?: string;
  email?: string;
  phone?: string;
  requirements?: string;
};

function read(form: HTMLFormElement): Fields {
  const data = new FormData(form);
  const get = (key: string) => String(data.get(key) ?? "").trim();
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    requirements: get("requirements"),
  };
}

/**
 * There is no form backend on this project, so the quote form composes a
 * properly addressed email instead of silently discarding the visitor's
 * message. Swap this hook for a POST when an endpoint exists.
 */
export function useComposeMail(): FormEventHandler<HTMLFormElement> {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { name, email, phone, requirements } = read(form);

    const lines = [
      name && `Name: ${name}`,
      email && `Email: ${email}`,
      phone && `Phone / WhatsApp: ${phone}`,
      "",
      "Requirements:",
      requirements,
    ].filter((line) => line !== undefined);

    const subject = encodeURIComponent(`Line proposal request${name ? ` — ${name}` : ""}`);
    const body = encodeURIComponent(lines.join("\n"));

    window.location.href = `mailto:${company.email}?subject=${subject}&body=${body}`;
  };
}
