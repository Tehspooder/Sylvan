"use client";

import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-4 py-16">
      <h1 className="font-heading text-4xl">Sylvan could not open that page</h1>
      <p className="mt-3 text-muted-foreground">
        Check that the Supabase URL and anon key are set, and that the migration has been applied.
      </p>
      {error.message ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <Button type="button" onClick={reset} className="mt-6 h-11 w-fit px-4 text-base">
        Try again
      </Button>
    </main>
  );
}
