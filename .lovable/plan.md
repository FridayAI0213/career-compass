# JobOS — Stripe test-mode subscriptions (Free / Pro)

Nothing here is built yet. Payments cannot be switched on from this session. Step 1 has to happen in the regular Lovable editor chat.

## 1. How Stripe gets connected

Use Lovable's built-in Stripe payments. Lovable manages the Stripe connection, so you don't need your own Stripe account or keys, and nothing goes into chat. The other option (pasting your own Stripe keys) is an older path. We would only use it if you insist on your own account.

Your steps:
1. Check you are on a Pro (or higher) Lovable plan. Payments need it.
2. In the Lovable editor chat, ask: "Set up built-in Stripe payments for JobOS". Fill in the setup form it shows (business name JobOS, country, support email).
3. Payments start in **test mode (sandbox)**. Lovable keeps test and live as separate setups, so test products, customers and webhook endpoints are separate from live ones. In test mode only Stripe's test cards work. Real cards are declined.
4. Going live is a separate, deliberate step: you finish Stripe's business verification and switch the project to live. Until you do that, no real charge is possible.
5. Tell me when payments are on. I'll then create the two prices ($9/month, $72/year) in test mode and build the work below.

How we prove no real payment can happen before publishing:
- Every checkout page carries Stripe's "Test mode" banner, and a real card number is refused.
- The pricing page and settings show a "Test mode — no real charges" note. It is driven by the server's view of the connection, not hard-coded.
- The webhook rejects any event whose test/live flag doesn't match the mode the server expects, so a live event can't grant access while we are in test mode.
- I'll show you the Stripe test dashboard view in Lovable: test-flagged customers and subscriptions only.

## 2. Webhook design

Endpoint: one public server route (`/api/public/stripe-webhook`), set up by the integration.
- **Signature:** every request is verified with Stripe's signing secret, which the integration stores. An invalid or missing signature gets a 400 and nothing is written.
- **Idempotency:** a new `billing_events` table stores each Stripe event id. If an id was already processed, we return 200 and do nothing else. Updates always use the subscription's own latest state from Stripe, so events arriving out of order still settle correctly.
- **Events handled:**
  - `checkout.session.completed`: links the Stripe customer and subscription to the JobOS user. The user id comes from checkout metadata the server set, never from the browser.
  - `customer.subscription.created` / `updated`: writes plan, status, current period start and end, and cancel-at-period-end.
  - `customer.subscription.deleted`: sets status to canceled and keeps the period end.
  - `invoice.payment_failed`: refreshes the status (usually past_due). It does not remove data.
  - `invoice.paid`: refreshes the period end on renewal.
- **Who counts as Pro** (computed only in the database): plan = pro, status is active, trialing or past_due, and the current period end is in the future.
  - **Cancel:** Pro stays until the end of the paid period, then drops to Free automatically.
  - **past_due:** Pro continues until the period end while Stripe retries the card, then drops to Free if payment still hasn't gone through.
  - **Expiry, unpaid or canceled:** Free.
  - **Dropping to Free never deletes anything.** You just can't add new items while over a limit.

## 3. Database changes (additive only)

- `subscriptions`: add nullable columns `cancel_at_period_end boolean default false`, `price_id text` and `environment text` (test/live). Add unique indexes on `provider_subscription_id` and `user_id`. Clients keep read-only access; only the webhook (privileged server code) writes.
- New `billing_events(id text primary key, type, received_at)`. Row-level security is on with no client access; only server code can read or write it.
- New function `is_pro(uid)`. It runs with elevated rights and reads `subscriptions` using the rule above.
- New function `enforce_free_limit()`, plus a "before insert" trigger on each of these tables:
  - skills: 10
  - experiences: 3
  - education: 2
  - certifications: 3
  - documents where kind = resume: 1
  - applications: 10

  The trigger counts the user's existing rows. If the user isn't Pro and is at or over the limit, it rejects the insert with a clear "Free plan limit reached" message. Updates and deletes are never blocked.
- No user without a subscription row means "Free", so no backfill is needed.

