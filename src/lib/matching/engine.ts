import type { CandidateSnapshot, ComponentScore, JobSnapshot, MatchEvidence } from "./types";

/**
 * Deterministic candidate/job matching. This is intentionally NOT AI: scores,
 * gaps and evidence are computed from structured data so they are stable,
 * auditable and reproducible. The AI layer only *interprets* this output.
 */

const LEVEL_ORDER = [
  "student",
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "executive",
];

const DEGREE_ORDER = ["none", "certificate", "associate", "bachelor", "master", "doctorate"];

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, "").trim();
}

/** Matches an abbreviation as a standalone word so "ba" can't match "database". */
function hasWord(haystack: string, ...words: string[]): boolean {
  return words.some((word) => new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`).test(haystack));
}

function degreeRank(value: string | null): number {
  if (!value) return -1;
  const v = value.toLowerCase().replace(/\./g, "");
  // Professional doctorates rank with doctorates, not below a bachelor's.
  if (v.includes("phd") || v.includes("doctor") || hasWord(v, "md", "jd", "dds", "dvm", "pharmd", "dnp", "edd"))
    return 5;
  if (v.includes("master") || hasWord(v, "msc", "ms", "ma", "mba", "meng", "msn", "mph", "llm")) return 4;
  if (v.includes("bachelor") || hasWord(v, "bsc", "bs", "ba", "beng", "bsn")) return 3;
  if (v.includes("associate") || hasWord(v, "aa", "as", "adn")) return 2;
  if (v.includes("certificate") || v.includes("diploma") || v.includes("licence") || v.includes("license")) return 1;
  if (v.includes("none") || v.includes("not required") || v.includes("no degree")) return 0;
  return -1;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** "React" evidences "React.js"; exact tokens win, containment is the fallback. */
function skillMatches(candidateSkills: Set<string>, jobSkill: string): boolean {
  const target = norm(jobSkill);
  if (!target) return false;
  if (candidateSkills.has(target)) return true;
  for (const owned of candidateSkills) {
    if (owned.length < 3 || target.length < 3) continue;
    if (owned.includes(target) || target.includes(owned)) return true;
  }
  return false;
}

export function scoreMatch(candidate: CandidateSnapshot, job: JobSnapshot): MatchEvidence {
  const candidateSkills = new Set(candidate.skills.map((s) => norm(s.name)).filter(Boolean));
  const jobSkills = job.skills.map(norm).filter(Boolean);

  const matchedSkills = job.skills.filter((s) => skillMatches(candidateSkills, s));
  const missingSkills = job.skills.filter((s) => !skillMatches(candidateSkills, s));
  const skillsScore = jobSkills.length === 0 ? 60 : (matchedSkills.length / jobSkills.length) * 100;


  // Experience
  const years = candidate.yearsExperience ?? 0;
  const required = job.minYearsExperience ?? 0;
  let experienceScore = 100;
  let experienceDetail = "No explicit experience requirement listed.";
  if (required > 0) {
    const ratio = years / required;
    experienceScore = clamp(ratio >= 1 ? 100 : 40 + ratio * 60);
    experienceDetail = `Candidate has ${years} yr vs ${required} yr requested.`;
  }

  // Seniority
  const candidateLevel = candidate.level ? LEVEL_ORDER.indexOf(candidate.level) : -1;
  const jobLevel = job.seniority ? LEVEL_ORDER.indexOf(job.seniority) : -1;
  let seniorityScore = 70;
  let seniorityDetail = "Seniority not specified on one side.";
  if (candidateLevel >= 0 && jobLevel >= 0) {
    const delta = jobLevel - candidateLevel;
    seniorityScore = clamp(100 - Math.abs(delta) * 22 - (delta > 0 ? 8 : 0));
    seniorityDetail =
      delta === 0
        ? "Seniority aligns exactly."
        : delta > 0
          ? `Role sits ${delta} level(s) above current level.`
          : `Role sits ${Math.abs(delta)} level(s) below current level.`;
  }

  // Education
  const candidateDegree = degreeRank(candidate.highestDegree);
  const requiredDegree = degreeRank(job.degreeRequirement);
  let educationScore = 75;
  let educationDetail = "No degree requirement recorded.";
  if (requiredDegree >= 0) {
    if (candidateDegree < 0) {
      educationScore = 45;
      educationDetail = "Employer lists a degree requirement; no degree recorded on profile.";
    } else {
      educationScore = candidateDegree >= requiredDegree ? 100 : clamp(60 - (requiredDegree - candidateDegree) * 15);
      educationDetail = `${DEGREE_ORDER[Math.max(candidateDegree, 0)]} held vs ${DEGREE_ORDER[requiredDegree]} requested.`;
    }
  }

  // Certifications
  const candidateCerts = new Set(candidate.certifications.map(norm));
  const missingCertifications = job.certifications.filter((c) => !candidateCerts.has(norm(c)));
  const certificationScore =
    job.certifications.length === 0
      ? 100
      : ((job.certifications.length - missingCertifications.length) / job.certifications.length) * 100;

  // Location / work mode
  const jobLocation = norm(job.location ?? "");
  const locationMatch = candidate.preferredLocations.some(
    (loc) => jobLocation.includes(norm(loc)) || norm(loc).includes(jobLocation),
  );
  const remoteFriendly = job.workMode === "remote" || candidate.workMode === "flexible";
  let locationScore = 55;
  let locationDetail = "Location not in stated preferences.";
  if (remoteFriendly) {
    locationScore = 95;
    locationDetail = "Remote or flexible arrangement.";
  } else if (locationMatch) {
    locationScore = 100;
    locationDetail = `${job.location} is a preferred location.`;
  } else if (candidate.openToRelocation) {
    locationScore = 72;
    locationDetail = "Outside preferred locations, but candidate is open to relocation.";
  } else if (candidate.preferredLocations.length === 0) {
    locationScore = 70;
    locationDetail = "No location preferences recorded.";
  }

  // Work mode preference
  const workModeScore =
    !candidate.workMode || !job.workMode
      ? 70
      : candidate.workMode === job.workMode || candidate.workMode === "flexible"
        ? 100
        : job.workMode === "hybrid" || candidate.workMode === "hybrid"
          ? 70
          : 40;

  // Compensation
  let compensationScore = 70;
  let compensationDetail = "Compensation not published.";
  if (job.salaryMax != null && candidate.salaryMin != null) {
    if (job.salaryMax >= candidate.salaryMin) {
      compensationScore = 100;
      compensationDetail = "Posted range meets the candidate's minimum.";
    } else {
      const ratio = job.salaryMax / candidate.salaryMin;
      compensationScore = clamp(ratio * 80);
      compensationDetail = "Posted maximum is below the candidate's stated minimum.";
    }
  }

  // Industry
  const industryScore =
    candidate.targetIndustries.length === 0 || !job.industry
      ? 70
      : candidate.targetIndustries.some((i) => norm(job.industry ?? "").includes(norm(i)))
        ? 100
        : 50;

  // Career trajectory / target roles
  const titleNorm = norm(job.title);
  const trajectoryScore =
    candidate.targetRoles.length === 0
      ? 65
      : candidate.targetRoles.some((r) => titleNorm.includes(norm(r)) || norm(r).includes(titleNorm))
        ? 100
        : candidate.specialization && titleNorm.includes(norm(candidate.specialization))
          ? 85
          : 55;

  const components: ComponentScore[] = [
    { key: "skills", label: "Skills", score: clamp(skillsScore), weight: 0.26, detail: `${matchedSkills.length}/${job.skills.length || 0} listed skills matched.` },
    { key: "experience", label: "Experience", score: clamp(experienceScore), weight: 0.16, detail: experienceDetail },
    { key: "trajectory", label: "Career trajectory", score: clamp(trajectoryScore), weight: 0.13, detail: "Alignment with stated target roles." },
    { key: "seniority", label: "Seniority", score: clamp(seniorityScore), weight: 0.1, detail: seniorityDetail },
    { key: "location", label: "Location", score: clamp(locationScore), weight: 0.1, detail: locationDetail },
    { key: "education", label: "Education", score: clamp(educationScore), weight: 0.07, detail: educationDetail },
    { key: "certification", label: "Certifications", score: clamp(certificationScore), weight: 0.06, detail: missingCertifications.length ? `Missing: ${missingCertifications.join(", ")}` : "All requested certifications held." },
    { key: "compensation", label: "Compensation", score: clamp(compensationScore), weight: 0.06, detail: compensationDetail },
    { key: "industry", label: "Industry", score: clamp(industryScore), weight: 0.03, detail: job.industry ? `Posting industry: ${job.industry}.` : "Industry not stated." },
    { key: "preferences", label: "Work mode", score: clamp(workModeScore), weight: 0.03, detail: job.workMode ? `Role is ${job.workMode}.` : "Work mode not stated." },
  ];

  const matchScore = clamp(components.reduce((sum, c) => sum + c.score * c.weight, 0));

  const strengths: string[] = [];
  const gaps: string[] = [];
  const risks: string[] = [];

  if (matchedSkills.length > 0) strengths.push(`Direct skill overlap: ${matchedSkills.slice(0, 6).join(", ")}.`);
  components
    .filter((c) => c.score >= 90 && c.key !== "skills")
    .forEach((c) => strengths.push(`${c.label}: ${c.detail}`));

  if (missingSkills.length > 0) gaps.push(`Skills not evidenced on profile: ${missingSkills.slice(0, 6).join(", ")}.`);
  if (missingCertifications.length > 0) gaps.push(`Certifications not held: ${missingCertifications.join(", ")}.`);
  if (educationScore < 70) gaps.push(educationDetail);

  if (required > 0 && years < required) risks.push(`Employer requests ${required} yr of experience; profile shows ${years} yr.`);
  if (seniorityScore < 60) risks.push(seniorityDetail);
  if (compensationScore < 70) risks.push(compensationDetail);
  if (locationScore < 60) risks.push(locationDetail);

  return {
    matchScore,
    components,
    matchedSkills,
    missingSkills,
    missingCertifications,
    strengths,
    gaps,
    risks,
  };
}

export type Recommendation = "apply_immediately" | "apply" | "consider" | "low_priority" | "skip";

export function deterministicRecommendation(score: number): Recommendation {
  if (score >= 90) return "apply_immediately";
  if (score >= 78) return "apply";
  if (score >= 65) return "consider";
  if (score >= 50) return "low_priority";
  return "skip";
}

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  apply_immediately: "Apply today",
  apply: "Apply this week",
  consider: "Consider",
  low_priority: "Low priority",
  skip: "Skip",
};

export function matchBand(score: number): string {
  if (score >= 90) return "Strong match";
  if (score >= 80) return "Excellent fit";
  if (score >= 70) return "Good match";
  if (score >= 55) return "Partial match";
  return "Weak match";
}