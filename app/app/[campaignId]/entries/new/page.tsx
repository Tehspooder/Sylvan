import type { Metadata } from "next";
import Link from "next/link";
import { createEntry } from "@/actions/entries";
import { EntryForm } from "@/components/entry-form";
import { requireCampaign } from "@/lib/campaign";
import { asSessionOptions } from "@/lib/rows";

export const metadata: Metadata = {
  title: "New entry",
};

export default async function NewEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { campaignId } = await params;
  const query = await searchParams;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);

  if (!canWrite) {
    return <p className="text-muted-foreground">Only the owner or DM can add entries.</p>;
  }

  const { data } = await supabase
    .from("sessions")
    .select("id, title, session_date")
    .eq("campaign_id", campaign.id)
    .order("session_date", { ascending: false });

  const sessions = asSessionOptions(data);
  const sessionId = sessions.some((session) => session.id === query.session) ? query.session ?? "" : "";

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/app/${campaign.id}/entries`} className="underline-offset-4 hover:underline">
            All entries
          </Link>
        </p>
        <h2 className="mt-2 font-heading text-3xl">Add an entry</h2>
      </div>
      <EntryForm
        action={createEntry.bind(null, campaign.id)}
        submitLabel="Save entry"
        sessions={sessions}
        values={{ type: "person", title: "", body: "", sessionId }}
      />
    </div>
  );
}
