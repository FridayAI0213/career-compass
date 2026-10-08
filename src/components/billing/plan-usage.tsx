import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { quotaQuery } from "@/lib/career-queries";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ErrorState, LoadingRows } from "@/components/ui/query-state";

const TIER_LABEL = { trial: "Free trial", pro: "Pro", complimentary: "Complimentary Pro" } as const;

/** Read-only plan and AI allowance panel. Never claims a paid plan the backend hasn't confirmed. */
export function PlanUsage() {
  const { user } = useAuth();
  const quota = useQuery(quotaQuery(user?.id));

  return (
    <section className="panel space-y-4 p-5" aria-labelledby="plan-usage-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="plan-usage-heading" className="font-display text-base font-semibold">
          Plan & usage
        </h2>
        {quota.data ? <Badge variant="secondary">{TIER_LABEL[quota.data.tier]}</Badge> : null}
      </div>
      {quota.isPending ? (
        <LoadingRows rows={2} />
      ) : quota.isError ? (
        <ErrorState title="We couldn't load your plan" onRetry={() => void quota.refetch()} />
      ) : (
        <>
          <Meter label="AI analyses" hint="Résumé analyses and match explanations" {...quota.data.analyses} />
          <Meter label="AI career plans" hint="Specialization suggestions during onboarding" {...quota.data.plans} />
          <p className="text-xs text-muted-foreground">
            {quota.data.tier === "trial"
              ? "The free trial includes 3 AI analyses and 2 AI career plans in total. Your career record, matching, and application pipeline are not limited."
              : quota.data.period_end
                ? `Allowance resets on ${new Date(quota.data.period_end).toLocaleDateString()}.`
                : "Allowance resets monthly."}
          </p>
          {quota.data.tier === "trial" ? (
            <p className="text-xs text-muted-foreground">
              Pro (10 analyses and 15 plans per month) will be available to purchase soon.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function Meter({ label, hint, limit, used, remaining }: { label: string; hint: string; limit: number; used: number; remaining: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {remaining} of {limit} left
        </span>
      </div>
      <Progress value={limit ? (used / limit) * 100 : 0} aria-label={`${label}: ${used} of ${limit} used`} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
