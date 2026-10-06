import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const careerProfileQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["career-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("career_profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

type RecordTable = "skills" | "experiences" | "education" | "certifications" | "projects";

export const recordQuery = <T extends RecordTable>(table: T, userId: string | undefined) =>
  queryOptions({
    queryKey: [table, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Tables<T>[];
    },
  });

export const topOpportunitiesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["opportunities", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_recommendations")
        .select(
          "id, rank, priority, reasoning, recommended_action, job:jobs(*), analysis:job_analyses(match_score, strengths, gaps, risk_factors, evidence, ai_reasoning, ai_generated)",
        )
        .order("rank", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

export const applicationsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["applications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const documentsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["documents", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
type StudentTable = "internships" | "extracurriculars";

/** Student-friendly records (internships, activities), newest first. */
export const studentRecordQuery = <T extends StudentTable>(table: T, userId: string | undefined) =>
  queryOptions({
    queryKey: [table, userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Tables<T>[];
    },
  });

/** Target niches in the user's chosen order (priority ascending). */
export const nichesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["target_niches", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("target_niches")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
