<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Shared job-catalogue rows are written server-side via the admin client with created_by NULL, so no user id is exposed on rows every signed-in user can read.
- anon has no table privileges in public; billing (subscriptions) and reference (career_specializations) tables are client read-only.
- AI allowance is enforced in the database (`consume_ai_quota` reserve before each AI call, server-only `release_ai_quota` refund on failure); entitlement derives only from server-written `subscriptions` rows. Why: clients can never grant themselves usage or a plan.
