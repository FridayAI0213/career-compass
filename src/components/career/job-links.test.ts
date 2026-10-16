import { describe, expect, it } from "vitest";
import { resolveJobLinks } from "./job-links";

describe("resolveJobLinks", () => {
  it("shows one link when apply and listing are the same page", () => {
    const r = resolveJobLinks({ application_url: "https://boards.greenhouse.io/a/jobs/1?gh_src=x", source_url: "https://boards.greenhouse.io/a/jobs/1/" });
    expect(r.primary).toBe("https://boards.greenhouse.io/a/jobs/1?gh_src=x");
    expect(r.secondary).toBeNull();
  });
  it("keeps a genuinely different posting page as the one extra link", () => {
    const r = resolveJobLinks({ application_url: "https://jobs.lever.co/a/1/apply", source_url: "https://jobs.lever.co/a/1" });
    expect(r.secondary).toBe("https://jobs.lever.co/a/1");
  });
  it("falls back to the listing when there is no apply link", () => {
    const r = resolveJobLinks({ application_url: null, source_url: "https://x.com/jobs/1" });
    expect(r.primary).toBe("https://x.com/jobs/1");
    expect(r.secondary).toBeNull();
  });
  it("rejects non-http links", () => {
    expect(resolveJobLinks({ application_url: "javascript:alert(1)", source_url: null }).primary).toBeNull();
  });
});
