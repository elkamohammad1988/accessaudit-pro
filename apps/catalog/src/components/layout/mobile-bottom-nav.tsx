"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Heart, User } from "lucide-react";
import { useSearch } from "./search-overlay";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/** Persistent bottom navigation for touch devices (hidden ≥ lg). */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { open } = useSearch();
  const { count, ready } = useFavorites();
  const { t } = useI18n();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const items = [
    { href: "/", key: "nav.home", icon: Home },
    { href: "/catalog", key: "nav.catalog", icon: LayoutGrid },
    { key: "nav.search", icon: Search, action: open },
    { href: "/favorites", key: "nav.favorites", icon: Heart, badge: true },
    { href: "/profile", key: "nav.profile", icon: User },
  ] as const;

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((item) => {
          const active = "href" in item ? isActive(item.href) : false;
          const Icon = item.icon;
          const content = (
            <>
              <span className="relative">
                <Icon
                  className={cn("h-[1.35rem] w-[1.35rem]", active && "fill-current/0")}
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {"badge" in item && item.badge && ready && count > 0 ? (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.5625rem] font-bold text-brand-fg">
                    {count}
                  </span>
                ) : null}
              </span>
              <span className="text-[0.625rem] font-medium">{t(item.key)}</span>
            </>
          );
          const cls = cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            active ? "text-brand-deep" : "text-muted-foreground hover:text-foreground",
          );

          return "href" in item ? (
            <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
              {content}
            </Link>
          ) : (
            <button key={item.key} type="button" onClick={item.action} aria-label={t(item.key)} className={cls}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
