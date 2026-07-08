"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Package, Settings, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageMenu } from "@/components/layout/language-menu";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useI18n } from "@/components/providers/locale-provider";

export function ProfileView() {
  const { count, ready } = useFavorites();
  const { toast } = useToast();
  const { t } = useI18n();

  const [name, setName] = useState("Amara Kessler");
  const [email, setEmail] = useState("amara@example.com");

  const stats = [
    { icon: Heart, label: t("profile.favorites"), value: ready ? count : 0, href: "/favorites" },
    { icon: Package, label: t("profile.orders"), value: 8 },
    { icon: Star, label: t("profile.reviews"), value: 5 },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        {/* Header card */}
        <div className="surface overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand/20 via-brand-mist/25 to-brand/10 sm:h-28" />
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-10 flex flex-col items-start gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Avatar name={name} size={80} className="ring-4 ring-card" />
                <div className="pb-1">
                  <h1 className="font-display text-2xl text-foreground sm:text-3xl">{name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("profile.member")} · {t("profile.since")}
                  </p>
                </div>
              </div>
              <Link href="/settings" className={buttonClasses("secondary", "sm", "sm:mb-1")}>
                <Settings className="h-4 w-4" aria-hidden />
                {t("nav.settings")}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((s) => {
            const inner = (
              <div className="surface flex flex-col items-center gap-1 p-5 text-center transition-all duration-200 hover:border-brand/30 hover:shadow-md">
                <s.icon className="h-5 w-5 text-brand-deep" strokeWidth={1.7} aria-hidden />
                <span className="mt-1 font-display text-2xl font-semibold tabular-nums text-foreground">
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            );
            return s.href ? (
              <Link key={s.label} href={s.href}>
                {inner}
              </Link>
            ) : (
              <div key={s.label}>{inner}</div>
            );
          })}
        </div>

        {/* Account details */}
        <section className="surface mt-6 p-6 sm:p-8">
          <h2 className="text-base font-semibold text-foreground">{t("profile.account")}</h2>
          <form
            className="mt-5 grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              toast({ title: t("toast.settingsSaved"), variant: "success" });
            }}
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("profile.name")}
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field h-11 px-4 text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("profile.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field h-11 px-4 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{t("profile.saveChanges")}</Button>
            </div>
          </form>
        </section>

        {/* Quick preferences */}
        <section className="surface mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("settings.appearance")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.themeSub")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="border border-border" />
            <LanguageMenu className="rounded-full border border-border" />
          </div>
        </section>
      </div>
    </div>
  );
}
