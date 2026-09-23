import type { SupabaseClient } from "@supabase/supabase-js";
import { entriesFromNotes } from "@/lib/entriesFromNotes";
import { friendlyDbError } from "@/lib/text";

export async function rebuildParsedEntries(
  supabase: SupabaseClient,
  campaignId: string,
  sessionId: string,
  rawNotes: string,
): Promise<string | null> {
  const { data: manual, error: manualError } = await supabase
    .from("entries")
    .select("type, title")
    .eq("session_id", sessionId)
    .eq("source", "manual");

  if (manualError) return friendlyDbError(manualError.message);

  const { error: deleteError } = await supabase
    .from("entries")
    .delete()
    .eq("session_id", sessionId)
    .eq("source", "parsed");

  if (deleteError) return friendlyDbError(deleteError.message);

  const preserved = (manual ?? []) as { type: string; title: string }[];
  const rows = entriesFromNotes(campaignId, sessionId, rawNotes, preserved);
  if (rows.length === 0) return null;

  const { error } = await supabase.from("entries").insert(rows);
  return error ? friendlyDbError(error.message) : null;
}
