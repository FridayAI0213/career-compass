/**
 * Post-validation of AI match explanations. The model may only cite evidence
 * that exists in the candidate's record; anything else is dropped before it
 * reaches the user. Pure and deterministic so it can be unit tested.
 */
export interface ExplanationShape {
  strongEvidence: { requirement: string; support: string }[];
  gaps: { requirement: string; impact: "critical" | "secondary"; detail: string }[];
  rationale: string;
}

export interface GroundingContext {
  /** Names of every item in the user's record (skills, employers, titles, projects, certifications). */
  recordTerms: string[];
  matchScore: number;
  /** Deterministic risks, e.g. salary below minimum. Treated as unresolved conflicts. */
  risks: string[];
}

export interface GroundedExplanation extends ExplanationShape {
  removedClaims: number;
  limitations: string[];
}

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();

function citesRecord(text: string, terms: string[]): boolean {
  const haystack = ` ${norm(text)} `;
  return terms.some((term) => {
    const t = norm(term);
    return t.length >= 2 && haystack.includes(` ${t} `);
  });
}

const STRONG_WORDS = /\b(strong|excellent|ideal|perfect|great) (match|fit|candidate)\b/i;

export function groundExplanation(raw: ExplanationShape, ctx: GroundingContext): GroundedExplanation {
  const strongEvidence = raw.strongEvidence.filter((item) => citesRecord(item.support, ctx.recordTerms));
  const removedClaims = raw.strongEvidence.length - strongEvidence.length;
  const limitations: string[] = [];
  let rationale = raw.rationale.trim();

  if (removedClaims > 0) {
    limitations.push(
      `${removedClaims} claimed strength${removedClaims === 1 ? " was" : "s were"} removed because ${removedClaims === 1 ? "it does" : "they do"} not match anything in your career record.`,
    );
  }
  // Rationale must not overstate a score the engine rated weak, or ignore conflicts.
  if (STRONG_WORDS.test(rationale) && (ctx.matchScore < 70 || ctx.risks.length > 0)) {
    rationale = `This role scored ${ctx.matchScore}/100${ctx.risks.length ? " and has unresolved conflicts" : ""}, so it is not presented as a strong match.`;
    limitations.push("The written summary overstated the fit and was replaced.");
  }
  if (ctx.recordTerms.length === 0) {
    limitations.push("Your career record is empty, so no strengths can be verified.");
  }

  return { strongEvidence, gaps: raw.gaps, rationale, removedClaims, limitations };
}
