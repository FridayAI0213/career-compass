import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { ScoreDial } from "@/components/career/score-dial";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { refreshOpportunities } from "@/lib/opportunities.functions";
import { topOpportunitiesQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Top matches — JobOS" },
      {
        name: "description",
        content:
          "Openings ranked by deterministic evidence: skills, experience, seniority, location and compensation fit, with the reasoning shown.",
      },
      { property: "og:title", content: "Top matches — JobOS" },
      { property: "og:description", content: "Openings ranked by evidence with transparent scoring and reasoning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refresh = useServerFn(refreshOpportunities);
  const recommendations = useQuery(topOpportunitiesQuery(user?.id));
  const [openId, setOpenId] = useState<string | null>(null);

  const sync = useMutation({
    mutationFn: async () => refresh({}),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries();
      toast.success(`Scored ${result.analyzed} openings. ${result.message}`);
    },
    onError: () => toast.error("Could not refresh matches right now."),
  });

  const save = useMutation({
    mutationFn: async (payload: { company: string; position: string; jobId: string; location: string | null }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("applications").insert({
        user_id: user.id,
        job_id: payload.jobId,
        company: payload.company,
        position: payload.position,
        location: payload.location,
        status: "saved",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Saved to your pipeline.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = recommendations.data ?? [];

  return (
    <AppShell
      title="Top matches"
      description="Every score is computed from your record — the AI only explains it."
      actions={
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          {sync.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh
        </Button>
      }
    >
      {rows.length === 0 ? (
        <div className="panel max-w-xl p-6">
          <p className="text-sm text-muted-foreground">
            No scored openings yet. Run a refresh to discover roles and score them against your career record.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const job = Array.isArray(row.job) ? row.job[0] : row.job;
            const analysis = Array.isArray(row.analysis) ? row.analysis[0] : row.analysis;
            if (!job) return null;
            const open = openId === row.id;
            return (
              <li key={row.id} className="panel p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <ScoreDial score={analysis?.match_score ?? 0} />
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-semibold">{job.title}</h2>
                      <Badge variant="secondary">{row.priority.replaceAll("_", " ")}</Badge>
                      {job.is_demo ? <Badge variant="outline">sample posting</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.company} · {job.location ?? "Flexible"} · {job.work_mode ?? "unspecified"}
                      {job.salary_min ? ` · from $${job.salary_min.toLocaleString()}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(analysis?.strengths ?? []).slice(0, 3).map((item: string) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                      {(analysis?.gaps ?? []).slice(0, 2).map((item: string) => (
                        <Badge key={item} variant="outline">
                          gap: {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        save.mutate({
                          jobId: job.id,
                          company: job.company,
                          position: job.title,
                          location: job.location,
                        })
                      }
                    >
                      Save to pipeline
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOpenId(open ? null : row.id)}>
                      Why <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
                    {analysis?.ai_reasoning ? (
                      <p className="text-muted-foreground">{analysis.ai_reasoning}</p>
                    ) : (
                      <p className="text-muted-foreground">
                        Scored deterministically. Refresh to generate a written explanation for your top roles.
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <EvidenceList title="Strengths" items={analysis?.strengths ?? []} />
                      <EvidenceList title="Gaps" items={analysis?.gaps ?? []} />
                      <EvidenceList title="Risks" items={analysis?.risk_factors ?? []} />
                    </div>
                    {job.application_url ? (
                      <a
                        className="text-primary hover:underline"
                        href={job.application_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open the posting
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}

function EvidenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-1 space-y-1 text-muted-foreground">
        {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li>None detected</li>}
      </ul>
    </div>
  );
}
