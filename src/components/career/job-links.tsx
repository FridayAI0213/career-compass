import { ExternalLink } from "lucide-react";

/** Accepts only absolute http(s) URLs; anything else is treated as unavailable. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface JobLinkFields {
  application_url: string | null;
  source_url: string | null;
  is_demo: boolean;
  status: string;
  deadline_at: string | null;
  requirements: string[];
  preferred_qualifications: string[];
  certifications: string[];
  degree_requirement: string | null;
  min_years_experience: number | null;
}

function LinkRow({ label, href, missing }: { label: string; href: string | null; missing: string }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="font-medium">{label}</span>
      {href ? (
        <a
          className="inline-flex items-center gap-1 text-primary hover:underline"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : (
        <span className="text-muted-foreground">{missing}</span>
      )}
    </li>
  );
}

/** Job details, direct application and requirements sources, never fabricated. */
export function JobLinks({ job }: { job: JobLinkFields }) {
  const source = safeExternalUrl(job.source_url);
  const apply = safeExternalUrl(job.application_url);
  const expired =
    job.status !== "active" || (job.deadline_at ? new Date(job.deadline_at) < new Date() : false);
  const missing = job.is_demo ? "Not available (sample posting)" : "Not provided by the source";

  const facts = [
    job.degree_requirement ? `Education: ${job.degree_requirement}` : null,
    job.min_years_experience != null ? `Experience: ${job.min_years_experience}+ years` : null,
    job.certifications.length ? `Credentials: ${job.certifications.join(", ")}` : null,
    ...job.requirements,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      {expired ? (
        <p role="status" className="text-sm text-destructive">
          This listing may be closed or expired. Check the original posting before applying.
        </p>
      ) : null}
      <ul className="space-y-1.5 text-sm">
        <LinkRow label="Original job listing" href={source} missing={missing} />
        <LinkRow label="Apply on employer site" href={apply} missing={missing} />
        <LinkRow label="Requirements & Qualifications" href={source ?? apply} missing={missing} />
      </ul>
      <div>
        <p className="eyebrow">Requirements & Qualifications</p>
        {facts.length ? (
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            {facts.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not listed by the source.</p>
        )}
        {job.preferred_qualifications.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Preferred: {job.preferred_qualifications.join(", ")}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {source || apply
            ? "Shown as extracted from the listing. Verify on the original posting."
            : "Unverified: no original posting link is available for this listing."}
        </p>
      </div>
    </div>
  );
}
