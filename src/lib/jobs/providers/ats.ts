import { extractYears, inferSeniority, inferWorkMode, normalizeLocation } from "../normalize";
import type { JobProvider, JobQuery, NormalizedJob } from "../types";

/**
 * Real listings from employers' public ATS job boards (Greenhouse and Lever).
 * These endpoints are public, unauthenticated and published by the employers
 * for exactly this purpose. Nothing is invented: fields missing from a posting
 * stay null/empty.
 */
export const GREENHOUSE_BOARDS: { token: string; company: string; industry: string }[] = [
  { token: "stripe", company: "Stripe", industry: "Financial Technology" },
  { token: "figma", company: "Figma", industry: "Software" },
  { token: "discord", company: "Discord", industry: "Software" },
  { token: "cloudflare", company: "Cloudflare", industry: "Internet Infrastructure" },
  { token: "gitlab", company: "GitLab", industry: "Software" },
  { token: "airbnb", company: "Airbnb", industry: "Travel & Hospitality" },
];

export const LEVER_BOARDS: { token: string; company: string; industry: string }[] = [
  { token: "palantir", company: "Palantir", industry: "Software" },
  { token: "spotify", company: "Spotify", industry: "Media & Entertainment" },
  { token: "zoox", company: "Zoox", industry: "Autonomous Vehicles" },
];

