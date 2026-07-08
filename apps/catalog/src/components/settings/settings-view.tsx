"use client";

import { Check, Monitor, Moon, Rows3, LayoutGrid, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { usePreferences, type Density } from "@/components/providers/preferences-provider";
import { useI18n } from "@/components/providers/locale-provider";
import { useToast } from "@/components/providers/toast-provider";
import { LOCALES, type Locale } from "@/lib/i18n";
import { PageHeading } from "@/components/catalog/page-heading";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border py-6 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="sm:max-w-sm">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { density, setDensity, reduceMotion, setReduceMotion } = usePreferences();
  const { t, locale, setLocale } = useI18n();
  const { toast } = useToast();

  const saved = () => toast({ title: t("toast.settingsSaved"), variant: "success" });

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeading
        crumbs={[{ label: "Home", href: "/" }, { label: t("settings.title") }]}
        kicker="Preferences"
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <div className="mt-10 max-w-3xl space-y-6">
        {/* Appearance */}
        <section className="surface p-6 sm:p-8">
          <h2 className="mb-5 text-base font-semibold text-foreground">{t("settings.appearance")}</h2>

          <SettingRow title={t("settings.theme")} description={t("settings.themeSub")}>
            <Segmented<Theme>
              ariaLabel={t("settings.theme")}
              value={theme}
              onChange={(v) => {
                setTheme(v);
                saved();
              }}
              options={[
                { value: "light", label: t("settings.light"), icon: Sun },
                { value: "dark", label: t("settings.dark"), icon: Moon },
                { value: "system", label: t("settings.system"), icon: Monitor },
              ]}
            />
          </SettingRow>

          <SettingRow title={t("settings.density")} description={t("settings.densitySub")}>
            <Segmented<Density>
              ariaLabel={t("settings.density")}
              value={density}
              onChange={(v) => {
                setDensity(v);
                saved();
              }}
              options={[
                { value: "comfortable", label: t("settings.comfortable"), icon: Rows3 },
                { value: "compact", label: t("settings.compact"), icon: LayoutGrid },
              ]}
            />
          </SettingRow>

          <SettingRow title={t("settings.motion")} description={t("settings.motionSub")}>
            <Switch
              checked={reduceMotion}
              onChange={(v) => {
                setReduceMotion(v);
                saved();
              }}
              label={t("settings.motion")}
            />
          </SettingRow>
        </section>

        {/* Language */}
        <section className="surface p-6 sm:p-8">
          <h2 className="mb-1 text-base font-semibold text-foreground">{t("settings.language")}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t("settings.languageSub")}</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {LOCALES.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code as Locale);
                    saved();
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    active
                      ? "border-brand bg-brand/[0.07] ring-1 ring-brand/30"
                      : "border-border hover:border-brand/40 hover:bg-accent",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{l.native}</span>
                    <span className="block text-xs text-muted-foreground">{l.label}</span>
                  </span>
                  {active ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-fg">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <span className="text-xs uppercase text-muted-foreground">{l.code}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
