import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { careerProfileQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — JobOS" },
      {
        name: "description",
        content: "Update your search preferences: target locations, work mode, compensation floor and career goals.",
      },
      { property: "og:title", content: "Settings — JobOS" },
      { property: "og:description", content: "Update target locations, work mode, compensation floor and goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery(careerProfileQuery(user?.id));

  const [locations, setLocations] = useState("");
  const [workMode, setWorkMode] = useState<"remote" | "hybrid" | "onsite" | "flexible">("hybrid");
  const [salary, setSalary] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    setLocations((profile.data.preferred_locations ?? []).join(", "));
    setWorkMode((profile.data.work_mode ?? "hybrid") as typeof workMode);
    setSalary(profile.data.salary_min ? String(profile.data.salary_min) : "");
    setGoals(profile.data.career_goals ?? "");
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("career_profiles").upsert(
        {
          user_id: user.id,
          preferred_locations: locations
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          work_mode: workMode,
          salary_min: salary ? Number(salary) : null,
          career_goals: goals || null,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["career-profile"] });
      toast.success("Preferences updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Settings" description="Preferences feed directly into location, compensation and mode scoring.">
      <div className="panel max-w-xl space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="locations">Preferred locations</Label>
          <Input id="locations" value={locations} onChange={(event) => setLocations(event.target.value)} />
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
          <Label htmlFor="salary">Minimum salary</Label>
          <Input
            id="salary"
            type="number"
            min={0}
            value={salary}
            onChange={(event) => setSalary(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goals">Career goals</Label>
          <Textarea id="goals" rows={4} value={goals} onChange={(event) => setGoals(event.target.value)} />
        </div>
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </AppShell>
  );
}
