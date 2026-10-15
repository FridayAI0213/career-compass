import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RefreshResult {
  ingested: number;
  analyzed: number;
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

    const [{ data: profile }, { data: skills }, { data: certs }, { data: education }] =
      await Promise.all([
        supabase.from("career_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("skills").select("name, years_experience").eq("user_id", userId),
        supabase.from("certifications").select("name").eq("user_id", userId),
        supabase.from("education").select("degree").eq("user_id", userId),
      ]);

    if (!profile) {
      return { ingested: 0, analyzed: 0, demoOnly: true, message: "Complete onboarding first." };
    }

    const keywords = [
      profile.specialization,
      profile.sub_specialization,
      profile.field,
      ...(profile.target_roles ?? []),
      ...(skills ?? []).slice(0, 12).map((s) => s.name),
    ].filter((value): value is string => Boolean(value));

    const discovered = await discoverJobs({ keywords, limit: 40 });

    // Catalogue postings are shared system data, not user records: they are
    // written by the server (caller already verified above) with no creator,
    // so no user's id is ever visible on a shared row.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const job of discovered) {
      await supabaseAdmin.from("jobs").upsert(
        {
          source: job.source,
          external_id: job.externalId,
          created_by: null,
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

    // Closed-listing detection: any stored posting no longer on its employer's
    // board is marked closed. Boards that failed to respond are skipped.
    try {
      const { listOpenIds } = await import("./jobs/providers/ats");
      const open = await listOpenIds();
      const { data: stored } = await supabaseAdmin
        .from("jobs")
        .select("id, source, external_id")
        .in("source", ["greenhouse", "lever"])
        .eq("status", "active");
      const closedIds = (stored ?? [])
        .filter((row) => {
          const token = (row.external_id ?? "").split(":")[0];
          const board = open.get(`${row.source}:${token}`);
          return board ? !board.ids.has(row.external_id ?? "") : false;
        })
        .map((row) => row.id);
      if (closedIds.length) {
        await supabaseAdmin.from("jobs").update({ status: "closed" }).in("id", closedIds);
        await supabase.from("job_recommendations").delete().eq("user_id", userId).in("job_id", closedIds);
      }
    } catch (error) {
      console.error("Closed-listing check failed", error);
    }

    // Sample rows are retired from discovery: drop this user's sample-based
    // recommendations so only real employer postings are ranked.
    const { data: demoRows } = await supabase.from("jobs").select("id").eq("is_demo", true);
    const demoIds = (demoRows ?? []).map((r) => r.id);
    if (demoIds.length) {
      await supabase.from("job_recommendations").delete().eq("user_id", userId).in("job_id", demoIds);
    }

    const { data: jobRows } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .eq("is_demo", false)
      .order("posted_at", { ascending: false })
      .limit(40);

    const highestDegree =
      (education ?? [])
        .map((e) => e.degree)
        .filter(Boolean)
        .sort((a, b) => (b ?? "").length - (a ?? "").length)[0] ?? null;

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

    // Scoring is deterministic and never waits on a model. Explanations are
    // generated on demand from the opportunity list (see explainMatch).
    for (const [index, { job, evidence }] of scored.entries()) {
      const recommendation = deterministicRecommendation(evidence.matchScore);

      const { data: analysis } = await supabase
        .from("job_analyses")
        .upsert(
          {
            user_id: userId,
            job_id: job.id,
            match_score: evidence.matchScore,
            skills_score: evidence.components.find((c) => c.key === "skills")?.score ?? null,
            experience_score:
              evidence.components.find((c) => c.key === "experience")?.score ?? null,
            education_score: evidence.components.find((c) => c.key === "education")?.score ?? null,
            certification_score:
              evidence.components.find((c) => c.key === "certification")?.score ?? null,
            location_score: evidence.components.find((c) => c.key === "location")?.score ?? null,
            compensation_score:
              evidence.components.find((c) => c.key === "compensation")?.score ?? null,
            seniority_score: evidence.components.find((c) => c.key === "seniority")?.score ?? null,
            industry_score: evidence.components.find((c) => c.key === "industry")?.score ?? null,
            trajectory_score:
              evidence.components.find((c) => c.key === "trajectory")?.score ?? null,
            preferences_score:
              evidence.components.find((c) => c.key === "preferences")?.score ?? null,
            evidence: JSON.parse(JSON.stringify(evidence)),
            strengths: evidence.strengths,
            gaps: evidence.gaps,
            risk_factors: evidence.risks,
            missing_qualifications: evidence.missingCertifications,
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
      demoOnly: providers.length === 0,
      message:
        providers.length === 0
          ? "No job source is available right now."
          : "Scored against live employer job boards.",
    };
  });
