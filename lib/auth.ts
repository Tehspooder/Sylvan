import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export function displayNameFromUser(user: User): string | null {
  const fromMeta = user.user_metadata?.display_name;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  if (user.email) return user.email.split("@")[0] ?? null;
  return null;
}

export async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return;

  await supabase.from("profiles").insert({
    id: user.id,
    display_name: displayNameFromUser(user),
  });
}

export const requireUser = cache(async () => {
  if (!hasSupabaseEnv()) redirect("/");

  const supabase = await createClient();
  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect("/");
  return { supabase, user };
});
