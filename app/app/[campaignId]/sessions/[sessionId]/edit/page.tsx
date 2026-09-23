import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateSession } from "@/actions/sessions";
import { SessionForm } from "@/components/session-form";
import { requireCampaign } from "@/lib/campaign";
import { isUuid } from "@/lib/format";
import { asSession } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Edit session",
};

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) {
    return <p className="text-muted-foreground">Only the owner or DM can edit a session.</p>;
  }
  if (!isUuid(sessionId)) notFound();

  const { data } = await supabase
    .from("sessions")
    .select("id, campaign_id, session_date, title, raw_notes, summary, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  const session = asSession(data);
  if (!session || session.campaign_id !== campaign.id) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={`/app/${campaign.id}/sessions/${session.id}`}
            className="underline-offset-4 hover:underline"
          >
            Back to session
          </Link>
        </p>
        <h2 className="mt-2 font-heading text-3xl">Edit session</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Saving rebuilds entries from @tags. Entries you have edited by hand are kept.
        </p>
      </div>
      <SessionForm
        action={updateSession.bind(null, campaign.id, session.id)}
        submitLabel="Save session"
        values={{
          title: session.title,
          sessionDate: session.session_date,
          summary: session.summary ?? "",
          rawNotes: session.raw_notes,
        }}
      />
    </div>
  );
}
