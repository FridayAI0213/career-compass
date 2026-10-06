import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { careerProfileQuery, recordQuery } from "@/lib/career-queries";
import { ActivitiesPanel, InternshipsPanel, NichesPanel } from "@/components/career/student-records";

export const Route = createFileRoute("/_authenticated/career")({
  head: () => ({
    meta: [
      { title: "My career record — JobOS" },
      {
        name: "description",
        content:
          "The verified record JobOS scores against: skills, work history, education, certifications and projects, each with its source.",
      },
      { property: "og:title", content: "My career record — JobOS" },
      { property: "og:description", content: "Skills, work history, education and credentials with source tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Career,
});

function Career() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery(careerProfileQuery(user?.id));
  const skills = useQuery(recordQuery("skills", user?.id));
  const experiences = useQuery(recordQuery("experiences", user?.id));
  const education = useQuery(recordQuery("education", user?.id));
  const certifications = useQuery(recordQuery("certifications", user?.id));

  const [skillName, setSkillName] = useState("");
  const [skillYears, setSkillYears] = useState("");
  const [employer, setEmployer] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [certName, setCertName] = useState("");

  function refetchAll() {
    return queryClient.invalidateQueries();
  }

  const addSkill = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("skills").insert({
        user_id: user.id,
        name: skillName,
        years_experience: skillYears ? Number(skillYears) : null,
        source: "user",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setSkillName("");
      setSkillYears("");
      await refetchAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addExperience = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("experiences")
        .insert({ user_id: user.id, employer, title, source: "user" });
      if (error) throw error;
    },
    onSuccess: async () => {
      setEmployer("");
      setTitle("");
      await refetchAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addEducation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("education")
        .insert({ user_id: user.id, institution, degree: degree || null, source: "user" });
      if (error) throw error;
    },
    onSuccess: async () => {
      setInstitution("");
      setDegree("");
      await refetchAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addCertification = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("certifications")
        .insert({ user_id: user.id, name: certName, source: "user" });
      if (error) throw error;
    },
    onSuccess: async () => {
      setCertName("");
      await refetchAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async ({
      table,
      id,
    }: {
      table: "skills" | "experiences" | "education" | "certifications";
      id: string;
    }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refetchAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="My career record"
      description={
        profile.data?.specialization
          ? `${profile.data.specialization}${profile.data.level ? ` · ${profile.data.level}` : ""}`
          : "Everything scoring is based on."
      }
    >
      <Tabs defaultValue="skills" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="niches">Niches</TabsTrigger>
            <TabsTrigger value="internships">Internships</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="skills" className="space-y-4">
          <div className="panel flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="skill">Skill</Label>
              <Input id="skill" value={skillName} onChange={(event) => setSkillName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skill-years">Years</Label>
              <Input
                id="skill-years"
                type="number"
                min={0}
                className="w-24"
                value={skillYears}
                onChange={(event) => setSkillYears(event.target.value)}
              />
            </div>
            <Button disabled={!skillName || addSkill.isPending} onClick={() => addSkill.mutate()}>
              <Plus className="size-4" /> Add skill
            </Button>
          </div>
          <div className="panel flex flex-wrap gap-2 p-4">
            {(skills.data ?? []).map((skill) => (
              <Badge key={skill.id} variant="secondary" className="gap-1.5">
                {skill.name}
                {skill.years_experience ? ` · ${skill.years_experience}y` : ""}
                <button
                  aria-label={`Remove ${skill.name}`}
                  onClick={() => remove.mutate({ table: "skills", id: skill.id })}
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
            {(skills.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills recorded yet.</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <div className="panel flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="employer">Employer</Label>
              <Input id="employer" value={employer} onChange={(event) => setEmployer(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <Button disabled={!employer || !title || addExperience.isPending} onClick={() => addExperience.mutate()}>
              <Plus className="size-4" /> Add role
            </Button>
          </div>
          <RecordList
            items={(experiences.data ?? []).map((row) => ({
              id: row.id,
              primary: row.title,
              secondary: row.employer,
              source: row.source,
            }))}
            onRemove={(id) => remove.mutate({ table: "experiences", id })}
          />
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <div className="panel flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" value={institution} onChange={(event) => setInstitution(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="degree">Degree</Label>
              <Input id="degree" value={degree} onChange={(event) => setDegree(event.target.value)} />
            </div>
            <Button disabled={!institution || addEducation.isPending} onClick={() => addEducation.mutate()}>
              <Plus className="size-4" /> Add education
            </Button>
          </div>
          <RecordList
            items={(education.data ?? []).map((row) => ({
              id: row.id,
              primary: row.degree ?? "Program",
              secondary: row.institution,
              source: row.source,
            }))}
            onRemove={(id) => remove.mutate({ table: "education", id })}
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <div className="panel flex flex-wrap items-end gap-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="cert">Certification or licence</Label>
              <Input id="cert" value={certName} onChange={(event) => setCertName(event.target.value)} />
            </div>
            <Button disabled={!certName || addCertification.isPending} onClick={() => addCertification.mutate()}>
              <Plus className="size-4" /> Add credential
            </Button>
          </div>
          <RecordList
            items={(certifications.data ?? []).map((row) => ({
              id: row.id,
              primary: row.name,
              secondary: row.issuer ?? "Self-reported",
              source: row.source,
            }))}
            onRemove={(id) => remove.mutate({ table: "certifications", id })}
          />
        </TabsContent>

        <TabsContent value="niches">
          <NichesPanel userId={user?.id} />
        </TabsContent>
        <TabsContent value="internships">
          <InternshipsPanel userId={user?.id} />
        </TabsContent>
        <TabsContent value="activities">
          <ActivitiesPanel userId={user?.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function RecordList({
  items,
  onRemove,
}: {
  items: { id: string; primary: string; secondary: string; source: string }[];
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="panel p-4 text-sm text-muted-foreground">Nothing recorded yet.</p>;
  }
  return (
    <ul className="panel divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{item.primary}</p>
            <p className="text-xs text-muted-foreground">{item.secondary}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.source.replaceAll("_", " ")}</Badge>
            <Button variant="ghost" size="icon" aria-label="Remove entry" onClick={() => onRemove(item.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
