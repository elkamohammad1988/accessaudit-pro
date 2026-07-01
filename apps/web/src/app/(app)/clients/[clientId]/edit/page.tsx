import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";
import { ClientForm } from "@/components/clients/client-form";
import { updateClientRecord } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clients");
  return { title: t("metaEdit") };
}

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const t = await getTranslations("clients");
  const { organization } = await requireSession();
  if (!organization) return null;

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← {client.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t("metaEdit")}</h1>
      </div>
      <ClientForm action={updateClientRecord} client={client} submitLabel={t("editSubmit")} />
    </div>
  );
}
