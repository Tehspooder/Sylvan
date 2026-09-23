import { describe, expect, it } from "vitest";
import { parseNotes } from "@/lib/parseNotes";

const STRAHD_NOTES = `# Session 1 — The mists

The party woke on the road to Barovia.

@person Ireena Kolyana — Burgomaster's adopted daughter. She begged for an escort west.
She still wears the mark of Strahd's visits.

@place Village of Barovia — A damp village locked behind shutters.
The church bell is cracked.

@plot Burial of the burgomaster — Ismark needs the body taken to the church before night.

@open The letter under the floor — Father Donavich will not say who is screaming below.

They agreed to leave at dawn.
`;

describe("parseNotes", () => {
  it("extracts the four tag types and keeps continuation lines", () => {
    const entries = parseNotes(STRAHD_NOTES);

    expect(entries).toEqual([
      {
        type: "person",
        title: "Ireena Kolyana",
        body: "Burgomaster's adopted daughter. She begged for an escort west.\nShe still wears the mark of Strahd's visits.",
      },
      {
        type: "place",
        title: "Village of Barovia",
        body: "A damp village locked behind shutters.\nThe church bell is cracked.",
      },
      {
        type: "plot",
        title: "Burial of the burgomaster",
        body: "Ismark needs the body taken to the church before night.",
      },
      {
        type: "unresolved",
        title: "The letter under the floor",
        body: "Father Donavich will not say who is screaming below.",
      },
    ]);
  });

  it("does not change the original notes", () => {
    const original = "@person Ireena — leaves at dawn";
    parseNotes(original);
    expect(original).toBe("@person Ireena — leaves at dawn");
  });

  it("accepts hyphen, colon, and dash separators", () => {
    const notes = [
      "@person Madam Eva: Vistani seer",
      "@place Tser Pool - still water in the woods",
      "@plot The reading—three cards on the table",
      "@open Find Ireena – she left before dawn",
    ].join("\n");

    expect(parseNotes(notes)).toEqual([
      { type: "person", title: "Madam Eva", body: "Vistani seer" },
      { type: "place", title: "Tser Pool", body: "still water in the woods" },
      { type: "plot", title: "The reading", body: "three cards on the table" },
      { type: "unresolved", title: "Find Ireena", body: "she left before dawn" },
    ]);
  });

  it("reads tags on headings and list items, and ignores unknown tags", () => {
    const notes = [
      "## @person Strahd von Zarovich — The ancient",
      "- @place Castle Ravenloft — The count's seat",
      "@npc Someone — not a real tag",
      "@PLACE Vallaki — walled town",
    ].join("\n");

    expect(parseNotes(notes).map((entry) => entry.title)).toEqual([
      "Strahd von Zarovich",
      "Castle Ravenloft",
      "Vallaki",
    ]);
  });

  it("stops a body at a blank line, the next tag, or a heading", () => {
    const notes = [
      "@person Ismark — Ireena's brother",
      "He met them at the gate.",
      "",
      "This paragraph is just narrative.",
      "@place Blood of the Vine — tavern",
      "## Later",
      "Not part of the place.",
    ].join("\n");

    const entries = parseNotes(notes);
    expect(entries[0]?.body).toBe("Ireena's brother\nHe met them at the gate.");
    expect(entries[1]?.body).toBe("tavern");
    expect(entries).toHaveLength(2);
  });

  it("ignores fenced code and escaped tags", () => {
    const notes = ["```", "@person Example — do not save", "```", "\\@person Also skipped — no", ""].join(
      "\n",
    );
    expect(parseNotes(notes)).toEqual([]);
  });

  it("returns nothing for empty notes and blank titles", () => {
    expect(parseNotes("")).toEqual([]);
    expect(parseNotes("   \n\n")).toEqual([]);
    expect(parseNotes("@person   ")).toEqual([]);
    expect(parseNotes("@person — no name")).toEqual([]);
  });

  it("normalizes CRLF", () => {
    expect(parseNotes("@person Ireena — daughter\r\nShe is marked.")).toEqual([
      { type: "person", title: "Ireena", body: "daughter\nShe is marked." },
    ]);
  });
});
