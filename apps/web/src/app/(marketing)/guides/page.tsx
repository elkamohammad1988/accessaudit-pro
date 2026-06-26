import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  {
    href: "/guides/wcag-2-2-aa-checklist",
    title: "WCAG 2.2 AA: a practical audit checklist for agencies",
    summary:
      "The full Level AA checklist organized by the POUR principles — including the new 2.2 criteria — and what an automated scan can and can't catch.",
  },
] as const;

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Guides</h1>
      <p className="mt-3 text-muted-foreground">
        Practical, plain-language explainers on accessibility compliance — written for the agencies
        that have to deliver it.
      </p>
      <ul className="mt-10 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.href}>
            <Card interactive className="group p-6">
              <Link href={g.href} className="block">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{g.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{g.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  Read the guide
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
