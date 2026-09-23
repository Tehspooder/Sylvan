"use client";

import { deleteEntry } from "@/actions/entries";
import { Button } from "@/components/ui/button";

export function DeleteEntryButton({
  campaignId,
  entryId,
}: {
  campaignId: string;
  entryId: string;
}) {
  return (
    <form
      action={deleteEntry}
      onSubmit={(event) => {
        if (!window.confirm("Remove this entry from the chronicle?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="entry_id" value={entryId} />
      <Button type="submit" variant="destructive" className="h-11 px-4 text-base">
        Remove entry
      </Button>
    </form>
  );
}
