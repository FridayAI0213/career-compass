import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const specializationInput = z.object({
  field: z.string().min(2).max(120),
  context: z.string().max(2000).optional(),
});

export interface SpecializationSuggestion {
  specialty: string;
  summary: string;
  roleFamilies: string[];
  coreSkills: string[];
  certifications: string[];
  terminology: string[];
}

export interface SpecializationResponse {
  profession: string;
  specializations: SpecializationSuggestion[];
  followUpQuestions: string[];
  aiAvailable: boolean;
  note?: string;
}

/** Career Specialization Engine — dynamic for any profession, no hard-coded domains. */
export const suggestSpecializations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => specializationInput.parse(data))
  .handler(async ({ data, context }): Promise<SpecializationResponse> => {
    const { runAgent } = await import("./ai/run.server");
    const { untrusted } = await import("./ai/prompts");
    const { isAiConfigured } = await import("./ai/provider.server");

    if (!isAiConfigured()) {
      return {
        profession: data.field,
        specializations: [],
        followUpQuestions: [],
        aiAvailable: false,
        note: "AI is not configured for this environment.",
      };
    }

    const { reserveQuota, releaseQuota, QUOTA_EXHAUSTED_MESSAGE } = await import("./ai/quota.server");
    const reservation = await reserveQuota(context.supabase, "plan", "career_specialization");
    if (!reservation) {
      return {
        profession: data.field,
        specializations: [],
        followUpQuestions: [],
        aiAvailable: true,
        note: QUOTA_EXHAUSTED_MESSAGE.plan,
      };
    }

    try {
      const result = await runAgent<SpecializationResponse>({
        agent: "career_specialization_agent",
        temperature: 0.3,
        userPrompt: [
          `Professional field: ${data.field}`,
          data.context ? `Additional candidate context:\n${untrusted(data.context, 2000)}` : "",
          "Return JSON: { profession, specializations: [{ specialty, summary, roleFamilies[], coreSkills[], certifications[], terminology[] }], followUpQuestions: string[] }.",
          "Return between 5 and 9 specializations that a real practitioner in this field would recognise, and 2-4 follow-up questions that would meaningfully narrow the candidate's direction.",
        ]
          .filter(Boolean)
          .join("\n\n"),
        jsonSchema: {
          name: "specializations",
          schema: {
            type: "object",
            properties: {
              profession: { type: "string" },
              specializations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    specialty: { type: "string" },
                    summary: { type: "string" },
                    roleFamilies: { type: "array", items: { type: "string" } },
                    coreSkills: { type: "array", items: { type: "string" } },
                    certifications: { type: "array", items: { type: "string" } },
                    terminology: { type: "array", items: { type: "string" } },
                  },
                  required: ["specialty", "summary"],
                },
              },
              followUpQuestions: { type: "array", items: { type: "string" } },
            },
            required: ["profession", "specializations"],
          },
        },
      });

      await context.supabase.from("ai_activity").insert({
        user_id: context.userId,
        agent: result.meta.agent,
        analysis_type: "career_specialization",
        input_ref: { field: data.field },
        provider: result.meta.provider,
        model: result.meta.model,
        prompt_version: result.meta.promptVersion,
        input_tokens: result.meta.inputTokens ?? null,
        output_tokens: result.meta.outputTokens ?? null,
        latency_ms: result.meta.latencyMs,
        summary: `Generated ${result.data.specializations?.length ?? 0} specializations for ${data.field}.`,
      });

      return {
        profession: result.data.profession ?? data.field,
        specializations: result.data.specializations ?? [],
        followUpQuestions: result.data.followUpQuestions ?? [],
        aiAvailable: true,
      };
    } catch (error) {
      await releaseQuota(reservation);
      console.error("suggestSpecializations failed", error instanceof Error ? error.name : "unknown error");
      return {
        profession: data.field,
        specializations: [],
        followUpQuestions: [],
        aiAvailable: true,
        note: "The specialization engine could not complete. You can continue and type your specialization manually.",
      };
    }
  });

const resumeInput = z.object({
  documentId: z.string().uuid(),
  text: z.string().min(30).max(30000),
});

export interface ExtractedResume {
  summary: string | null;
  yearsExperience: number | null;
  education: {
    institution: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    gpa?: number;
    confidence: number;
  }[];
  experience: {
    employer: string;
    title: string;
    startDate?: string;
    endDate?: string;
    responsibilities?: string[];
    achievements?: string[];
    technologies?: string[];
    confidence: number;
  }[];
  skills: { name: string; category?: string; confidence: number }[];
  certifications: { name: string; issuer?: string; issueDate?: string; confidence: number }[];
  projects: { name: string; description?: string; technologies?: string[]; confidence: number }[];
  followUpQuestions: string[];
}

/**
 * Resume analysis agent. Extraction is always returned for human review — it is
 * never written silently into the candidate's verified career record.
 */
export const extractResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => resumeInput.parse(data))
  .handler(async ({ data, context }): Promise<{ extracted: ExtractedResume | null; error?: string }> => {
    const { runAgent } = await import("./ai/run.server");
    const { untrusted } = await import("./ai/prompts");
    const { isAiConfigured } = await import("./ai/provider.server");

    const { data: document } = await context.supabase
      .from("documents")
      .select("id")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!document) return { extracted: null, error: "Document not found." };

    if (!isAiConfigured()) return { extracted: null, error: "AI is not configured for this environment." };

    const { reserveQuota, releaseQuota, QUOTA_EXHAUSTED_MESSAGE } = await import("./ai/quota.server");
    const reservation = await reserveQuota(context.supabase, "analysis", "resume_analysis");
    if (!reservation) return { extracted: null, error: QUOTA_EXHAUSTED_MESSAGE.analysis };

    try {
      const result = await runAgent<ExtractedResume>({
        agent: "resume_analysis_agent",
        temperature: 0.1,
        userPrompt: [
          "Extract structured career data from the resume below.",
          untrusted(data.text),
          'Return JSON: { summary, yearsExperience, education[], experience[], skills[], certifications[], projects[], followUpQuestions[] }. Every extracted item carries a "confidence" number between 0 and 1. Omit anything not stated in the document.',
        ].join("\n\n"),
      });

      await context.supabase
        .from("documents")
        .update({ extracted: JSON.parse(JSON.stringify(result.data)), extraction_status: "review" })
        .eq("id", data.documentId);

      await context.supabase.from("ai_activity").insert({
        user_id: context.userId,
        agent: result.meta.agent,
        analysis_type: "resume_extraction",
        input_ref: { document_id: data.documentId },
        provider: result.meta.provider,
        model: result.meta.model,
        prompt_version: result.meta.promptVersion,
        input_tokens: result.meta.inputTokens ?? null,
        output_tokens: result.meta.outputTokens ?? null,
        latency_ms: result.meta.latencyMs,
        summary: "Extracted structured career data from an uploaded resume, pending user review.",
      });

      return { extracted: result.data };
    } catch (error) {
      await releaseQuota(reservation);
      console.error("extractResume failed", error instanceof Error ? error.name : "unknown error");
      await context.supabase
        .from("documents")
        .update({ extraction_status: "failed" })
        .eq("id", data.documentId);
      return { extracted: null, error: "Resume analysis could not complete. You can still enter details manually." };
    }
  });