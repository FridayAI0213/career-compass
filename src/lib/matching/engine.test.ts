import { describe, expect, it } from "vitest";
import { scoreMatch, deterministicRecommendation } from "./engine";
import type { CandidateSnapshot, JobSnapshot } from "./types";

const candidate: CandidateSnapshot = {
  level: "mid", yearsExperience: 4, skills: [{ name: "React" }, { name: "TypeScript" }],
  certifications: [], highestDegree: "Bachelor of Science", targetRoles: ["Frontend Engineer"],
  targetIndustries: [], preferredLocations: ["Austin"], workMode: "hybrid", salaryMin: 100000,
  openToRelocation: false, specialization: null,
};
const job: JobSnapshot = {
  id: "1", title: "Frontend Engineer", company: "Acme", location: "Austin, TX", workMode: "hybrid",
  seniority: "mid", minYearsExperience: 3, skills: ["React", "TypeScript"], certifications: [],
  degreeRequirement: null, industry: null, salaryMin: null, salaryMax: null,
};
const status = (key: string, j = job) => scoreMatch(candidate, j).components.find((c) => c.key === key)?.status;

describe("match status", () => {
  it("marks unpublished salary as unknown, not a conflict", () => expect(status("compensation")).toBe("unknown"));
  it("marks a salary below the minimum as a conflict", () =>
    expect(status("compensation", { ...job, salaryMax: 60000 })).toBe("conflict"));
  it("marks a posting with no location as unknown", () => expect(status("location", { ...job, location: null })).toBe("unknown"));
  it("marks matched skills as a match", () => expect(status("skills")).toBe("match"));
  it("is deterministic for identical inputs", () =>
    expect(scoreMatch(candidate, job)).toEqual(scoreMatch(candidate, job)));
  it("recommends skipping below 50", () => expect(deterministicRecommendation(49)).toBe("skip"));
});
