import { isEntryType, type Campaign, type Entry, type Session } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function asCampaigns(value: unknown): Campaign[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    return [
      {
        id: row.id,
        owner_id: typeof row.owner_id === "string" ? row.owner_id : "",
        name: row.name,
        system: typeof row.system === "string" ? row.system : "",
        starting_date: typeof row.starting_date === "string" ? row.starting_date : null,
        created_at: typeof row.created_at === "string" ? row.created_at : "",
      },
    ];
  });
}

export function asSessions(value: unknown): Session[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    if (typeof row.id !== "string" || typeof row.title !== "string") return [];
    return [
      {
        id: row.id,
        campaign_id: typeof row.campaign_id === "string" ? row.campaign_id : "",
        session_date: typeof row.session_date === "string" ? row.session_date : "",
        title: row.title,
        raw_notes: typeof row.raw_notes === "string" ? row.raw_notes : "",
        summary: typeof row.summary === "string" ? row.summary : null,
        created_at: typeof row.created_at === "string" ? row.created_at : "",
      },
    ];
  });
}

export function asSession(value: unknown): Session | null {
  return asSessions([value])[0] ?? null;
}

export function asEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    if (typeof row.id !== "string" || typeof row.title !== "string") return [];
    if (typeof row.type !== "string" || !isEntryType(row.type)) return [];
    if (row.source !== "parsed" && row.source !== "manual") return [];
    return [
      {
        id: row.id,
        campaign_id: typeof row.campaign_id === "string" ? row.campaign_id : "",
        session_id: typeof row.session_id === "string" ? row.session_id : null,
        type: row.type,
        title: row.title,
        body: typeof row.body === "string" ? row.body : "",
        source: row.source,
        created_at: typeof row.created_at === "string" ? row.created_at : "",
        updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
      },
    ];
  });
}

export function asEntry(value: unknown): Entry | null {
  return asEntries(value ? [value] : [])[0] ?? null;
}

export type SessionOption = {
  id: string;
  title: string;
  session_date: string;
};

export function asSessionOptions(value: unknown): SessionOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    if (typeof row.id !== "string" || typeof row.title !== "string") return [];
    return [
      {
        id: row.id,
        title: row.title,
        session_date: typeof row.session_date === "string" ? row.session_date : "",
      },
    ];
  });
}
