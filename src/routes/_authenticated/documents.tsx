import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { extractResume } from "@/lib/career.functions";
import { documentsQuery } from "@/lib/career-queries";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents — JobOS" },
      {
        name: "description",
        content:
          "Store pasted resumes privately and run an AI analysis. The result is saved but cannot yet be reviewed or imported into your record.",
      },
      { property: "og:title", content: "Documents — JobOS" },
      { property: "og:description", content: "Private storage for pasted resumes, with a saved AI analysis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const extract = useServerFn(extractResume);
  const documents = useQuery(documentsQuery(user?.id));

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const analyze = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("documents")
        .insert({ user_id: user.id, kind: "resume", title: title || "Resume", content })
        .select("id")
        .single();
      if (error) throw error;
      return extract({ data: { documentId: data.id, text: content } });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setTitle("");
      setContent("");
      toast.success("Analysis saved. It is not added to your career record.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Documents" description="The analysis result is saved and counted, but cannot yet be reviewed or imported into your record.">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-3 p-5">
          <h2 className="font-display text-base font-semibold">Analyze a resume</h2>
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="Resume 2026"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Paste the resume text</Label>
            <Textarea
              id="doc-content"
              rows={12}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste the full text of your resume here."
            />
          </div>
          <Button disabled={content.trim().length < 30 || analyze.isPending} onClick={() => analyze.mutate()}>
            {analyze.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkle className="size-4" /> Extract structured data
              </>
            )}
          </Button>
        </section>

        <section className="panel p-5">
          <h2 className="font-display text-base font-semibold">Your documents</h2>
          <ul className="mt-3 space-y-2">
            {(documents.data ?? []).map((document) => (
              <li key={document.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4 opacity-70" />
                    {document.title}
                  </span>
                  <Badge variant="outline">{document.extraction_status}</Badge>
                </div>
                <ExtractionSummary extracted={document.extracted} />
              </li>
            ))}
            {(documents.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">No documents yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function ExtractionSummary({ extracted }: { extracted: unknown }) {
  if (!extracted || typeof extracted !== "object") return null;
  const value = extracted as Record<string, unknown[]>;
  const counts = [
    ["experience", value["experience"]],
    ["skills", value["skills"]],
    ["education", value["education"]],
    ["certifications", value["certifications"]],
  ] as const;
  const found = counts.filter(([, list]) => Array.isArray(list) && list.length);
  if (!found.length) return null;
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Found (not imported): {found.map(([label, list]) => `${(list as unknown[]).length} ${label}`).join(" · ")}
    </p>
  );
}
