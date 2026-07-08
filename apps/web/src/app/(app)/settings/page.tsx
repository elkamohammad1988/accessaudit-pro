import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { cardSurfaceClass } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProfileForm } from "@/components/settings/profile-form";
import { OrganizationForm } from "@/components/settings/organization-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("metaTitle") };
}

/** Shared settings-section surface: the app card treatment on a labelled landmark. */
const sectionClass = cn(cardSurfaceClass, "space-y-4 p-5 sm:p-6");

export default async function SettingsPage() {
  const { organization, profile, email } = await requireSession();
  if (!organization) return null;

  const t = await getTranslations("settings");
  const memberName = profile?.full_name || email || organization.name;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section aria-labelledby="profile-heading" className={sectionClass}>
        <div>
          <h2 id="profile-heading" className="text-lg font-semibold tracking-tight">
            {t("profile.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("profile.description")}</p>
        </div>
        <ProfileForm
          email={email}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </section>

      <section aria-labelledby="workspace-heading" className={sectionClass}>
        <div>
          <h2 id="workspace-heading" className="text-lg font-semibold tracking-tight">
            {t("workspace.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("workspace.description")}</p>
        </div>
        <OrganizationForm organization={organization} />
      </section>

      <section aria-labelledby="billing-heading" className={sectionClass}>
        <div>
          <h2 id="billing-heading" className="text-lg font-semibold tracking-tight">
            {t("billing.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("billing.description")}</p>
        </div>
        <ButtonLink href="/settings/billing" variant="secondary" className="w-fit">
          {t("billing.goToBilling")}
        </ButtonLink>
      </section>

      {/* Team — single-owner in this release (see copy). Rather than an empty stub,
          the current owner is shown as a real, finished member row; multi-seat is
          the deferred roadmap the description states honestly. */}
      <section aria-labelledby="team-heading" className={sectionClass}>
        <div>
          <h2 id="team-heading" className="text-lg font-semibold tracking-tight">
            {t("team.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("team.description")}</p>
        </div>
        <ul>
          <li className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 dark:bg-white/[0.02]">
            <Avatar src={profile?.avatar_url ?? null} name={memberName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span className="truncate">{memberName}</span>
                <span className="shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand ring-1 ring-inset ring-brand/20">
                  {t("team.you")}
                </span>
              </p>
              <p className="truncate text-xs text-muted-foreground" title={email}>
                {email}
              </p>
            </div>
            <Badge variant="default" className="shrink-0">
              {t("team.ownerRole")}
            </Badge>
          </li>
        </ul>
      </section>
    </div>
  );
}
