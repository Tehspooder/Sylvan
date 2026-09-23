"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCampaign } from "@/lib/campaign";
import { isUuid } from "@/lib/format";
import { friendlyDbError, readString } from "@/lib/text";
import { isEntryType, type ActionState, type EntryType } from "@/types";

function revalidateEntryPaths(campaignId: string, entryId?: string) {
  revalidatePath(`/app/${campaignId}`);
  revalidatePath(`/app/${campaignId}/entries`);
  revalidatePath(`/app/${campaignId}/search`);
  if (entryId) revalidatePath(`/app/${campaignId}/entries/${entryId}`);
}

async function sessionInCampaign(
  supabase: Awaited<ReturnType<typeof requireCampaign>>["supabase"],
  campaignId: string,
  sessionId: string,
) {
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return Boolean(data);
}

function readEntryFields(formData: FormData): {
  error?: string;
  type?: EntryType;
  title?: string;
  body?: string;
  sessionId?: string | null;
} {
  const typeValue = readString(formData, "type");
  const title = readString(formData, "title");
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  const sessionValue = readString(formData, "session_id");

  if (!isEntryType(typeValue)) return { error: "Choose a type." };
  if (!title) return { error: "Give the entry a title." };
  if (title.length > 160) return { error: "Keep the title under 160 characters." };
  if (body.length > 20_000) return { error: "That entry is too long." };
  if (sessionValue && !isUuid(sessionValue)) return { error: "Choose a session from the list." };

  return {
    type: typeValue,
    title,
    body,
    sessionId: sessionValue || null,
  };
}

export async function createEntry(
  campaignId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) return { error: "Only the owner or DM can add entries." };

  const fields = readEntryFields(formData);
  if (fields.error || !fields.type || !fields.title) {
    return { error: fields.error ?? "Check the entry and try again." };
  }

  if (fields.sessionId && !(await sessionInCampaign(supabase, campaignId, fields.sessionId))) {
    return { error: "That session is not in this chronicle." };
  }

  const { data, error } = await supabase
    .from("entries")
    .insert({
      campaign_id: campaignId,
      session_id: fields.sessionId,
      type: fields.type,
      title: fields.title,
      body: fields.body ?? "",
      source: "manual",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: friendlyDbError(error?.message ?? "Could not save the entry.") };
  }

  revalidateEntryPaths(campaignId, data.id);
  redirect(`/app/${campaignId}/entries/${data.id}`);
}

export async function updateEntry(
  campaignId: string,
  entryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isUuid(entryId)) return { error: "That entry does not exist." };

  const { supabase, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) return { error: "Only the owner or DM can edit entries." };

  const { data: existing } = await supabase
    .from("entries")
    .select("id, campaign_id")
    .eq("id", entryId)
    .maybeSingle();

  if (!existing || existing.campaign_id !== campaignId) {
    return { error: "That entry is not in this chronicle." };
  }

  const fields = readEntryFields(formData);
  if (fields.error || !fields.type || !fields.title) {
    return { error: fields.error ?? "Check the entry and try again." };
  }

  if (fields.sessionId && !(await sessionInCampaign(supabase, campaignId, fields.sessionId))) {
    return { error: "That session is not in this chronicle." };
  }

  const { error } = await supabase
    .from("entries")
    .update({
      type: fields.type,
      title: fields.title,
      body: fields.body ?? "",
      session_id: fields.sessionId,
      source: "manual",
    })
    .eq("id", entryId);

  if (error) return { error: friendlyDbError(error.message) };

  revalidateEntryPaths(campaignId, entryId);
  redirect(`/app/${campaignId}/entries/${entryId}?saved=1`);
}

export async function deleteEntry(formData: FormData) {
  const campaignId = readString(formData, "campaign_id");
  const entryId = readString(formData, "entry_id");
  if (!isUuid(campaignId) || !isUuid(entryId)) redirect("/app");

  const { supabase, canWrite } = await requireCampaign(campaignId);
  if (!canWrite) redirect(`/app/${campaignId}/entries/${entryId}`);

  await supabase.from("entries").delete().eq("id", entryId).eq("campaign_id", campaignId);
  revalidateEntryPaths(campaignId);
  redirect(`/app/${campaignId}/entries`);
}
