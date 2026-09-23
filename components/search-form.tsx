import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({
  campaignId,
  defaultValue = "",
}: {
  campaignId: string;
  defaultValue?: string;
}) {
  return (
    <form action={`/app/${campaignId}/search`} className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="chronicle-search">
        Search this chronicle
      </label>
      <Input
        id="chronicle-search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search people, places, notes…"
        className="h-11 px-3 text-base md:text-base"
      />
      <Button type="submit" className="h-11 px-4 text-base">
        Search
      </Button>
    </form>
  );
}
