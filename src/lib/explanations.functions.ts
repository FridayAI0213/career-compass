import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * AI explanation layer for a match. The deterministic engine owns the numeric
 * score; this function only produces a human-readable interpretation of the
 * evidence that engine already recorded. It never writes a score.
 */
const explanationSchema = z.object({
  strongEvidence: z
    .array(
      z.object({
        requirement: z.string().min(1).max(200),
        support: z.string().min(1).max(400),
      }),
    )
    .max(8),
  gaps: z
    .array(
      z.object({
        requirement: z.string().min(1).max(200),
        impact: z.enum(["critical", "secondary"]),
        detail: z.string().min(1).max(400),
      }),
    )
    .max(8),
  rationale: z.string().min(1).max(1200),
});

export type MatchExplanation = z.infer<typeof explanationSchema>;

export interface ExplainMatchResult {
  explanation: MatchExplanation | null;
  status: "ready" | "unavailable";
  message?: string;
}

const input = z.object({ analysisId: z.string().uuid() });

export const explainMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }): Promise<ExplainMatchResult> => {
    const { runAgent } = await import("./ai/run.server");
    const { untrusted } = await import("./ai/prompts");
    const { isAiConfigured } = await import("./ai/provider.server");

    const { data: analysis } = await context.supabase
      .from("job_analyses")
      .select("id, match_score, recommendation, evidence, strengths, gaps, model_metadata, job:jobs(*)")
      .eq("id", data.analysisId)
      .maybeSingle();

    if (!analysis) return { explanation: null, status: "unavailable", message: "Analysis not found." };

    const cached = (analysis.model_metadata as { explanation?: unknown } | null)?.explanation;
    const cachedParsed = explanationSchema.safeParse(cached);
    if (cachedParsed.success) return { explanation: cachedParsed.data, status: "ready" };

    if (!isAiConfigured()) {
      return { explanation: null, status: "unavailable", message: "Explanation unavailable in this environment." };
    }

    const job = Array.isArray(analysis.job) ? analysis.job[0] : analysis.job;
    if (!job) return { explanation: null, status: "unavailable", message: "Opening not found." };

    const [{ data: skills }, { data: experiences }, { data: projects }, { data: certs }] = await Promise.all([
      context.supabase.from("skills").select("name, years_experience, proficiency").limit(60),
      context.supabase.from("experiences").select("employer, title, start_date, end_date, achievements").limit(20),
      context.supabase.from("projects").select("name, description, technologies").limit(20),
      context.supabase.from("certifications").select("name, issuer").limit(20),
    ]);

    try {
      const result = await runAgent<MatchExplanation>({
        agent: "match_explanation_agent",
        temperature: 0.2,
        validate: (raw) => explanationSchema.parse(raw),
        userPrompt: [
          `Deterministic match score (final, do not change): ${analysis.match_score}`,
          `Application recommendation (final): ${analysis.recommendation ?? "unspecified"}`,
          `Deterministic evidence: ${JSON.stringify(analysis.evidence)}`,
          `Candidate career record: ${JSON.stringify({ skills, experiences, projects, certifications: certs })}`,
          `Opening: ${JSON.stringify({ title: job.title, company: job.company, seniority: job.seniority, min_years: job.min_years_experience, skills: job.skills, requirements: job.requirements, certifications: job.certifications, degree: job.degree_requirement })}`,
          job.description ? `Opening description:\n${untrusted(job.description, 6000)}` : "",
          'Return JSON: { "strongEvidence": [{ "requirement", "support" }], "gaps": [{ "requirement", "impact": "critical" | "secondary", "detail" }], "rationale" }. Each "support" must name the specific career-record item it comes from. Return at most 5 items in each list.',
        ]
          .filter(Boolean)
          .join("\n\n"),
      });

      const metadata = {
        ...((analysis.model_metadata as Record<string, unknown> | null) ?? {}),
        explanation: result.data,
        explanation_meta: {
          agent: result.meta.agent,
          model: result.meta.model,
          prompt_version: result.meta.promptVersion,
          generated_at: new Date().toISOString(),
        },
      };

      await context.supabase
        .from("job_analyses")
        .update({ model_metadata: JSON.parse(JSON.stringify(metadata)), ai_generated: true })
        .eq("id", analysis.id);

      await context.supabase.from("ai_activity").insert({
        user_id: context.userId,
        agent: result.meta.agent,
        analysis_type: "match_explanation",
        input_ref: { analysis_id: analysis.id },
        provider: result.meta.provider,
        model: result.meta.model,
        prompt_version: result.meta.promptVersion,
        input_tokens: result.meta.inputTokens ?? null,
        output_tokens: result.meta.outputTokens ?? null,
        latency_ms: result.meta.latencyMs,
        summary: `Explained the match for ${job.title} at ${job.company}.`,
      });

      return { explanation: result.data, status: "ready" };
    } catch (error) {
      console.error("explainMatch failed", error instanceof Error ? error.name : "unknown error");
      return {
        explanation: null,
        status: "unavailable",
        message: "Explanation unavailable. The match score and evidence below are unaffected.",
      };
    }
  });
