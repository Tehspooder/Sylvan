import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";
import { EntryList } from "@/components/entry-list";
import { requireCampaign } from "@/lib/campaign";
import { asEntries, asSessionOptions } from "@/lib/rows";
import { ENTRY_TYPES, ENTRY_TYPE_LABEL, isEntryType } from "@/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Entries",
};

export default async function EntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { campaignId } = await params;
  const query = await searchParams;
  const { supabase, campaign, canWrite } = await requireCampaign(campaignId);
  const typeFilter = query.type && isEntryType(query.type) ? query.type : null;

  const [entriesResult, sessionsResult] = await Promise.all([
    supabase
      .from("entries")
      .select("id, campaign_id, session_id, type, title, body, source, created_at, updated_at")
      .eq("campaign_id", campaign.id)
      .order("title", { ascending: true }),
    supabase
      .from("sessions")
      .select("id, title, session_date")
      .eq("campaign_id", campaign.id),
  ]);

  const entries = asEntries(entriesResult.data).filter((entry) =>
    typeFilter ? entry.type === typeFilter : true,
  );
  const sessionsById = new Map(
    asSessionOptions(sessionsResult.data).map((session) => [session.id, session]),
  );

  const filters = [
    { href: `/app/${campaign.id}/entries`, label: "All", active: !typeFilter },
    ...ENTRY_TYPES.map((type) => ({
      href: `/app/${campaign.id}/entries?type=${type}`,
      label: ENTRY_TYPE_LABEL[type],
      active: typeFilter === type,
    })),
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-3xl">Entries</h2>
          <p className="mt-2 max-w-prose text-muted-foreground">
            People, places, plot, and everything still unresolved. Tags in session notes land here, and you can add entries by hand.
          </p>
        </div>
        {canWrite ? <ButtonLink href={`/app/${campaign.id}/entries/new`}>Add an entry</ButtonLink> : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-3 text-sm whitespace-nowrap",
              filter.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {entriesResult.error ? (
        <p role="alert" className="text-destructive">
          {entriesResult.error.message}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title={typeFilter ? `No ${ENTRY_TYPE_LABEL[typeFilter].toLowerCase()} entries` : "The ledger is empty"}
          body={
            typeFilter
              ? "Try another type, or tag one in a session’s notes."
              : "Record a session and tag lines with @person, @place, @plot, or @open. Or add an entry yourself."
          }
          action={
            canWrite && !typeFilter ? (
              <ButtonLink href={`/app/${campaign.id}/sessions/new`}>Record a session</ButtonLink>
            ) : null
          }
        />
      ) : (
        <EntryList campaignId={campaign.id} entries={entries} sessionsById={sessionsById} />
      )}
    </div>
  );
}
