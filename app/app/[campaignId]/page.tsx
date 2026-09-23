import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";
import { EntryList } from "@/components/entry-list";
import { SearchForm } from "@/components/search-form";
import { requireCampaign } from "@/lib/campaign";
import { formatDate } from "@/lib/format";
import { recapBlurb } from "@/lib/recap";
import { asEntries, asSessions } from "@/lib/rows";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}): Promise<Metadata> {
  const { campaignId } = await params;
  const { campaign } = await requireCampaign(campaignId);
  return { title: campaign.name };
}

export default async function CampaignHomePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);

  const [sessionsResult, entriesResult] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, campaign_id, session_date, title, raw_notes, summary, created_at")
      .eq("campaign_id", campaign.id)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("entries")
      .select("id, campaign_id, session_id, type, title, body, source, created_at, updated_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false }),
  ]);

  const sessions = asSessions(sessionsResult.data);
  const entries = asEntries(entriesResult.data);
  const latest = sessions[0];
  const latestEntries = latest
    ? entries.filter((entry) => entry.session_id === latest.id && entry.type !== "unresolved")
    : [];
  const threads = entries.filter((entry) => entry.type === "unresolved");
  const sessionsById = new Map(
    sessions.map((session) => [session.id, { title: session.title, session_date: session.session_date }]),
  );

  return (
    <div className="grid gap-10">
      <SearchForm campaignId={campaign.id} />

      {sessionsResult.error || entriesResult.error ? (
        <p role="alert" className="text-destructive">
          {sessionsResult.error?.message ?? entriesResult.error?.message}
        </p>
      ) : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-3xl">Sessions</h2>
          {canWrite ? (
            <ButtonLink href={`/app/${campaign.id}/sessions/new`}>Record a session</ButtonLink>
          ) : null}
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            body="Record what happened at the table. Tag people, places, plot, and open threads in the notes, and they will show up here."
            action={
              canWrite ? (
                <ButtonLink href={`/app/${campaign.id}/sessions/new`}>Record the first session</ButtonLink>
              ) : (
                <p className="text-sm text-muted-foreground">Players can read the chronicle once the DM records a session.</p>
              )
            }
          />
        ) : (
          <ol className="grid gap-3">
            {sessions.map((session, index) => (
              <li key={session.id}>
                <Link
                  href={`/app/${campaign.id}/sessions/${session.id}`}
                  className="block rounded-xl border border-border bg-card px-4 py-4 hover:border-primary/60 sm:px-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-2xl">{session.title}</h3>
                    <time dateTime={session.session_date} className="text-sm text-muted-foreground">
                      {formatDate(session.session_date)}
                    </time>
                  </div>
                  <p className={index === 0 ? "mt-3 text-base leading-relaxed" : "mt-2 line-clamp-2 text-muted-foreground"}>
                    {recapBlurb(session.summary, session.raw_notes, index === 0 ? 400 : 180)}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {latest ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-heading text-3xl">From the latest session</h2>
            <Link href={`/app/${campaign.id}/entries`} className="text-sm text-primary underline-offset-4 hover:underline">
              All entries
            </Link>
          </div>
          {latestEntries.length === 0 ? (
            <p className="text-muted-foreground">
              No people, places, or plot tagged in {latest.title}. Open threads are listed below.
            </p>
          ) : (
            <EntryList campaignId={campaign.id} entries={latestEntries} sessionsById={sessionsById} />
          )}
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="font-heading text-3xl">Open threads</h2>
        {threads.length === 0 ? (
          <EmptyState
            title="No open threads"
            body="Tag a loose end with @open Title — what is still unresolved. It stays on this list until you edit or remove it."
          />
        ) : (
          <EntryList campaignId={campaign.id} entries={threads} sessionsById={sessionsById} />
        )}
      </section>
    </div>
  );
}
