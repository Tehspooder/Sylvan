import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEntry } from "@/actions/entries";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { EntryForm } from "@/components/entry-form";
import { TypeBadge } from "@/components/type-badge";
import { requireCampaign } from "@/lib/campaign";
import { formatDate, isUuid } from "@/lib/format";
import { asEntry, asSessionOptions } from "@/lib/rows";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string; entryId: string }>;
}): Promise<Metadata> {
  const { campaignId, entryId } = await params;
  const { supabase } = await requireCampaign(campaignId);
  if (!isUuid(entryId)) return { title: "Entry" };
  const { data } = await supabase.from("entries").select("title").eq("id", entryId).maybeSingle();
  const title = data && typeof data.title === "string" ? data.title : "Entry";
  return { title };
}

export default async function EntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string; entryId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { campaignId, entryId } = await params;
  const query = await searchParams;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);
  if (!isUuid(entryId)) notFound();

  const { data } = await supabase
    .from("entries")
    .select("id, campaign_id, session_id, type, title, body, source, created_at, updated_at")
    .eq("id", entryId)
    .maybeSingle();

  const entry = asEntry(data);
  if (!entry || entry.campaign_id !== campaign.id) notFound();

  const { data: sessionRows } = await supabase
    .from("sessions")
    .select("id, title, session_date")
    .eq("campaign_id", campaign.id)
    .order("session_date", { ascending: false });
  const sessions = asSessionOptions(sessionRows);
  const linked = sessions.find((session) => session.id === entry.session_id);

  return (
    <article className="grid gap-8">
      <header className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          <Link href={`/app/${campaign.id}/entries`} className="underline-offset-4 hover:underline">
            All entries
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <TypeBadge type={entry.type} />
          {linked ? (
            <Link
              href={`/app/${campaign.id}/sessions/${linked.id}`}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {formatDate(linked.session_date)} · {linked.title}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Not tied to a session</span>
          )}
        </div>
        {!canWrite ? <h2 className="font-heading text-4xl">{entry.title}</h2> : null}
      </header>

      {query.saved === "1" ? (
        <p role="status" className="text-sm text-foreground">
          Saved.
        </p>
      ) : null}

      {canWrite ? (
        <div className="grid gap-6">
          <EntryForm
            action={updateEntry.bind(null, campaign.id, entry.id)}
            submitLabel="Save entry"
            sessions={sessions}
            hint="Saving marks this entry as hand-edited. The next session save will not overwrite it. If the original tag is still in the notes, that save will add a new copy."
            values={{
              type: entry.type,
              title: entry.title,
              body: entry.body,
              sessionId: entry.session_id ?? "",
            }}
          />
          <DeleteEntryButton campaignId={campaign.id} entryId={entry.id} />
        </div>
      ) : (
        <div className="max-w-prose text-base leading-relaxed whitespace-pre-wrap">
          {entry.body || <span className="text-muted-foreground">No notes on this entry.</span>}
        </div>
      )}
    </article>
  );
}
