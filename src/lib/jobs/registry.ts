import { demoJobProvider } from "./providers/demo";
import { dedupe } from "./normalize";
import type { JobProvider, JobQuery, NormalizedJob } from "./types";

/**
 * Provider registry for the job discovery layer.
 *
 * Real sources (partner APIs, ATS feeds) are added here once credentials are
 * configured. Until then only the clearly-labelled sample provider is active.
 */
const PROVIDERS: JobProvider[] = [demoJobProvider];

export function listProviders(): { id: string; label: string; configured: boolean }[] {
  return PROVIDERS.map((p) => ({ id: p.id, label: p.label, configured: p.isConfigured() }));
}

export async function discoverJobs(query: JobQuery): Promise<NormalizedJob[]> {
  const active = PROVIDERS.filter((p) => p.isConfigured());
  const results = await Promise.all(
    active.map(async (provider) => {
      try {
        return await provider.fetchJobs(query);
      } catch (error) {
        console.error(`Job provider ${provider.id} failed`, error);
        return [] as NormalizedJob[];
      }
    }),
  );
  return dedupe(results.flat());
}