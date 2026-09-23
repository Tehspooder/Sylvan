import { describe, expect, it } from "vitest";
import { recapBlurb } from "@/lib/recap";

describe("recapBlurb", () => {
  it("prefers a written summary", () => {
    expect(recapBlurb("Strahd invited them.", "@person Ireena — marked")).toBe(
      "Strahd invited them.",
    );
  });

  it("uses the opening of the notes when there is no summary", () => {
    expect(recapBlurb("  ", "The party woke\non the road.")).toBe(
      "The party woke on the road.",
    );
  });

  it("cuts long notes near a word boundary", () => {
    const notes = `${"mist ".repeat(120)}castle`;
    const blurb = recapBlurb(null, notes, 400);
    expect(blurb.endsWith("…")).toBe(true);
    expect(blurb.length).toBeLessThanOrEqual(401);
    expect(blurb.includes("castle")).toBe(false);
  });
});
