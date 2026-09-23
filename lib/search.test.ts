import { describe, expect, it } from "vitest";
import { parseNotes } from "@/lib/parseNotes";
import { searchChronicle } from "@/lib/search";

const notes = `@person Ireena Kolyana — Burgomaster's daughter
@place Village of Barovia — fog and shutters
@plot Burial of the burgomaster — take the body to the church
@open The letter under the floor — Donavich is hiding it`;

describe("searchChronicle", () => {
  const entries = parseNotes(notes).map((entry, index) => ({
    id: `entry-${index}`,
    ...entry,
    session_id: "session-1",
  }));

  const sessions = [
    {
      id: "session-1",
      title: "The mists",
      raw_notes: notes,
      summary: null,
      session_date: "2024-10-01",
    },
    {
      id: "session-2",
      title: "The road west",
      raw_notes: "They spoke of Vallaki and kept walking.",
      summary: "A quiet road.",
      session_date: "2024-10-08",
    },
  ];

  it("finds people, places, plot, and open threads by name", () => {
    expect(searchChronicle("Ireena", sessions, entries).entries.map((entry) => entry.type)).toEqual([
      "person",
    ]);
    expect(searchChronicle("barovia", sessions, entries).entries.map((entry) => entry.type)).toEqual([
      "place",
    ]);
    expect(searchChronicle("burial", sessions, entries).entries.map((entry) => entry.title)).toEqual([
      "Burial of the burgomaster",
    ]);
    expect(searchChronicle("Donavich", sessions, entries).entries.map((entry) => entry.type)).toEqual([
      "unresolved",
    ]);
  });

  it("finds sessions by title, notes, and summary", () => {
    expect(searchChronicle("Vallaki", sessions, entries).sessions.map((session) => session.id)).toEqual([
      "session-2",
    ]);
    expect(searchChronicle("quiet road", sessions, entries).sessions.map((session) => session.id)).toEqual([
      "session-2",
    ]);
    expect(searchChronicle("The mists", sessions, entries).sessions.map((session) => session.id)).toEqual([
      "session-1",
    ]);
  });

  it("returns nothing for a blank query", () => {
    expect(searchChronicle("   ", sessions, entries)).toEqual({ sessions: [], entries: [] });
  });
});
