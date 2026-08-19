import type { NormalizedJob } from "./types";

const SENIORITY_PATTERNS: [RegExp, NormalizedJob["seniority"]][] = [
  [/\b(intern|student|co-?op)\b/i, "student"],
  [/\b(new grad|entry[- ]level|graduate)\b/i, "entry"],
  [/\b(junior|jr\.?|associate)\b/i, "junior"],
  [/\b(principal|distinguished)\b/i, "principal"],
  [/\b(director|vp|chief|head of)\b/i, "executive"],
  [/\b(lead|staff|manager)\b/i, "lead"],
  [/\b(senior|sr\.?)\b/i, "senior"],
];

export function inferSeniority(title: string, description = ""): NormalizedJob["seniority"] {
  const haystack = `${title} ${description.slice(0, 400)}`;
  for (const [pattern, level] of SENIORITY_PATTERNS) {
    if (pattern.test(haystack)) return level;
  }
  return "mid";
}

export function inferWorkMode(text: string): NormalizedJob["workMode"] {
  if (/\bfully remote|100% remote|\bremote\b/i.test(text)) return "remote";
  if (/\bhybrid\b/i.test(text)) return "hybrid";
  if (/\bon-?site|in office\b/i.test(text)) return "onsite";
  return null;
}

export function normalizeLocation(location: string | null): string | null {
  if (!location) return null;
  return location
    .replace(/\s+/g, " ")
    .replace(/,\s*(united states|usa|us)$/i, ", US")
    .trim();
}

export function extractYears(text: string): number | null {
  const match = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years|yrs)/i);
  return match?.[1] ? Number(match[1]) : null;
}

/** Stable fingerprint used for cross-source deduplication. */
export function contentHash(job: Pick<NormalizedJob, "company" | "title" | "location">): string {
  const raw = `${job.company}|${job.title}|${job.location ?? ""}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(36)}`;
}

export function dedupe(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = contentHash(job);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}