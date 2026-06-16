import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/profile-form";
import { OrganizationForm } from "@/components/settings/organization-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { organization, profile, email } = await requireSession();
  if (!organization) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section aria-labelledby="profile-heading" className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 id="profile-heading" className="text-lg font-medium">
            Profile
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Your personal account details.</p>
        </div>
        <ProfileForm
          email={email}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </section>

      <section aria-labelledby="workspace-heading" className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 id="workspace-heading" className="text-lg font-medium">
            Workspace &amp; branding
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Name, URL, and the branding applied to your reports.
          </p>
        </div>
        <OrganizationForm organization={organization} />
      </section>

      <section aria-labelledby="billing-heading" className="space-y-3 rounded-lg border p-6">
        <h2 id="billing-heading" className="text-lg font-medium">
          Billing
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Manage your plan, usage, and payment method.
        </p>
        <Link
          href="/settings/billing"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-[hsl(var(--muted))]"
        >
          Go to billing
        </Link>
      </section>

      <section aria-labelledby="team-heading" className="space-y-2 rounded-lg border p-6">
        <h2 id="team-heading" className="text-lg font-medium">
          Team
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          AccessAudit Pro is single-owner in this release. Multi-seat teams and roles arrive with
          a later update.
        </p>
      </section>
    </div>
  );
}
