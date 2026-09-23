import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();

  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) redirect("/app");
    } catch {
      // Show the form so a bad URL is visible as a sign-in error instead of a crash.
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm tracking-[0.16em] text-primary uppercase">Campaign chronicle</p>
      <h1 className="mt-2 font-heading text-5xl text-foreground">Sylvan</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        Turn the night’s notes into a chronicle you can search: people, places, plot, and the threads still open.
      </p>
      <Card className="mt-8 text-base">
        <CardContent>
          {configured ? (
            <AuthForm
              initialError={
                params.error === "auth"
                  ? "That sign-in link did not work. Try again."
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-3 text-base leading-relaxed">
              <p>Sylvan needs a Supabase project before anyone can sign in.</p>
              <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
                <li>Copy <code className="text-foreground">.env.example</code> to <code className="text-foreground">.env.local</code>.</li>
                <li>Set <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</li>
                <li>Run the SQL migration, then restart the dev server.</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
