import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { suggestSpecializations, type SpecializationSuggestion } from "@/lib/career.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your career profile — JobOS" },
      { name: "description", content: "Tell JobOS your field and it maps the real specializations, skills and credentials that define your niche." },
      { property: "og:title", content: "Build your career profile — JobOS" },
      { property: "og:description", content: "Map your field to real specializations, skills and credentials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const LEVELS = ["student", "entry", "mid", "senior", "lead", "executive"] as const;

function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const suggest = useServerFn(suggestSpecializations);

  const [step, setStep] = useState(0);
  const [field, setField] = useState("");
  const [context, setContext] = useState("");
  const [suggestions, setSuggestions] = useState<SpecializationSuggestion[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [specialization, setSpecialization] = useState("");
  const [subSpecialization, setSubSpecialization] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("mid");
  const [years, setYears] = useState("3");
  const [locations, setLocations] = useState("");
  const [workMode, setWorkMode] = useState<"remote" | "hybrid" | "onsite" | "flexible">("hybrid");
  const [salary, setSalary] = useState("");
  const [goal, setGoal] = useState("");

  const engine = useMutation({
    mutationFn: async () => suggest({ data: { field, context: context || undefined } }),
    onSuccess: (result) => {
      setSuggestions(result.specializations);
      setFollowUps(result.followUpQuestions);
      setNote(result.note ?? null);
      setStep(1);
    },
    onError: () => toast.error("Could not map that field right now — you can type your specialization manually."),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const chosen = suggestions.find((s) => s.specialty === specialization);
      const { error } = await supabase.from("career_profiles").upsert(
        {
          user_id: user.id,
          field,
          specialization: specialization || null,
          sub_specialization: subSpecialization || null,
          level,
          years_experience: Number(years) || 0,
          preferred_locations: locations
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          work_mode: workMode,
          salary_min: salary ? Number(salary) : null,
          career_goals: goal || null,
          target_roles: chosen?.roleFamilies ?? [],
          onboarding_step: "complete",
          onboarding_completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Career profile saved.");
      await router.navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Set up your career profile" description="Three short steps. Everything stays editable later.">
      <div className="mx-auto max-w-2xl space-y-6">
        <ol className="flex gap-2 text-xs">
          {["Your field", "Your specialization", "Your goals"].map((label, index) => (
            <li
              key={label}
              className={`flex flex-1 items-center gap-2 rounded-md border border-border px-3 py-2 ${
                index === step ? "bg-secondary font-medium" : "text-muted-foreground"
              }`}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px]">
                {index < step ? <Check className="size-3" /> : index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <section className="panel space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="field">What is your professional field?</Label>
              <Input
                id="field"
                placeholder="Electrical engineering, nursing, corporate law, industrial design…"
                value={field}
                onChange={(event) => setField(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Any profession works — JobOS learns the domain instead of assuming tech.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="context">Anything that describes your work today? (optional)</Label>
              <Textarea
                id="context"
                rows={4}
                placeholder="e.g. I design FPGA-based signal chains for radar systems."
                value={context}
                onChange={(event) => setContext(event.target.value)}
              />
            </div>
            <Button disabled={field.trim().length < 2 || engine.isPending} onClick={() => engine.mutate()}>
              {engine.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Mapping your field…
                </>
              ) : (
                <>
                  <Sparkle className="size-4" /> Map my specializations
                </>
              )}
            </Button>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="panel space-y-4 p-6">
            {note ? <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">{note}</p> : null}
            <div className="grid gap-3">
              {suggestions.map((item) => {
                const selected = specialization === item.specialty;
                return (
                  <button
                    key={item.specialty}
                    type="button"
                    onClick={() => setSpecialization(item.specialty)}
                    className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                    }`}
                  >
                    <p className="font-medium">{item.specialty}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(item.coreSkills ?? []).slice(0, 6).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={specialization}
                placeholder="Type your own if none fit"
                onChange={(event) => setSpecialization(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub">Niche within that specialization (optional)</Label>
              <Input id="sub" value={subSpecialization} onChange={(event) => setSubSpecialization(event.target.value)} />
            </div>

            {followUps.length ? (
              <div className="rounded-md border border-border px-4 py-3">
                <p className="eyebrow">Worth clarifying</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {followUps.map((question) => (
                    <li key={question}>• {question}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button disabled={!specialization.trim()} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="panel space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="level">Career level</Label>
                <select
                  id="level"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={level}
                  onChange={(event) => setLevel(event.target.value as (typeof LEVELS)[number])}
                >
                  {LEVELS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="years">Years of experience</Label>
                <Input id="years" type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locations">Preferred locations</Label>
                <Input
                  id="locations"
                  placeholder="Austin TX, Remote"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mode">Work mode</Label>
                <select
                  id="mode"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={workMode}
                  onChange={(event) => setWorkMode(event.target.value as typeof workMode)}
                >
                  {(["remote", "hybrid", "onsite", "flexible"] as const).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salary">Minimum salary target</Label>
                <Input id="salary" type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal">What would a great next role look like?</Label>
              <Textarea id="goal" rows={3} value={goal} onChange={(event) => setGoal(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? "Saving…" : "Finish setup"}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}