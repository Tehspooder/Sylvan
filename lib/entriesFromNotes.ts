import { parseNotes } from "@/lib/parseNotes";
import type { EntrySource, EntryType } from "@/types";

export type ParsedEntryRow = {
  campaign_id: string;
  session_id: string;
  type: EntryType;
  title: string;
  body: string;
  source: Extract<EntrySource, "parsed">;
};

function entryKey(type: string, title: string) {
  return `${type}\0${title.trim().toLowerCase()}`;
}

/**
 * Entries to insert after a session save.
 * Hand-edited rows (same type and title) are left in place, so a re-parse
 * does not duplicate them or overwrite the edit.
 */
export function entriesFromNotes(
  campaignId: string,
  sessionId: string,
  rawNotes: string,
  preserved: { type: string; title: string }[] = [],
): ParsedEntryRow[] {
  const kept = new Set(preserved.map((entry) => entryKey(entry.type, entry.title)));

  return parseNotes(rawNotes)
    .filter((entry) => !kept.has(entryKey(entry.type, entry.title)))
    .map((entry) => ({
      campaign_id: campaignId,
      session_id: sessionId,
      type: entry.type,
      title: entry.title,
      body: entry.body,
      source: "parsed" as const,
    }));
}
