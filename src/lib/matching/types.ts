export interface CandidateSnapshot {
  level: string | null;
  yearsExperience: number | null;
  skills: { name: string; years?: number | null }[];
  certifications: string[];
  highestDegree: string | null;
  targetRoles: string[];
  targetIndustries: string[];
  preferredLocations: string[];
  workMode: string | null;
  salaryMin: number | null;
  openToRelocation: boolean | null;
  specialization: string | null;
}

export interface JobSnapshot {
  id: string;
  title: string;
  company: string;
  location: string | null;
  workMode: string | null;
  seniority: string | null;
  minYearsExperience: number | null;
  skills: string[];
  certifications: string[];
  degreeRequirement: string | null;
  industry: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface ComponentScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface MatchEvidence {
  matchScore: number;
  components: ComponentScore[];
  matchedSkills: string[];
  missingSkills: string[];
  missingCertifications: string[];
  strengths: string[];
  gaps: string[];
  risks: string[];
}