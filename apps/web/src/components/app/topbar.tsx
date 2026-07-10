"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { IconChip } from "@/components/ui/icon-chip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslations } from "@/i18n/provider";

/**
 * Desktop top app bar — the Material-admin frame over the content column (the
 * sidebar owns the left edge, this owns the top). A frosted strip pinned to the
 * top that carries the current-workspace label on the leading edge and the utility
 * cluster — language, theme, and a profile chip — on the trailing edge, the way a
 * Jumbo-style dashboard seats its chrome. Desktop-only; the mobile bar lives in the
 * sidebar. Reduced-motion and RTL safe (logical properties throughout).
 */
export function TopBar({
  orgName,
  email,
  fullName,
  avatarUrl,
}: {
  orgName: string;
  email: string | undefined;
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const t = useTranslations("nav");
  const displayName = fullName || email || orgName;

  return (
    <header className="glass no-print sticky top-0 z-20 hidden h-16 items-center gap-3 border-b px-6 lg:flex">
      <div className="flex min-w-0 items-center gap-2.5">
        <IconChip icon={Building2} tone="brand" size="sm" />
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
            {t("topbar.workspace")}
          </p>
          <p className="truncate text-sm font-semibold leading-tight" title={orgName}>
            {orgName}
          </p>
        </div>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
        <LanguageSwitcher variant="compact" />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-full py-1 pe-1 ps-2.5 transition-colors hover:bg-accent/60"
          aria-label={t("topbar.account")}
        >
          <span className="hidden text-end leading-tight xl:block">
            {fullName ? (
              <span className="block max-w-[12rem] truncate text-xs font-semibold">{fullName}</span>
            ) : null}
            <span className="block max-w-[12rem] truncate text-xs text-muted-foreground">{email}</span>
          </span>
          <Avatar src={avatarUrl} name={displayName} />
        </Link>
      </div>
    </header>
  );
}
