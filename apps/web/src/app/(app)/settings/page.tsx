import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { OrganizationForm } from "@/components/settings/organization-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("metaTitle") };
}

export default async function SettingsPage() {
  const { organization, profile, email } = await requireSession();
  if (!organization) return null;

  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <section
        aria-labelledby="profile-heading"
        className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      >
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

      <section
        aria-labelledby="workspace-heading"
        className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      >
        <div>
          <h2 id="workspace-heading" className="text-lg font-semibold tracking-tight">
            {t("workspace.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("workspace.description")}</p>
        </div>
        <OrganizationForm organization={organization} />
      </section>

      <section
        aria-labelledby="billing-heading"
        className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      >
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

      <section
        aria-labelledby="team-heading"
        className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
      >
        <div>
          <h2 id="team-heading" className="text-lg font-semibold tracking-tight">
            {t("team.heading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("team.description")}</p>
        </div>
      </section>
    </div>
  );
}
