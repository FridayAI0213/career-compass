# JobOS launch-readiness audit (facts) and fix plan

Nothing was changed while preparing this. Each finding below says what it is based on: a file, a database query or the security scan.

## 1. Authentication

| Area | Status | Evidence |
|---|---|---|
| Sign up (email) | Works. With email confirmation on, it shows a "confirm your email" note instead of pretending you are signed in | `src/routes/auth.tsx` 72-97 |
| Email confirmation | On. Confirmation links return to `/auth/callback`. 2 of 3 accounts have never confirmed | `auth.tsx` 80; database query |
| Login | Works. Shows the provider's error text; checks a session was returned | `auth.tsx` 55-70 |
| Google | Goes through the Lovable sign-in helper and returns to the public `/auth/callback` page, which waits for a session and has an 8-second failure screen | `auth.tsx` 99-123, `auth.callback.tsx` |
| Session persistence and refresh | One shared listener and one start-up session check; tokens refresh automatically | `src/lib/auth-context.tsx` |
| Protected pages | The managed gate re-checks the user and sends signed-out visitors to `/auth?redirect=<path>` | `_authenticated/route.tsx` |
| After login | Returns to the original page; only same-site paths are accepted | `src/lib/auth-redirect.ts` |
| Logout | Clears cached data, signs out, and replaces the page with `/auth` so Back doesn't return | `signOutCompletely`, app shell |
| Expired session | Expired sign-ins redirect to `/auth` on the next page change. Not verified at runtime: what an open page shows when its session expires | code only |
| **Password reset** | **Missing.** No "Forgot password" link, no reset email call, no `/reset-password` page | search for reset/forgot found nothing |
| Resend confirmation | Missing. An unconfirmed user who lost the email has no way to get a new one | `auth.tsx` |
| Error wording | Raw provider messages (e.g. "Invalid login credentials", "Email not confirmed") are shown as-is. They're readable, but not reworded | `auth.tsx` 62, 86 |

Not verified: a real Google round trip in the preview and on the published site; the session-expiry screen.

## 2. Security

Every table checked (19 tables in the app's data area):
- Row-level security is **on for all 19**.
- Every policy applies to signed-in users only. None apply to anonymous visitors.

Table by table:
- **Owner-only, all actions** (signed-in users read and write only their own rows): ai_activity, applications, career_profiles, certifications, documents, education, experiences, follow_ups, interview_sessions, interviews, job_analyses, job_recommendations, notifications, profiles, projects, skills.
  - Cross-user access: blocked.
  - Anonymous access: blocked (no policy applies).
- **subscriptions**: signed-in users can only read their own row. There is no insert, update or delete rule, so **browser code can't write it** (blocked even though the underlying table permission exists).
- **career_specializations**: every signed-in user can read every row; nobody can write. It's reference data, so this is intended.
- **jobs**:
  - Every signed-in user can read every row.
  - Users can insert, update and delete rows they created.
  - Opportunity refresh writes demo jobs with `created_by = you`. So any signed-in user can see job rows another user's refresh created, including those rows' `created_by` id.
  - Rows are sample postings, so there's no personal data beyond the user id.
- **Table permissions are broader than needed:** anonymous visitors and signed-in users have full table permissions on every table (database query). Row-level security currently blocks all anonymous access. But if row-level security were ever switched off on a table, it would be fully exposed. This is a defence-in-depth issue.
- **File storage** (`career-documents`, private): read, upload, change and delete are all limited to the user's own folder. Nothing in the app uploads files today.
- **Keys and secrets:**
  - No service-role key, `sb_secret` key or private credential in browser code.
  - The only `VITE_` values are the public address and publishable key.
  - Nothing outside the generated integration files uses the privileged admin connection.
- **Server functions:** all four check who is calling, and none use privileged access (`refreshOpportunities`, `suggestSpecializations`, `extractResume`, `explainMatch`).
- **Security scan:**

| Severity | Finding |
|---|---|
| Warn | jobs: any signed-in user can read all rows, including salary fields. The data is sample postings; the issue above is the `created_by` exposure |
| Info | career_specializations is readable by all signed-in users. Intended |
| Not run | The extra Wiz scan is not configured |

## 3. What actually exists

| Feature | Backend | Page or button | Verdict |
|---|---|---|---|
| Interviews | `interviews` and `interview_sessions` tables | None. Shown greyed out under "Coming next" in the sidebar | Not built |
| Follow-ups | `follow_ups` table, plus a `follow_up_at` field on applications | None | Not built |
| Documents | Private storage bucket exists but is unused | Paste text only; no file picker | Paste only |
| Subscription or paywall | `subscriptions` table, 0 rows | None | Not built |
| Location filter | Location is used in scoring | Top matches has no filters; location is only displayed | Not built |
| Admin | No roles table, no admin routes | None | Not built |

## 4. Console errors, links and buttons

- The preview captured no console or runtime errors.
- Every link points to an existing page: `/`, `/auth`, `/dashboard`, `/opportunities`, `/applications`, `/career`, `/documents`, `/settings`, `/onboarding`.
- "Coming next" in the sidebar has three greyed-out items, clearly marked as unavailable rather than broken: Find Opportunities, Interviews, Career Insights. It's visible to every user.
- The pipeline still has "Recruiter" and "Interview" status columns, which is acceptable.
- Not verified: signed-in pages in a live browser this session.

## 5. Priorities

Credit estimates are rough.

**P0 — blocks launch**
1. **Password reset flow:** a "Forgot password?" link on /auth, a public `/reset-password` page that sets a new password, and success and error messages. About 3-5 credits.
2. **Real signed-in test run** of the main journey on phone and desktop sizes: sign up, confirm, onboarding, refresh matches, save, pipeline, settings, sign out. Fix whatever it turns up. About 3-6 credits.

**P1 — important for a real user**
1. **Resend confirmation email** on /auth, plus friendly wording for "Email not confirmed" and "Invalid login credentials". About 2 credits.
2. **Tighten table permissions** (database change, additive): remove anonymous visitors' permissions on every table, and remove signed-in users' write permissions on subscriptions and career_specializations. Behaviour today is unchanged; this hardens it. About 2 credits.
3. **jobs exposure:** stop recording which user created demo jobs (`created_by`), or limit reading to demo rows plus the user's own. Then rescan. About 2-3 credits.
4. **Hide the sidebar "Coming next" block**, or move it into one muted line, so the product doesn't advertise unbuilt features. About 1 credit.
5. **Leaked-password protection** in sign-in settings. About 1 credit.
6. **Stripe test-mode subscriptions:** already planned and on hold until payments are connected. About 15-25 credits.

**P2 — polish**
- Location and work-mode filters on Top matches.
- Résumé analysis review and import screen.
- Clean up the formatting-only lint complaints.
- The page shown when a session expires mid-use.

**P3 — future**
- Interviews, follow-ups, live job sources, file upload, admin roles, career insights.

## Proposed execution (after approval)

P0.1, then P1.1 to P1.5, then P0.2: a signed-in browser test at 390px and 1280px wide, then the security rescan. All of it is within the existing structure, keeps the JobOS name, and involves no payments and no publishing.
