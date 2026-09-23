import type { EntryType } from "@/types";

export type SearchableSession = {
  id: string;
  title: string;
  raw_notes: string;
  summary: string | null;
  session_date: string;
};

export type SearchableEntry = {
  id: string;
  title: string;
  body: string;
  type: EntryType;
  session_id: string | null;
};

export type SearchResults = {
  sessions: SearchableSession[];
  entries: SearchableEntry[];
};

function includes(haystack: string | null | undefined, needle: string) {
  return (haystack ?? "").toLowerCase().includes(needle);
}

/** Case-insensitive search across session notes and chronicle entries. */
export function searchChronicle(
  query: string,
  sessions: SearchableSession[],
  entries: SearchableEntry[],
): SearchResults {
  const needle = query.trim().toLowerCase();
  if (!needle) return { sessions: [], entries: [] };

  return {
    sessions: sessions.filter(
      (session) =>
        includes(session.title, needle) ||
        includes(session.raw_notes, needle) ||
        includes(session.summary, needle),
    ),
    entries: entries.filter(
      (entry) => includes(entry.title, needle) || includes(entry.body, needle),
    ),
  };
}
