import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { EntryList } from "@/components/entry-list";
import { SearchForm } from "@/components/search-form";
import { requireCampaign } from "@/lib/campaign";
import { formatDate, snippet } from "@/lib/format";
import { asEntries, asSessions } from "@/lib/rows";
import { searchChronicle } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { campaignId } = await params;
  const query = await searchParams;
  const rawQuery = Array.isArray(query.q) ? query.q[0] : query.q;
  const q = (rawQuery ?? "").trim();
  const { supabase, campaign } = await requireCampaign(campaignId);

  const [sessionsResult, entriesResult] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, campaign_id, session_date, title, raw_notes, summary, created_at")
      .eq("campaign_id", campaign.id),
    supabase
      .from("entries")
      .select("id, campaign_id, session_id, type, title, body, source, created_at, updated_at")
      .eq("campaign_id", campaign.id),
  ]);

  const sessions = asSessions(sessionsResult.data);
  const entries = asEntries(entriesResult.data);
  const results = q ? searchChronicle(q, sessions, entries) : { sessions: [], entries: [] };
  const sessionsById = new Map(
    sessions.map((session) => [session.id, { title: session.title, session_date: session.session_date }]),
  );

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="font-heading text-3xl">Search</h2>
        <p className="mt-2 text-muted-foreground">
          Look through session notes and every entry in this chronicle.
        </p>
      </div>
      <SearchForm campaignId={campaign.id} defaultValue={q} />

      {!q ? (
        <EmptyState
          title="Search the chronicle"
          body="Try a name from the table, a place, or a phrase you remember from the notes."
        />
      ) : (
        <div className="grid gap-8">
          <section className="grid gap-3">
            <h3 className="font-heading text-2xl">Sessions</h3>
            {results.sessions.length === 0 ? (
              <p className="text-muted-foreground">No sessions match “{q}”.</p>
            ) : (
              <ul className="grid gap-3">
                {results.sessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/app/${campaign.id}/sessions/${session.id}`}
                      className="block rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/60"
                    >
                      <span className="font-heading text-xl">{session.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {formatDate(session.session_date)} · {snippet(session.summary || session.raw_notes, 140)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="grid gap-3">
            <h3 className="font-heading text-2xl">Entries</h3>
            {results.entries.length === 0 ? (
              <p className="text-muted-foreground">No entries match “{q}”.</p>
            ) : (
              <EntryList campaignId={campaign.id} entries={results.entries} sessionsById={sessionsById} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