const PER_BOARD = 4;
const TIMEOUT_MS = 8000;

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function decodeEntities(html: string): string {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

const REQ_HEADING = /qualif|requirement|you have|you'll need|you bring|looking for|about you|must have|skills/i;
const PREF_HEADING = /preferred|nice to have|bonus|plus/i;

/** Pulls bullet items under requirement/qualification headings of a posting. */
export function extractSections(html: string): { requirements: string[]; preferred: string[] } {
  const decoded = decodeEntities(html);
  const parts = decoded.split(/<(?:h[1-6]|strong|b)[^>]*>/i);
  const requirements: string[] = [];
  const preferred: string[] = [];
  for (const part of parts) {
    const heading = stripTags(part.split(/<\/(?:h[1-6]|strong|b)>/i)[0] ?? "").slice(0, 120);
    const items = [...part.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => stripTags(m[1] ?? ""))
      .filter((t) => t.length > 3 && t.length < 400);
    if (!items.length) continue;
    if (PREF_HEADING.test(heading)) preferred.push(...items);
    else if (REQ_HEADING.test(heading)) requirements.push(...items);
  }
  return { requirements: requirements.slice(0, 10), preferred: preferred.slice(0, 6) };
}

export function extractDegree(text: string): string | null {
  if (/\b(ph\.?d|doctorate)\b/i.test(text)) return "PhD";
  if (/\b(master'?s|m\.s\.|msc|mba)\b/i.test(text)) return "Master";
  if (/\b(bachelor'?s|b\.s\.|b\.a\.|bsc|undergraduate degree)\b/i.test(text)) return "Bachelor";
  return null;
}

/** Only skills the posting actually names, checked against the user's own terms. */
export function extractSkills(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  const out = new Set<string>();
  for (const k of keywords) {
    const term = k.trim();
    if (term.length < 2 || term.length > 40) continue;
    const re = new RegExp(`(^|[^a-z0-9+#])${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9+#])`);
    if (re.test(lower)) out.add(term);
  }
  return [...out].slice(0, 15);
}

/** Title relevance: share of keyword tokens found in the title. */
export function titleRelevance(title: string, keywords: string[]): number {
  const t = title.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    for (const token of k.toLowerCase().split(/[^a-z0-9+#]+/)) {
      if (token.length >= 3 && t.includes(token)) hits += 1;
    }
  }
  return hits;
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

interface GhListJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  location?: { name?: string };
}
interface GhDetail extends GhListJob {
  content?: string;
}

async function fetchGreenhouse(
  board: (typeof GREENHOUSE_BOARDS)[number],
  keywords: string[],
): Promise<NormalizedJob[]> {
  const list = await getJson<{ jobs: GhListJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs`,
  );
  const picked = list.jobs
    .map((j) => ({ j, score: titleRelevance(j.title, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_BOARD);
  const details = await Promise.all(
    picked.map(({ j }) =>
      getJson<GhDetail>(`https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs/${j.id}`).catch(
        () => j as GhDetail,
      ),
    ),
  );
  return details.map((d) => {
    const html = d.content ?? "";
    const text = stripTags(html);
    const { requirements, preferred } = extractSections(html);
    const reqText = requirements.join(" ") || text;
    const location = d.location?.name ?? null;
    const url = safeUrl(d.absolute_url);
    return {
      source: "greenhouse",
      externalId: `${board.token}:${d.id}`,
      company: board.company,
      title: d.title,
      description: text.slice(0, 4000),
      location,
      locationNormalized: normalizeLocation(location),
      workMode: inferWorkMode(`${location ?? ""} ${text.slice(0, 1500)}`),
      employmentType: null,
      seniority: inferSeniority(d.title),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",
      requirements,
      preferredQualifications: preferred,
      skills: extractSkills(text, keywords),
      certifications: [],
      degreeRequirement: extractDegree(reqText),
      minYearsExperience: extractYears(reqText),
      industry: board.industry,
      postedAt: d.first_published ?? d.updated_at ?? null,
      deadlineAt: null,
      applicationUrl: url,
      sourceUrl: url,
      isDemo: false,
    } satisfies NormalizedJob;
  });
}

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  descriptionPlain?: string;
  workplaceType?: string;
  categories?: { location?: string; commitment?: string };
  lists?: { text: string; content: string }[];
  salaryRange?: { min?: number; max?: number; currency?: string };
}

async function fetchLever(
  board: (typeof LEVER_BOARDS)[number],
  keywords: string[],
): Promise<NormalizedJob[]> {
  const postings = await getJson<LeverPosting[]>(`https://api.lever.co/v0/postings/${board.token}?mode=json`);
  const picked = postings
    .map((p) => ({ p, score: titleRelevance(p.text, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, PER_BOARD);
  return picked.map(({ p }) => {
    const requirements: string[] = [];
    const preferred: string[] = [];
    for (const list of p.lists ?? []) {
      const items = [...list.content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1] ?? ""));
      if (PREF_HEADING.test(list.text)) preferred.push(...items);
      else if (REQ_HEADING.test(list.text)) requirements.push(...items);
    }
    const description = p.descriptionPlain ?? "";
    const reqText = requirements.join(" ") || description;
    const fullText = `${description} ${requirements.join(" ")} ${preferred.join(" ")}`;
    const location = p.categories?.location ?? null;
    const wt = p.workplaceType;
    return {
      source: "lever",
      externalId: `${board.token}:${p.id}`,
      company: board.company,
      title: p.text,
      description: description.slice(0, 4000),
      location,
      locationNormalized: normalizeLocation(location),
      workMode: wt === "remote" ? "remote" : wt === "hybrid" ? "hybrid" : wt === "onsite" ? "onsite" : inferWorkMode(fullText),
      employmentType: p.categories?.commitment ?? null,
      seniority: inferSeniority(p.text),
      salaryMin: p.salaryRange?.min ?? null,
      salaryMax: p.salaryRange?.max ?? null,
      salaryCurrency: p.salaryRange?.currency ?? "USD",
      requirements: requirements.slice(0, 10),
      preferredQualifications: preferred.slice(0, 6),
      skills: extractSkills(fullText, keywords),
      certifications: [],
      degreeRequirement: extractDegree(reqText),
      minYearsExperience: extractYears(reqText),
      industry: board.industry,
      postedAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
      deadlineAt: null,
      applicationUrl: safeUrl(p.applyUrl),
      sourceUrl: safeUrl(p.hostedUrl),
      isDemo: false,
    } satisfies NormalizedJob;
  });
}

export const atsJobProvider: JobProvider = {
  id: "public-ats",
  label: "Employer job boards (Greenhouse, Lever)",
  isConfigured: () => true,
  async fetchJobs(query: JobQuery) {
    const keywords = query.keywords.filter(Boolean);
    if (!keywords.length) return [];
    const tasks = [
      ...GREENHOUSE_BOARDS.map((b) => fetchGreenhouse(b, keywords)),
      ...LEVER_BOARDS.map((b) => fetchLever(b, keywords)),
    ];
    const settled = await Promise.allSettled(tasks);
    return settled.flatMap((r) => {
      if (r.status === "fulfilled") return r.value;
      console.error("ATS board failed", r.reason);
      return [];
    });
  },
};
