import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RefreshResult {
  ingested: number;
  analyzed: number;
  aiExplained: number;
  demoOnly: boolean;
  message: string;
}

/**
 * Discovery -> normalization -> deterministic matching -> ranking -> AI explanation.
 * Deterministic scores are always computed; the AI layer only annotates the top
 * results and never changes the stored numeric scores.
 */
export const refreshOpportunities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RefreshResult> => {
    const { supabase, userId } = context;
    const { discoverJobs, listProviders } = await import("./jobs/registry");
    const { scoreMatch, deterministicRecommendation } = await import("./matching/engine");
    const { runAgent } = await import("./ai/run.server");
    const { isAiConfigured } = await import("./ai/provider.server");

    const [{ data: profile }, { data: skills }, { data: certs }, { data: education }] = await Promise.all([
      supabase.from("career_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("skills").select("name, years_experience").eq("user_id", userId),
      supabase.from("certifications").select("name").eq("user_id", userId),
      supabase.from("education").select("degree").eq("user_id", userId),
    ]);

    if (!profile) {
      return { ingested: 0, analyzed: 0, aiExplained: 0, demoOnly: true, message: "Complete onboarding first." };
    }

    const keywords = [
      profile.specialization,
      profile.sub_specialization,
      profile.field,
      ...(profile.target_roles ?? []),
      ...(skills ?? []).slice(0, 12).map((s) => s.name),
    ].filter((value): value is string => Boolean(value));

    const discovered = await discoverJobs({ keywords, limit: 12 });

    for (const job of discovered) {
      await supabase.from("jobs").upsert(
        {
          source: job.source,
          external_id: job.externalId,
          created_by: userId,
          is_demo: job.isDemo,
          company: job.company,
          title: job.title,
          description: job.description,
          location: job.location,
          location_normalized: job.locationNormalized,
          work_mode: job.workMode,
          employment_type: job.employmentType,
          seniority: job.seniority,
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          salary_currency: job.salaryCurrency,
          requirements: job.requirements,
          preferred_qualifications: job.preferredQualifications,
          skills: job.skills,
          certifications: job.certifications,
          degree_requirement: job.degreeRequirement,
          min_years_experience: job.minYearsExperience,
          industry: job.industry,
          posted_at: job.postedAt,
          application_url: job.applicationUrl,
          source_url: job.sourceUrl,
          status: "active",
        },
        { onConflict: "source,external_id" },
      );
    }

    const { data: jobRows } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("posted_at", { ascending: false })
      .limit(40);

    const highestDegree =
      (education ?? []).map((e) => e.degree).filter(Boolean).sort((a, b) => (b ?? "").length - (a ?? "").length)[0] ??
      null;

    const candidate = {
      level: profile.level,
      yearsExperience: profile.years_experience,
      skills: (skills ?? []).map((s) => ({ name: s.name, years: s.years_experience })),
      certifications: (certs ?? []).map((c) => c.name),
      highestDegree,
      targetRoles: profile.target_roles ?? [],
      targetIndustries: profile.target_industries ?? [],
      preferredLocations: profile.preferred_locations ?? [],
      workMode: profile.work_mode,
      salaryMin: profile.salary_min,
      openToRelocation: profile.open_to_relocation,
      specialization: profile.specialization,
    };

    const scored = (jobRows ?? []).map((job) => {
      const evidence = scoreMatch(candidate, {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        workMode: job.work_mode,
        seniority: job.seniority,
        minYearsExperience: job.min_years_experience,
        skills: job.skills ?? [],
        certifications: job.certifications ?? [],
        degreeRequirement: job.degree_requirement,
        industry: job.industry,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
      });
      return { job, evidence };
    });

    scored.sort((a, b) => b.evidence.matchScore - a.evidence.matchScore);

    let aiExplained = 0;
    const aiOn = isAiConfigured();

    for (const [index, { job, evidence }] of scored.entries()) {
      const recommendation = deterministicRecommendation(evidence.matchScore);
      let reasoning: string | null = null;
      let aiGenerated = false;

      if (aiOn && index < 5) {
        try {
          const result = await runAgent<{ reasoning: string }>({
            agent: "job_ranking_agent",
            temperature: 0.2,
            userPrompt: [
              `Candidate: ${JSON.stringify(candidate)}`,
              `Job: ${JSON.stringify({ title: job.title, company: job.company, location: job.location, seniority: job.seniority, skills: job.skills, requirements: job.requirements, min_years: job.min_years_experience })}`,
              `Deterministic evidence: ${JSON.stringify(evidence)}`,
              'Return JSON: { "reasoning": "3-5 short sentences explaining the match, concerns and the recommended action, citing only the supplied evidence" }.',
            ].join("\n\n"),
          });
          reasoning = result.data.reasoning;
          aiGenerated = true;
          aiExplained += 1;
          await supabase.from("ai_activity").insert({
            user_id: userId,
            agent: result.meta.agent,
            analysis_type: "job_ranking",
            input_ref: { job_id: job.id },
            provider: result.meta.provider,
            model: result.meta.model,
            prompt_version: result.meta.promptVersion,
            input_tokens: result.meta.inputTokens ?? null,
            output_tokens: result.meta.outputTokens ?? null,
            latency_ms: result.meta.latencyMs,
            summary: `Explained match for ${job.title} at ${job.company}.`,
          });
        } catch (error) {
          console.error("job_ranking_agent failed", error);
        }
      }

      const { data: analysis } = await supabase
        .from("job_analyses")
        .upsert(
          {
            user_id: userId,
            job_id: job.id,
            match_score: evidence.matchScore,
            skills_score: evidence.components.find((c) => c.key === "skills")?.score ?? null,
            experience_score: evidence.components.find((c) => c.key === "experience")?.score ?? null,
            education_score: evidence.components.find((c) => c.key === "education")?.score ?? null,
            certification_score: evidence.components.find((c) => c.key === "certification")?.score ?? null,
            location_score: evidence.components.find((c) => c.key === "location")?.score ?? null,
            compensation_score: evidence.components.find((c) => c.key === "compensation")?.score ?? null,
            seniority_score: evidence.components.find((c) => c.key === "seniority")?.score ?? null,
            industry_score: evidence.components.find((c) => c.key === "industry")?.score ?? null,
            trajectory_score: evidence.components.find((c) => c.key === "trajectory")?.score ?? null,
            preferences_score: evidence.components.find((c) => c.key === "preferences")?.score ?? null,
            evidence: JSON.parse(JSON.stringify(evidence)),
            strengths: evidence.strengths,
            gaps: evidence.gaps,
            risk_factors: evidence.risks,
            missing_qualifications: evidence.missingCertifications,
            ai_reasoning: reasoning,
            ai_generated: aiGenerated,
            recommendation,
            recommendation_priority: index + 1,
          },
          { onConflict: "user_id,job_id" },
        )
        .select("id")
        .maybeSingle();

      await supabase.from("job_recommendations").upsert(
        {
          user_id: userId,
          job_id: job.id,
          analysis_id: analysis?.id ?? null,
          rank: index + 1,
          priority: recommendation,
          reasoning,
          recommended_action: recommendation,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,job_id" },
      );
    }

    const providers = listProviders().filter((p) => p.configured && p.id !== "demo");

    return {
      ingested: discovered.length,
      analyzed: scored.length,
      aiExplained,
      demoOnly: providers.length === 0,
      message:
        providers.length === 0
          ? "Scored against the sample catalogue. Connect a live job source to score real postings."
          : "Scored against connected job sources.",
    };
  });