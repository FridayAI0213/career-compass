/** Internal normalized job shape. Every provider must produce this. */
export interface NormalizedJob {
  source: string;
  externalId: string;
  company: string;
  title: string;
  description: string;
  location: string | null;
  locationNormalized: string | null;
  workMode: "remote" | "hybrid" | "onsite" | "flexible" | null;
  employmentType: string | null;
  seniority:
    | "student"
    | "entry"
    | "junior"
    | "mid"
    | "senior"
    | "lead"
    | "principal"
    | "executive"
    | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  requirements: string[];
  preferredQualifications: string[];
  skills: string[];
  certifications: string[];
  degreeRequirement: string | null;
  minYearsExperience: number | null;
  industry: string | null;
  postedAt: string | null;
  deadlineAt: string | null;
  applicationUrl: string | null;
  sourceUrl: string | null;
  isDemo: boolean;
}

export interface JobQuery {
  keywords: string[];
  location?: string | null;
  workMode?: string | null;
  limit?: number;
}

/**
 * Provider contract for the job discovery layer. New sources (ATS feeds,
 * partner APIs, scraped-with-permission boards) implement this interface and
 * register themselves; nothing else in the app changes.
 */
export interface JobProvider {
  readonly id: string;
  readonly label: string;
  /** Whether the provider has the credentials/config it needs to run. */
  isConfigured(): boolean;
  fetchJobs(query: JobQuery): Promise<NormalizedJob[]>;
}