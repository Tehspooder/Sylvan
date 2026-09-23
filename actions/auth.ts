"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { friendlyAuthError, isEmail, readString } from "@/lib/text";
import type { ActionState } from "@/types";

async function requestOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { error: "Add the Supabase URL and anon key before signing in." };
  }

  const email = readString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email) || !password) {
    return { error: "Enter the email and password for your account." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendlyAuthError(error.message) };

  redirect("/app");
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { error: "Add the Supabase URL and anon key before creating an account." };
  }

  const email = readString(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = readString(formData, "display_name");

  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (displayName.length > 80) return { error: "Keep the name under 80 characters." };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) return { error: friendlyAuthError(error.message) };
  if (!data.session) {
    return {
      message:
        "Check your email to confirm the account, then sign in. For local play, turn off email confirmation in the Supabase dashboard.",
    };
  }

  redirect("/app");
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
