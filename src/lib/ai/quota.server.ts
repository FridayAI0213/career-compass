import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type QuotaKind = "analysis" | "plan";

export const QUOTA_EXHAUSTED_MESSAGE: Record<QuotaKind, string> = {
  analysis: "You've used all AI analyses for this period. See Plan & usage in Settings for when it resets or to upgrade.",
  plan: "You've used all AI career plans for this period. See Plan & usage in Settings for when it resets or to upgrade.",
};

/**
 * Reserves one unit of AI allowance as the signed-in user. The database
 * decides entitlement from server-written subscription rows; returns null when
 * the allowance is exhausted.
 */
export async function reserveQuota(
  supabase: SupabaseClient<Database>,
  kind: QuotaKind,
  feature: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("consume_ai_quota", { _kind: kind, _feature: feature });
  if (error) throw new Error("quota check failed");
  return data ?? null;
}

/** Refunds a reservation when the AI call did not produce a usable result. */
export async function releaseQuota(eventId: string | null) {
  if (!eventId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("release_ai_quota", { _event_id: eventId });
}
