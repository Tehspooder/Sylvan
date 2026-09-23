import { cn } from "@/lib/utils";
import { ENTRY_TYPE_LABEL, type EntryType } from "@/types";

const TONE: Record<EntryType, string> = {
  person: "bg-stone-200/15 text-stone-100",
  place: "bg-emerald-200/15 text-emerald-100",
  plot: "bg-amber-200/20 text-amber-100",
  unresolved: "bg-orange-300/15 text-orange-100",
  other: "bg-muted text-muted-foreground",
};

export function TypeBadge({ type }: { type: EntryType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        TONE[type],
      )}
    >
      {ENTRY_TYPE_LABEL[type]}
    </span>
  );
}
