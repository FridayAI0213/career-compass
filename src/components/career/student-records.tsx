import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { nichesQuery, studentRecordQuery } from "@/lib/career-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/query-state";

type Niche = Tables<"target_niches">;
type Internship = Tables<"internships">;
type Activity = Tables<"extracurriculars">;

/* ---------- helpers ---------- */

export const splitLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
export const splitCommas = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Returns an error message when the end date is before the start date. */
export function dateRangeError(start: string, end: string, current: boolean): string | null {
  if (current || !start || !end) return null;
  return end < start ? "End date can't be before the start date." : null;
}

function formatRange(start: string | null, end: string | null, current: boolean) {
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  if (!start && !end && !current) return null;
  return `${start ? fmt(start) : "?"} – ${current ? "Present" : end ? fmt(end) : "?"}`;
}

function friendlyDbError(error: { message: string }) {
  if (error.message.includes("dates_check")) return "End date can't be before the start date.";
  return "We couldn't save that. Please try again.";
}

function useRemove(table: "target_niches" | "internships" | "extracurriculars") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error("We couldn't delete that. Please try again.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [table] });
      toast.success("Deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

function SourceBadge({ source }: { source: string }) {
  return source === "user" ? (
    <Badge variant="outline">Your entry</Badge>
  ) : (
    <Badge variant="outline">{source.replaceAll("_", " ")}</Badge>
  );
}

function ConfirmDelete({
  label,
  onConfirm,
  disabled,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${label}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              “{label}” will be removed from your career record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ListFrame<T>({
  query,
  empty,
  onAdd,
  addLabel,
  children,
}: {
  query: { isPending: boolean; isError: boolean; data?: T[] | undefined; refetch: () => unknown };
  empty: { title: string; message: string };
  onAdd: () => void;
  addLabel: string;
  children: (rows: T[]) => ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}>
          <Plus className="size-4" /> {addLabel}
        </Button>
      </div>
      {query.isPending ? (
        <LoadingRows rows={3} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title={empty.title}
          message={empty.message}
          action={
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="size-4" /> {addLabel}
            </Button>
          }
        />
      ) : (
        <ul className="panel divide-y divide-border">{children(query.data ?? [])}</ul>
      )}
    </div>
  );
}

function DatesFields({
  prefix,
  start,
  end,
  current,
  setStart,
  setEnd,
  setCurrent,
  currentLabel,
  error,
}: {
  prefix: string;
  start: string;
  end: string;
  current: boolean;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  setCurrent: (v: boolean) => void;
  currentLabel: string;
  error: string | null;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-start`}>Start date</Label>
          <Input
            id={`${prefix}-start`}
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-end`}>End date</Label>
          <Input
            id={`${prefix}-end`}
            type="date"
            value={end}
            disabled={current}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${prefix}-date-error` : undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${prefix}-current`}
          checked={current}
          onCheckedChange={(checked) => {
            setCurrent(checked === true);
            if (checked === true) setEnd("");
          }}
        />
        <Label htmlFor={`${prefix}-current`} className="font-normal">
          {currentLabel}
        </Label>
      </div>
      <FieldError id={`${prefix}-date-error`} message={error} />
    </div>
  );
}

/* ---------- Niches ---------- */

export function NichesPanel({ userId }: { userId: string | undefined }) {
  const queryClient = useQueryClient();
  const query = useQuery(nichesQuery(userId));
  const remove = useRemove("target_niches");
  const [editing, setEditing] = useState<Niche | "new" | null>(null);

  const reorder = useMutation({
    mutationFn: async ({
      rows,
      index,
      direction,
    }: {
      rows: Niche[];
      index: number;
      direction: -1 | 1;
    }) => {
      const next = [...rows];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];
      const results = await Promise.all(
        next.map((row, position) =>
          supabase.from("target_niches").update({ priority: position }).eq("id", row.id),
        ),
      );
      if (results.some((r) => r.error))
        throw new Error("We couldn't reorder your niches. Please try again.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["target_niches"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <ListFrame
        query={query}
        addLabel="Add niche"
        onAdd={() => setEditing("new")}
        empty={{
          title: "No target niches yet",
          message:
            "Name the areas you want to work in — e.g. climate tech, pediatric nursing, sports analytics.",
        }}
      >
        {(rows) =>
          rows.map((row, index) => (
            <li key={row.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Move ${row.name} up`}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => reorder.mutate({ rows, index, direction: -1 })}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Move ${row.name} down`}
                  disabled={index === rows.length - 1 || reorder.isPending}
                  onClick={() => reorder.mutate({ rows, index, direction: 1 })}
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{row.name}</p>
                  <SourceBadge source={row.source} />
                </div>
                {row.industry ? (
                  <p className="text-xs text-muted-foreground">{row.industry}</p>
                ) : null}
                {row.rationale ? (
                  <p className="mt-1 text-sm text-muted-foreground">{row.rationale}</p>
                ) : null}
              </div>
              <div className="flex shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => setEditing(row)}
                >
                  <Pencil className="size-4" />
                </Button>
                <ConfirmDelete
                  label={row.name}
                  onConfirm={() => remove.mutate(row.id)}
                  disabled={remove.isPending}
                />
              </div>
            </li>
          ))
        }
      </ListFrame>
      {editing ? (
        <NicheDialog
          userId={userId}
          initial={editing === "new" ? null : editing}
          nextPriority={(query.data ?? []).length}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function NicheDialog({
  userId,
  initial,
  nextPriority,
  onClose,
}: {
  userId: string | undefined;
  initial: Niche | null;
  nextPriority: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [rationale, setRationale] = useState(initial?.rationale ?? "");
  const [submitted, setSubmitted] = useState(false);
  const nameError = submitted && !name.trim() ? "Give this niche a name." : null;

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You're signed out. Sign in again to save.");
      const values = {
        name: name.trim(),
        industry: industry.trim() || null,
        rationale: rationale.trim() || null,
      };
      const { error } = initial
        ? await supabase.from("target_niches").update(values).eq("id", initial.id)
        : await supabase
            .from("target_niches")
            .insert({ ...values, user_id: userId, priority: nextPriority, source: "user" });
      if (error) throw new Error(friendlyDbError(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["target_niches"] });
      toast.success(initial ? "Niche updated." : "Niche added.");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit niche" : "Add a target niche"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!name.trim()) return;
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="niche-name">Niche *</Label>
            <Input
              id="niche-name"
              value={name}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "niche-name-error" : undefined}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldError id="niche-name-error" message={nameError} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="niche-industry">Industry</Label>
            <Input
              id="niche-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="niche-rationale">Why this interests me</Label>
            <Textarea
              id="niche-rationale"
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Internships ---------- */

export function InternshipsPanel({ userId }: { userId: string | undefined }) {
  const query = useQuery(studentRecordQuery("internships", userId));
  const remove = useRemove("internships");
  const [editing, setEditing] = useState<Internship | "new" | null>(null);

  return (
    <>
      <ListFrame
        query={query}
        addLabel="Add internship"
        onAdd={() => setEditing("new")}
        empty={{
          title: "No internships yet",
          message:
            "Summer roles, co-ops, research placements and part-time internships all count here.",
        }}
      >
        {(rows) =>
          rows.map((row) => (
            <RecordRow
              key={row.id}
              title={row.title}
              subtitle={[row.employer, row.location].filter(Boolean).join(" · ")}
              range={formatRange(row.start_date, row.end_date, row.is_current)}
              source={row.source}
              bullets={row.accomplishments.length ? row.accomplishments : row.responsibilities}
              skills={row.skills}
              onEdit={() => setEditing(row)}
              onDelete={() => remove.mutate(row.id)}
              deleting={remove.isPending}
            />
          ))
        }
      </ListFrame>
      {editing ? (
        <InternshipDialog
          userId={userId}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function InternshipDialog({
  userId,
  initial,
  onClose,
}: {
  userId: string | undefined;
  initial: Internship | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [employer, setEmployer] = useState(initial?.employer ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [start, setStart] = useState(initial?.start_date ?? "");
  const [end, setEnd] = useState(initial?.end_date ?? "");
  const [current, setCurrent] = useState(initial?.is_current ?? false);
  const [responsibilities, setResponsibilities] = useState(
    (initial?.responsibilities ?? []).join("\n"),
  );
  const [accomplishments, setAccomplishments] = useState(
    (initial?.accomplishments ?? []).join("\n"),
  );
  const [skills, setSkills] = useState((initial?.skills ?? []).join(", "));
  const [submitted, setSubmitted] = useState(false);

  const employerError = submitted && !employer.trim() ? "Enter the employer." : null;
  const titleError = submitted && !title.trim() ? "Enter your title." : null;
  const dateError = dateRangeError(start, end, current);

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You're signed out. Sign in again to save.");
      const values = {
        employer: employer.trim(),
        title: title.trim(),
        location: location.trim() || null,
        start_date: start || null,
        end_date: current ? null : end || null,
        is_current: current,
        responsibilities: splitLines(responsibilities),
        accomplishments: splitLines(accomplishments),
        skills: splitCommas(skills),
      };
      const { error } = initial
        ? await supabase.from("internships").update(values).eq("id", initial.id)
        : await supabase.from("internships").insert({ ...values, user_id: userId, source: "user" });
      if (error) throw new Error(friendlyDbError(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["internships"] });
      toast.success(initial ? "Internship updated." : "Internship added.");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit internship" : "Add an internship"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!employer.trim() || !title.trim() || dateError) return;
            save.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="int-employer">Employer *</Label>
              <Input
                id="int-employer"
                value={employer}
                aria-invalid={Boolean(employerError)}
                onChange={(e) => setEmployer(e.target.value)}
              />
              <FieldError id="int-employer-error" message={employerError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="int-title">Title *</Label>
              <Input
                id="int-title"
                value={title}
                aria-invalid={Boolean(titleError)}
                onChange={(e) => setTitle(e.target.value)}
              />
              <FieldError id="int-title-error" message={titleError} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-location">Location</Label>
            <Input
              id="int-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <DatesFields
            prefix="int"
            start={start}
            end={end}
            current={current}
            setStart={setStart}
            setEnd={setEnd}
            setCurrent={setCurrent}
            currentLabel="Currently here"
            error={dateError}
          />
          <div className="space-y-1.5">
            <Label htmlFor="int-resp">Responsibilities (one per line)</Label>
            <Textarea
              id="int-resp"
              rows={3}
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-acc">Accomplishments (one per line)</Label>
            <Textarea
              id="int-acc"
              rows={3}
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-skills">Related skills (comma-separated)</Label>
            <Input id="int-skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Activities ---------- */

export function ActivitiesPanel({ userId }: { userId: string | undefined }) {
  const query = useQuery(studentRecordQuery("extracurriculars", userId));
  const remove = useRemove("extracurriculars");
  const [editing, setEditing] = useState<Activity | "new" | null>(null);

  return (
    <>
      <ListFrame
        query={query}
        addLabel="Add activity"
        onAdd={() => setEditing("new")}
        empty={{
          title: "No activities yet",
          message: "Clubs, volunteering, projects and leadership count here.",
        }}
      >
        {(rows) =>
          rows.map((row) => (
            <RecordRow
              key={row.id}
              title={row.role}
              subtitle={row.organization}
              range={formatRange(row.start_date, row.end_date, row.is_current)}
              source={row.source}
              description={row.description}
              bullets={row.accomplishments}
              skills={row.skills}
              onEdit={() => setEditing(row)}
              onDelete={() => remove.mutate(row.id)}
              deleting={remove.isPending}
            />
          ))
        }
      </ListFrame>
      {editing ? (
        <ActivityDialog
          userId={userId}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function ActivityDialog({
  userId,
  initial,
  onClose,
}: {
  userId: string | undefined;
  initial: Activity | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(initial?.role ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [start, setStart] = useState(initial?.start_date ?? "");
  const [end, setEnd] = useState(initial?.end_date ?? "");
  const [current, setCurrent] = useState(initial?.is_current ?? false);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accomplishments, setAccomplishments] = useState(
    (initial?.accomplishments ?? []).join("\n"),
  );
  const [skills, setSkills] = useState((initial?.skills ?? []).join(", "));
  const [submitted, setSubmitted] = useState(false);

  const roleError = submitted && !role.trim() ? "Enter your role." : null;
  const orgError = submitted && !organization.trim() ? "Enter the organization." : null;
  const dateError = dateRangeError(start, end, current);

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You're signed out. Sign in again to save.");
      const values = {
        role: role.trim(),
        organization: organization.trim(),
        start_date: start || null,
        end_date: current ? null : end || null,
        is_current: current,
        description: description.trim() || null,
        accomplishments: splitLines(accomplishments),
        skills: splitCommas(skills),
      };
      const { error } = initial
        ? await supabase.from("extracurriculars").update(values).eq("id", initial.id)
        : await supabase
            .from("extracurriculars")
            .insert({ ...values, user_id: userId, source: "user" });
      if (error) throw new Error(friendlyDbError(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["extracurriculars"] });
      toast.success(initial ? "Activity updated." : "Activity added.");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit activity" : "Add an activity"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (!role.trim() || !organization.trim() || dateError) return;
            save.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="act-role">Role *</Label>
              <Input
                id="act-role"
                value={role}
                aria-invalid={Boolean(roleError)}
                onChange={(e) => setRole(e.target.value)}
              />
              <FieldError id="act-role-error" message={roleError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-org">Organization *</Label>
              <Input
                id="act-org"
                value={organization}
                aria-invalid={Boolean(orgError)}
                onChange={(e) => setOrganization(e.target.value)}
              />
              <FieldError id="act-org-error" message={orgError} />
            </div>
          </div>
          <DatesFields
            prefix="act"
            start={start}
            end={end}
            current={current}
            setStart={setStart}
            setEnd={setEnd}
            setCurrent={setCurrent}
            currentLabel="I'm still involved"
            error={dateError}
          />
          <div className="space-y-1.5">
            <Label htmlFor="act-desc">Description</Label>
            <Textarea
              id="act-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-acc">Accomplishments (one per line)</Label>
            <Textarea
              id="act-acc"
              rows={3}
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-skills">Skills (comma-separated)</Label>
            <Input id="act-skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- shared row ---------- */

function RecordRow({
  title,
  subtitle,
  range,
  source,
  description,
  bullets,
  skills,
  onEdit,
  onDelete,
  deleting,
}: {
  title: string;
  subtitle: string;
  range: string | null;
  source: string;
  description?: string | null;
  bullets: string[];
  skills: string[];
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          <SourceBadge source={source} />
        </div>
        <p className="text-xs text-muted-foreground">
          {subtitle}
          {range ? ` · ${range}` : ""}
        </p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        {bullets.length ? (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
            {bullets.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {skills.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0">
        <Button variant="ghost" size="icon" aria-label={`Edit ${title}`} onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <ConfirmDelete label={title} onConfirm={onDelete} disabled={deleting} />
      </div>
    </li>
  );
}
