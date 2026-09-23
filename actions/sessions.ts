"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCampaign } from "@/lib/campaign";
import { isUuid } from "@/lib/format";
import { rebuildParsedEntries } from "@/lib/rebuild-entries";
import { friendlyDbError, readString } from "@/lib/text";
import type { ActionState } from "@/types";

const MAX_NOTES = 200_000;

function readSessionFields(formData: FormData) {
  const title = readString(formData, "title");
  const sessionDate =
    readString(formData, "session_date") || new Date().toISOString().slice(0, 10);
  const summary = readString(formData, "summary");
  const rawNotes = String(formData.get("raw_notes") ?? "").replace(/\r\n/g, "\n");
  return { title, sessionDate, summary, rawNotes };
}

function validateSessionFields(fields: ReturnType<typeof readSessionFields>): string | null {
  if (!fields.title) return "Give the session a title.";
  if (fields.title.length > 160) return "Keep the title under 160 characters.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.sessionDate)) return "Use a valid session date.";
  if (fields.summary.length > 2000) return "Keep the summary under 2,000 characters.";
  if (fields.rawNotes.length > MAX_NOTES) return "Those notes are too long to store.";
  return null;
}

function revalidateCampaign(campaignId: string, sessionId?: string) {
  revalidatePath(`/app/${campaignId}`);
  revalidatePath(`/app/${campaignId}/entries`);
  revalidatePath(`/app/${campaignId}/search`);
  if (sessionId) {
    revalidatePath(`/app/${campaignId}/sessions/${sessionId}`);
  }
}

export async function createSession(
  campaignId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) return { error: "Only the owner or DM can record a session." };

  const fields = readSessionFields(formData);
  const invalid = validateSessionFields(fields);
  if (invalid) return { error: invalid };

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      campaign_id: campaignId,
      title: fields.title,
      session_date: fields.sessionDate,
      summary: fields.summary || null,
      raw_notes: fields.rawNotes,
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: friendlyDbError(error?.message ?? "Could not save the session.") };
  }

  const rebuildError = await rebuildParsedEntries(
    supabase,
    campaignId,
    session.id,
    fields.rawNotes,
  );

  if (rebuildError) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return { error: rebuildError };
  }

  revalidateCampaign(campaignId, session.id);
  redirect(`/app/${campaignId}/sessions/${session.id}`);
}

export async function updateSession(
  campaignId: string,
  sessionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(sessionId)) return { error: "That session does not exist." };

  const { supabase, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) return { error: "Only the owner or DM can edit a session." };

  const { data: existing } = await supabase
    .from("sessions")
    .select("id, campaign_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!existing || existing.campaign_id !== campaignId) {
    return { error: "That session is not in this chronicle." };
  }

  const fields = readSessionFields(formData);
  const invalid = validateSessionFields(fields);
  if (invalid) return { error: invalid };

  const { error } = await supabase
    .from("sessions")
    .update({
      title: fields.title,
      session_date: fields.sessionDate,
      summary: fields.summary || null,
      raw_notes: fields.rawNotes,
    })
    .eq("id", sessionId);

  if (error) return { error: friendlyDbError(error.message) };

  const rebuildError = await rebuildParsedEntries(
    supabase,
    campaignId,
    sessionId,
    fields.rawNotes,
  );
  if (rebuildError) return { error: rebuildError };

  revalidateCampaign(campaignId, sessionId);
  redirect(`/app/${campaignId}/sessions/${sessionId}`);
}
