import { ButtonLink } from "@/components/button-link";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <EmptyState
        title="This chronicle is not on your shelf"
        body="It may have been removed, or you do not have access. Return to your chronicles and open one from the list."
        action={<ButtonLink href="/app">Back to chronicles</ButtonLink>}
      />
    </div>
  );
}
