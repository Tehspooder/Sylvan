import type { EntryType, ParsedEntry } from "@/types";

const TAG_PATTERN =
  /^\s*(?:[-*+]\s+)?(?:#{1,6}\s+)?@(person|place|plot|open)\b\s*(.*)$/i;

const HEADING_PATTERN = /^\s{0,3}#{1,6}\s+\S/;

const TYPE_BY_TAG: Record<string, EntryType> = {
  person: "person",
  place: "place",
  plot: "plot",
  open: "unresolved",
};

/**
 * Pull chronicle entries out of session notes.
 *
 * Tagged lines (and the paragraph under them) become entries.
 * Untagged prose stays in the notes and is not copied into the ledger.
 * The input string is never modified.
 *
 *   @person Name — text
 *   @place Name — text
 *   @plot Title — text
 *   @open Title — text
 *
 * A colon or a spaced hyphen also splits the title from the body.
 * Lines continue the body until a blank line, the next tag, or a heading.
 * Fenced code blocks and lines that start with \@ are left alone.
 */
export function parseNotes(raw: string): ParsedEntry[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const entries: ParsedEntry[] = [];
  let index = 0;
  let inFence = false;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      index += 1;
      continue;
    }

    if (inFence || /^\s*\\@/.test(line)) {
      index += 1;
      continue;
    }

    const tag = matchTag(line);
    if (!tag) {
      index += 1;
      continue;
    }

    const split = splitTitleBody(tag.rest);
    const extra: string[] = [];
    index += 1;

    while (index < lines.length) {
      const next = lines[index] ?? "";
      if (/^\s*```/.test(next)) break;
      if (next.trim() === "") break;
      if (/^\s*\\@/.test(next)) break;
      if (matchTag(next) || HEADING_PATTERN.test(next)) break;
      extra.push(next);
      index += 1;
    }

    const title = split.title.trim();
    if (!title) continue;

    const body = [split.body, extra.join("\n")]
      .filter((part) => part.trim() !== "")
      .join("\n")
      .trim();

    entries.push({ type: tag.type, title, body });
  }

  return entries;
}

function matchTag(line: string): { type: EntryType; rest: string } | null {
  const match = TAG_PATTERN.exec(line);
  if (!match) return null;
  const tag = (match[1] ?? "").toLowerCase();
  const type = TYPE_BY_TAG[tag];
  if (!type) return null;
  return { type, rest: match[2] ?? "" };
}

function splitTitleBody(rest: string): { title: string; body: string } {
  const trimmed = rest.trim();
  const match = /^(.*?)(?:\s*[—–]\s*|\s+-\s+|\s*:\s+)([\s\S]+)$/.exec(trimmed);
  if (match) {
    const title = (match[1] ?? "").trim();
    if (!title) return { title: "", body: "" };
    return { title, body: (match[2] ?? "").trim() };
  }
  return { title: trimmed, body: "" };
}
