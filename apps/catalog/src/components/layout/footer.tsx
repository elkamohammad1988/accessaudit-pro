"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";

function NewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!email.trim()) return;
        toast({ title: "Thanks for subscribing", description: "The next edit lands in your inbox soon.", variant: "success" });
        setEmail("");
      }}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="field h-11 flex-1 px-4 text-sm"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)-4px)] bg-brand text-brand-fg transition-colors hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
      </button>
    </form>
  );
}

export function Footer() {
  const { t } = useI18n();
  const year = 2026;

  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + newsletter */}
          <div>
            <LogoMark size={38} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")} A small, opinionated catalogue for a considered home.
            </p>
            <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-foreground">
              The Verdant Edit
            </p>
            <NewsletterForm />
          </div>

          {/* Shop */}
          <FooterColumn title={t("footer.shop")}>
            <FooterLink href="/catalog">{t("nav.catalog")}</FooterLink>
            <FooterLink href="/categories">{t("nav.categories")}</FooterLink>
            <FooterLink href="/collections">{t("nav.collections")}</FooterLink>
            <FooterLink href="/favorites">{t("nav.favorites")}</FooterLink>
          </FooterColumn>

          {/* Departments */}
          <FooterColumn title={t("nav.categories")}>
            {categories.slice(0, 6).map((c) => (
              <FooterLink key={c.slug} href={`/categories/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Collections */}
          <FooterColumn title={t("nav.collections")}>
            {collections.slice(0, 6).map((c) => (
              <FooterLink key={c.slug} href={`/collections/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Verdant. {t("footer.rights")}
          </p>
          <p className="text-xs">{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-brand-deep"
      >
        {children}
      </Link>
    </li>
  );
}
