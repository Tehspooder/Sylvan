"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureProfile, requireUser } from "@/lib/auth";
import { friendlyDbError, readString } from "@/lib/text";
import type { ActionState } from "@/types";

export async function createCampaign(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const name = readString(formData, "name");
  const system = readString(formData, "system") || "D&D 5e";
  const startingDate = readString(formData, "starting_date");

  if (!name) return { error: "Name the chronicle." };
  if (name.length > 120) return { error: "Keep the name under 120 characters." };
  if (system.length > 80) return { error: "Keep the system name shorter." };
  if (startingDate && !/^\d{4}-\d{2}-\d{2}$/.test(startingDate)) {
    return { error: "Use a valid starting date." };
  }

  await ensureProfile(supabase, user);

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      owner_id: user.id,
      name,
      system,
      starting_date: startingDate || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: friendlyDbError(error?.message ?? "Could not create the chronicle.") };
  }

  revalidatePath("/app");
  redirect(`/app/${data.id}`);
}
