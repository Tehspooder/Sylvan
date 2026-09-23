import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";
import { EntryList } from "@/components/entry-list";
import { NotesView } from "@/components/notes-view";
import { requireCampaign } from "@/lib/campaign";
import { formatDate, isUuid } from "@/lib/format";
import { recapBlurb } from "@/lib/recap";
import { asEntries, asSession } from "@/lib/rows";
import { ENTRY_TYPES, ENTRY_TYPE_LABEL, type Entry } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}): Promise<Metadata> {
  const { campaignId, sessionId } = await params;
  const { supabase } = await requireCampaign(campaignId);
  if (!isUuid(sessionId)) return { title: "Session" };
  const { data } = await supabase.from("sessions").select("title").eq("id", sessionId).maybeSingle();
  const title = data && typeof data.title === "string" ? data.title : "Session";
  return { title };
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);
  if (!isUuid(sessionId)) notFound();

  const { data: sessionRow } = await supabase
    .from("sessions")
    .select("id, campaign_id, session_date, title, raw_notes, summary, created_at")
    .eq("id", sessionId)
    .maybeSingle();

  const session = asSession(sessionRow);
  if (!session || session.campaign_id !== campaign.id) notFound();

  const { data: entryRows } = await supabase
    .from("entries")
    .select("id, campaign_id, session_id, type, title, body, source, created_at, updated_at")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const entries = asEntries(entryRows);
  const grouped = ENTRY_TYPES.map((type) => ({
    type,
    entries: entries.filter((entry) => entry.type === type),
  })).filter((group) => group.entries.length > 0);

  const sessionsById = new Map([
    [session.id, { title: session.title, session_date: session.session_date }],
  ]);

  return (
    <article className="grid gap-10">
      <header className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          <Link href={`/app/${campaign.id}`} className="underline-offset-4 hover:underline">
            Chronicle
          </Link>
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <time dateTime={session.session_date} className="text-sm text-muted-foreground">
              {formatDate(session.session_date)}
            </time>
            <h2 className="font-heading text-4xl">{session.title}</h2>
          </div>
          {canWrite ? (
            <ButtonLink href={`/app/${campaign.id}/sessions/${session.id}/edit`} variant="outline">
              Edit session
            </ButtonLink>
          ) : null}
        </div>
      </header>

      <aside className="rounded-xl border border-border bg-card px-5 py-4">
        <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Last time on…</p>
        <p className="mt-2 text-lg leading-relaxed">
          {recapBlurb(session.summary, session.raw_notes) || "No recap yet."}
        </p>
      </aside>

      <section className="grid gap-6">
        <h3 className="font-heading text-3xl">Linked entries</h3>
        {grouped.length === 0 ? (
          <EmptyState
            title="Nothing tagged in these notes"
            body="Edit the session and add @person, @place, @plot, or @open lines. You can also add an entry by hand."
            action={
              canWrite ? (
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={`/app/${campaign.id}/sessions/${session.id}/edit`} variant="outline">
                    Edit notes
                  </ButtonLink>
                  <ButtonLink href={`/app/${campaign.id}/entries/new`}>Add an entry</ButtonLink>
                </div>
              ) : null
            }
          />
        ) : (
          grouped.map((group) => (
            <div key={group.type} className="grid gap-2">
              <h4 className="text-sm tracking-wide text-muted-foreground uppercase">
                {ENTRY_TYPE_LABEL[group.type]}
              </h4>
              <EntryList
                campaignId={campaign.id}
                entries={group.entries satisfies Entry[]}
                sessionsById={sessionsById}
              />
            </div>
          ))
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="font-heading text-3xl">Notes</h3>
        <NotesView notes={session.raw_notes} />
      </section>
    </article>
  );
}
