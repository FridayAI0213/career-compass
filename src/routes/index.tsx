import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, LineChart, ShieldCheck, Sparkle, Target, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JobOS — AI career intelligence for any profession" },
      {
        name: "description",
        content:
          "JobOS maps your specialization, scores real openings against your evidence, and runs your applications and interview prep as one system.",
      },
      { property: "og:title", content: "JobOS — AI career intelligence for any profession" },
      {
        property: "og:description",
        content: "Map your specialization, score real openings on evidence, and run your whole job search in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Compass,
    title: "Specialization engine",
    body: "Name any field — engineering, nursing, law, design — and JobOS maps its real specializations, credentials and vocabulary.",
  },
  {
    icon: Target,
    title: "Evidence-based matching",
    body: "Scores come from deterministic rules across skills, experience, seniority, education, location and pay. The AI explains, it never invents.",
  },
  {
    icon: Workflow,
    title: "Pipeline that thinks",
    body: "Saved roles, applications, recruiter contacts and follow-ups tracked from first look to signed offer.",
  },
  {
    icon: LineChart,
    title: "Readiness insight",
    body: "See the gaps between where you are and the roles you want, ranked by how much they move your score.",
  },
] as const;

function Landing() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkle className="size-4" />
          </span>
          JobOS
        </span>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 md:pt-20">
          <p className="eyebrow">AI career intelligence</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            Your career, run as a system — not a pile of tabs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            JobOS learns your profession, scores openings against the evidence in your record, and keeps every
            application, follow-up and interview in one intelligent workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">See my matches</Link>
            </Button>
          </div>

          <dl className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              ["Any profession", "Not just tech roles"],
              ["Transparent scores", "Every point is traceable"],
              ["Private by default", "Your record stays yours"],
            ].map(([term, detail]) => (
              <div key={term} className="panel p-5">
                <dt className="font-display text-lg font-semibold">{term}</dt>
                <dd className="text-sm text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-border bg-sidebar py-16">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="panel p-6">
                <feature.icon className="size-5 text-primary" />
                <h2 className="mt-3 font-display text-lg font-semibold">{feature.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="panel flex flex-wrap items-center justify-between gap-6 p-8">
            <div className="max-w-lg">
              <h2 className="font-display text-2xl font-semibold">Build your profile in three steps.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Field, specialization, goals. From there JobOS starts scoring roles against what you can actually
                prove.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth">Create your account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4" /> Row-level security on every record.
          </span>
          <span>© {new Date().getFullYear()} JobOS</span>
        </div>
      </footer>
    </div>
  );
}