Risks to existing users (checked: 3 users, highest is 5 skills and 2 applications, 0 documents, 0 subscription rows):
- No one is over a limit today, and nothing is deleted or changed.
- Onboarding and résumé import add several skills, work entries and so on at once. A Free user importing more than 10 skills would have the extra rows rejected. **Proposal:** those flows insert up to the limit and show "Upgrade to keep the rest". Otherwise the whole import fails.
- Each trigger adds one count query per insert, which is negligible at this size.

## 4. Screens

- **/pricing** (public): Free vs Pro table listing only the record limits, résumé document slots and pipeline size. The annual price is shown as "$72/year — save 33%". No trial. A note says "Matching and Top Matches are identical on every plan."
- Checkout opens Stripe's hosted page through a signed-in server function. That function takes only "monthly" or "annual" and sets the user from the session.
- **/billing/success**: "Payment received". It waits up to about 20 seconds for the webhook to mark you Pro, then shows Pro. If that takes longer, it shows a "still processing, refresh shortly" note.
- **/billing/cancel**: "Checkout cancelled. You were not charged." Links back to pricing.
- **Error message:** shown in plain words if checkout fails to start, with a "Try again" button.
- **Settings → Plan**: shows the current plan, renewal or end date, past-due notice, and usage meters (e.g. 7/10 skills). The **Manage subscription** button opens Stripe's customer portal through a server function. In the portal you can cancel, switch between monthly and yearly, and update your card.
- **Limit reached:** add buttons explain the limit and link to pricing, but the database is the real gate.

## 5. Testing

What I'll do in test mode:
- **Successful checkout:** pay with card 4242 4242 4242 4242, confirm the webhook arrives, the subscription row is active, and an 11th skill now saves.
- **Cancelled checkout:** back out of the Stripe page. The cancel screen shows and nothing changes in the subscription table.
- **Declined card:** use 4000 0000 0000 0002 and the insufficient-funds test card. Stripe shows the error and you stay Free.
- **Cancellation:** cancel in the portal. Cancel-at-period-end gets set and you stay Pro until the end date.
- **Expiry and past_due:** manually set the end date in the past on a test account and confirm access drops to Free. Then confirm a direct browser insert past the limit is rejected.
- **Webhook security:** send an unsigned or tampered request and confirm it's rejected. Replay a real event and confirm nothing happens the second time.

What I can't test from my environment:
- I can't type into Stripe's hosted card form as a real user. I can drive it with the browser, but 3-D Secure pop-ups and Stripe's anti-bot checks may block that, so you should run one checkout yourself.
- Real time-based renewals and payment retries take days; I simulate them by editing dates.
- Live mode, by design.

## 6. Where the plan conflicts with the app today

- **Résumé storage:** the Documents page saves pasted text, not uploaded files, and the file storage bucket is unused. "1 saved résumé document" is enforceable, but Pro copy should say "more résumé versions", not "file storage".
- **No free row:** there is no default "free" subscription row today. The logic treats a missing row as Free, so no backfill is needed.
- **Bulk inserts:** onboarding and import add many rows at once, so the limits need the partial-save behaviour in section 3.
- **Duplicate saves:** "Save to pipeline" duplicate protection is enforced in the app only (no unique constraint). It also counts towards the 10-application limit.
- **Interviews and follow-ups:** they have no limits, and none are proposed.
- **Matching:** scoring, matching and Top Matches have no plan checks anywhere, and none will be added.

## Technical details

- Server functions: `createCheckoutSession({ interval })` and `createPortalSession()`, both behind `requireSupabaseAuth`. The Stripe customer id is looked up or created for `context.userId`.
- The webhook writes with the admin client, loaded inside the handler after signature verification. The test/live flag (`event.livemode`) is checked against the expected environment.
- Triggers: `SECURITY DEFINER`, `search_path = public`, raising error code `P0001` with the message `FREE_LIMIT:<table>`. The app turns that into friendly text.
- The Free/Pro limits live in one SQL function, so changing a number later is a one-line migration.
