import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center px-4 py-16">
      <EmptyState
        title="That page is not in the chronicle"
        body="The link may be old, or this record belongs to another table."
        action={<ButtonLink href="/app">Back to chronicles</ButtonLink>}
      />
    </main>
  );
}
