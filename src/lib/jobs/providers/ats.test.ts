import { describe, it, expect } from "vitest";
import { extractDegree, extractSections, extractSkills, titleRelevance } from "./ats";

describe("ATS extraction", () => {
  it("only reports skills named in the posting", () => {
    expect(extractSkills("We use Python and SQL daily", ["Python", "Rust", "SQL"])).toEqual(["Python", "SQL"]);
  });
  it("returns null degree when the posting names none", () => {
    expect(extractDegree("Great team, fast pace")).toBeNull();
    expect(extractDegree("Bachelor's degree in CS")).toBe("Bachelor");
  });
  it("pulls bullets under qualification headings only", () => {
    const html = "&lt;h3&gt;What you'll do&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;Build things&lt;/li&gt;&lt;/ul&gt;&lt;h3&gt;Qualifications&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;3+ years Go&lt;/li&gt;&lt;/ul&gt;";
    expect(extractSections(html).requirements).toEqual(["3+ years Go"]);
  });
  it("ignores titles with no keyword overlap", () => {
    expect(titleRelevance("Account Executive", ["software engineer"])).toBe(0);
  });
});
