import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { applicationsQuery } from "@/lib/career-queries";
import { ErrorState, LoadingRows } from "@/components/ui/query-state";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["application_status"];

const COLUMNS: { key: string; statuses: Status[]; label: string }[] = [
  { key: "saved", statuses: ["saved"], label: "Saved" },
  { key: "applied", statuses: ["applied"], label: "Applied" },
  { key: "recruiter", statuses: ["recruiter"], label: "Recruiter" },
  { key: "interview", statuses: ["interview"], label: "Interview" },
  { key: "final_round", statuses: ["final_round"], label: "Final round" },
  { key: "offer", statuses: ["offer"], label: "Offer" },
  { key: "closed", statuses: ["rejected", "withdrawn"], label: "Closed" },
];

const ALL_STATUSES: Status[] = [
  "saved",
  "applied",
  "recruiter",
  "interview",
  "final_round",
  "offer",
  "rejected",
  "withdrawn",
];

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Application pipeline — JobOS" },
      {
        name: "description",
        content:
          "Track every application from saved to offer, moving each one through status columns.",
      },
      { property: "og:title", content: "Application pipeline — JobOS" },
      {
        property: "og:description",
        content: "Track applications from saved to offer in one pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Applications,
});

function Applications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const applications = useQuery(applicationsQuery(user?.id));
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("applications")
        .insert({ user_id: user.id, company, position, status: "saved" });
      if (error) throw error;
    },
    onSuccess: async () => {
      setCompany("");
      setPosition("");
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application added.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase
        .from("applications")
        .update({
          status,
          ...(status === "applied" ? { applied_at: new Date().toISOString() } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = applications.data ?? [];

  return (
    <AppShell title="Applications" description="Your pipeline from saved role to signed offer.">
      <div className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
          />
        </div>
        <Button
          disabled={!company || !position || create.isPending}
          onClick={() => create.mutate()}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {applications.isPending ? (
        <LoadingRows rows={4} />
      ) : applications.isError ? (
        <ErrorState
          title="We couldn't load your pipeline"
          message="Your applications didn't load. Check your connection and try again."
          onRetry={() => void applications.refetch()}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {COLUMNS.map((column) => {
            const items = rows.filter((row) => column.statuses.includes(row.status));
            return (
              <section key={column.key} className="panel p-4">
                <header className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold">{column.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </header>
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium">{item.position}</p>
                      <p className="text-xs text-muted-foreground">{item.company}</p>
                      <select
                        aria-label="Application status"
                        className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        value={item.status}
                        onChange={(event) =>
                          move.mutate({ id: item.id, status: event.target.value as Status })
                        }
                      >
                        {ALL_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                  {items.length === 0 ? (
                    <li className="text-xs text-muted-foreground">Nothing here yet.</li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
