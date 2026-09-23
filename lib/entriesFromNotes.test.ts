import { describe, expect, it } from "vitest";
import { entriesFromNotes } from "@/lib/entriesFromNotes";

describe("entriesFromNotes", () => {
  it("maps tagged lines onto parsed entry rows", () => {
    const rows = entriesFromNotes(
      "campaign-1",
      "session-1",
      "@person Ireena Kolyana — marked\n@open The letter — unread",
    );

    expect(rows).toEqual([
      {
        campaign_id: "campaign-1",
        session_id: "session-1",
        type: "person",
        title: "Ireena Kolyana",
        body: "marked",
        source: "parsed",
      },
      {
        campaign_id: "campaign-1",
        session_id: "session-1",
        type: "unresolved",
        title: "The letter",
        body: "unread",
        source: "parsed",
      },
    ]);
  });

  it("skips hand-edited entries with the same type and title", () => {
    const rows = entriesFromNotes(
      "campaign-1",
      "session-1",
      "@person Ireena Kolyana — from notes\n@place Barovia — fog",
      [{ type: "person", title: "  ireena kolyana " }],
    );

    expect(rows.map((row) => row.title)).toEqual(["Barovia"]);
  });
});
