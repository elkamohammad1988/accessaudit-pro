import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { OrganizationForm } from "@/components/settings/organization-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { organization, profile, email } = await requireSession();
  if (!organization) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, workspace branding, billing, and team.
        </p>
      </header>

      <section
        aria-labelledby="profile-heading"
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div>
          <h2 id="profile-heading" className="text-lg font-semibold tracking-tight">
            Profile
          </h2>
          <p className="text-sm text-muted-foreground">Your personal account details.</p>
        </div>
        <ProfileForm
          email={email}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </section>

      <section
        aria-labelledby="workspace-heading"
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div>
          <h2 id="workspace-heading" className="text-lg font-semibold tracking-tight">
            Workspace &amp; branding
          </h2>
          <p className="text-sm text-muted-foreground">
            Name, URL, and the branding applied to your reports.
          </p>
        </div>
        <OrganizationForm organization={organization} />
      </section>

      <section
        aria-labelledby="billing-heading"
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div>
          <h2 id="billing-heading" className="text-lg font-semibold tracking-tight">
            Billing
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your plan, usage, and payment method.
          </p>
        </div>
        <ButtonLink href="/settings/billing" variant="secondary" className="w-fit">
          Go to billing
        </ButtonLink>
      </section>

      <section
        aria-labelledby="team-heading"
        className="space-y-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div>
          <h2 id="team-heading" className="text-lg font-semibold tracking-tight">
            Team
          </h2>
          <p className="text-sm text-muted-foreground">
            AccessAudit Pro is single-owner in this release. Multi-seat teams and roles arrive with
            a later update.
          </p>
        </div>
      </section>
    </div>
  );
}
