import Link from "next/link";
import { TypeBadge } from "@/components/type-badge";
import { formatDate, snippet } from "@/lib/format";
import type { EntryType } from "@/types";

export type EntryListItem = {
  id: string;
  title: string;
  body: string;
  type: EntryType;
  session_id: string | null;
};

export function EntryList({
  campaignId,
  entries,
  sessionsById,
}: {
  campaignId: string;
  entries: EntryListItem[];
  sessionsById?: Map<string, { title: string; session_date: string }>;
}) {
  if (entries.length === 0) return null;

  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {entries.map((entry) => {
          const session = entry.session_id ? sessionsById?.get(entry.session_id) : undefined;
          return (
            <li key={entry.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={entry.type} />
                {session ? (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(session.session_date)}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/app/${campaignId}/entries/${entry.id}`}
                className="mt-2 block text-lg font-medium underline-offset-4 hover:underline"
              >
                {entry.title}
              </Link>
              {entry.body ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {snippet(entry.body)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-base">
          <thead className="text-sm text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Session</th>
              <th className="py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const session = entry.session_id ? sessionsById?.get(entry.session_id) : undefined;
              return (
                <tr key={entry.id} className="border-b border-border/80 align-top">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/app/${campaignId}/entries/${entry.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {entry.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <TypeBadge type={entry.type} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {session ? (
                      <Link
                        href={`/app/${campaignId}/sessions/${entry.session_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {session.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">{snippet(entry.body, 120)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
