import { describe, expect, it } from "vitest";
import { groundExplanation } from "./grounding";

const base = {
  strongEvidence: [
    { requirement: "React", support: "Lists React on the skills record" },
    { requirement: "Kubernetes", support: "Holds the CKA certification" },
  ],
  gaps: [],
  rationale: "Good overlap on front-end work.",
};

describe("groundExplanation", () => {
  it("drops strengths that cite nothing in the career record", () => {
    const out = groundExplanation(base, { recordTerms: ["React"], matchScore: 80, risks: [] });
    expect(out.strongEvidence.map((e) => e.requirement)).toEqual(["React"]);
    expect(out.removedClaims).toBe(1);
  });

  it("does not let a partial word count as evidence", () => {
    const out = groundExplanation(
      { ...base, strongEvidence: [{ requirement: "Java", support: "Uses JavaScript daily" }] },
      { recordTerms: ["Java"], matchScore: 80, risks: [] },
    );
    expect(out.strongEvidence).toHaveLength(0);
  });

  it("replaces a 'strong match' summary when the score is below 70", () => {
    const out = groundExplanation(
      { ...base, rationale: "This is a strong match." },
      { recordTerms: ["React"], matchScore: 55, risks: [] },
    );
    expect(out.rationale).not.toMatch(/strong match/i);
  });

  it("replaces a 'strong match' summary when a conflict exists", () => {
    const out = groundExplanation(
      { ...base, rationale: "An excellent fit." },
      { recordTerms: ["React"], matchScore: 85, risks: ["Salary below minimum"] },
    );
    expect(out.rationale).toContain("unresolved conflicts");
  });

  it("flags an empty career record", () => {
    const out = groundExplanation(base, { recordTerms: [], matchScore: 80, risks: [] });
    expect(out.strongEvidence).toHaveLength(0);
    expect(out.limitations.join(" ")).toMatch(/empty/);
  });
});
