import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Plain-language guides on web accessibility, WCAG 2.2, and the European Accessibility Act — written for agencies.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  {
    href: "/guides/european-accessibility-act",
    title: "The European Accessibility Act: what web agencies need to know",
    summary:
      "Who the EAA covers, the standard it points to, and how agencies can turn the June 2025 deadline into a service line.",
  },
] as const;

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Guides</h1>
      <p className="mt-3 text-[hsl(var(--muted-foreground))]">
        Practical, plain-language explainers on accessibility compliance — written for the agencies
        that have to deliver it.
      </p>
      <ul className="mt-10 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.href} className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">
              <Link href={g.href} className="underline-offset-4 hover:underline">
                {g.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{g.summary}</p>
            <Link
              href={g.href}
              className="mt-3 inline-block text-sm font-medium text-brand underline-offset-4 hover:underline"
            >
              Read the guide →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
