import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { ScoreDial } from "@/components/career/score-dial";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { refreshOpportunities } from "@/lib/opportunities.functions";
import { applicationsQuery, careerProfileQuery, recordQuery, topOpportunitiesQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Career dashboard — JobOS" },
      { name: "description", content: "Your readiness score, top scored openings, pipeline status and next best actions in one view." },
      { property: "og:title", content: "Career dashboard — JobOS" },
      { property: "og:description", content: "Readiness score, top matches, pipeline and next best actions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refresh = useServerFn(refreshOpportunities);

  const profile = useQuery(careerProfileQuery(user?.id));
  const skills = useQuery(recordQuery("skills", user?.id));
  const experiences = useQuery(recordQuery("experiences", user?.id));
  const recommendations = useQuery(topOpportunitiesQuery(user?.id));
  const applications = useQuery(applicationsQuery(user?.id));

  const sync = useMutation({
    mutationFn: async () => refresh({}),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries();
      toast.success(`Scored ${result.analyzed} openings. ${result.message}`);
    },
    onError: () => toast.error("Could not refresh matches right now."),
  });

  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";
  const firstName = fullName.trim().split(" ")[0] ?? "";
  const top = recommendations.data ?? [];
  const scores = top
    .map((row) => (Array.isArray(row.analysis) ? row.analysis[0]?.match_score : row.analysis?.match_score))
    .filter((value): value is number => typeof value === "number");
  const readiness = scores.length ? Math.round(scores.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, scores.length)) : 0;
  const active = (applications.data ?? []).filter((app) => !["rejected", "withdrawn", "offer"].includes(app.status));

  if (profile.isSuccess && !profile.data?.onboarding_completed_at) {
    return (
      <AppShell title="Welcome to JobOS" description="Let's build your career profile before scoring any roles.">
        <div className="panel max-w-xl space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold">Start with your field</h2>
          <p className="text-sm text-muted-foreground">
            JobOS maps the specializations, skills and credentials of your profession, then scores openings against
            your actual record — no generic keyword matching.
          </p>
          <Button asChild>
            <Link to="/onboarding">Set up my profile</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Hi${firstName ? `, ${firstName}` : ""}`}
      description="Your career position, scored opportunities and next best actions."
      actions={
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          {sync.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh matches
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="panel flex items-center gap-4 p-5">
          <ScoreDial score={readiness} />
          <div>
            <p className="eyebrow">Match readiness</p>
            <p className="text-sm text-muted-foreground">Average of your five strongest scored openings.</p>
          </div>
        </div>
        <StatCard label="Scored openings" value={top.length} hint="Deterministically ranked" />
        <StatCard label="Skills on record" value={skills.data?.length ?? 0} hint="Verified by you" />
        <StatCard label="Active applications" value={active.length} hint="In your pipeline" />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Top matches</h2>
            <Link to="/opportunities" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>

          {top.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No scored openings yet. Hit “Refresh matches” to run discovery and scoring.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {top.slice(0, 5).map((row) => {
                const job = Array.isArray(row.job) ? row.job[0] : row.job;
                const analysis = Array.isArray(row.analysis) ? row.analysis[0] : row.analysis;
                if (!job) return null;
                return (
                  <li key={row.id} className="flex items-center gap-4 py-3">
                    <ScoreDial score={analysis?.match_score ?? 0} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{job.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {job.company} · {job.location ?? "Location flexible"}
                      </p>
                    </div>
                    <Badge variant="secondary">{row.priority.replaceAll("_", " ")}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="font-display text-base font-semibold">Next best actions</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {(experiences.data?.length ?? 0) === 0 ? (
              <ActionItem to="/career" label="Add your work history so experience scoring can run." />
            ) : null}
            {(skills.data?.length ?? 0) < 5 ? (
              <ActionItem to="/career" label="List at least five skills to sharpen skill matching." />
            ) : null}
            {top.length === 0 ? <ActionItem to="/opportunities" label="Run a discovery pass to score openings." /> : null}
            {active.length === 0 ? (
              <ActionItem to="/applications" label="Log your first application to start pipeline tracking." />
            ) : null}
            <ActionItem to="/documents" label="Upload a resume for structured extraction and review." />
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="panel p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function ActionItem({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="text-muted-foreground transition-colors hover:text-foreground">
        • {label}
      </Link>
    </li>
  );
}