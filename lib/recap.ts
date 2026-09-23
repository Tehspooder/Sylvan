const DEFAULT_LIMIT = 400;

/**
 * "Last time on…" text. A written summary wins. Otherwise the opening of the
 * raw notes, collapsed to a single paragraph and cut near 400 characters.
 */
export function recapBlurb(
  summary: string | null | undefined,
  rawNotes: string,
  limit = DEFAULT_LIMIT,
): string {
  const manual = summary?.trim();
  if (manual) return manual;

  const text = rawNotes.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;

  const slice = text.slice(0, limit);
  const space = slice.lastIndexOf(" ");
  const cut = space > limit * 0.65 ? slice.slice(0, space) : slice;
  return `${cut.trimEnd()}…`;
}
