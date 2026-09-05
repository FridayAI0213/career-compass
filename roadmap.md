# JobOS improvement roadmap

## Phase 1 — Critical
- [ ] Centralised auth state (single listener, loading state, session for UI, getUser for authz)
- [ ] Google OAuth: preserve intended destination, dedicated callback route, surface OAuth errors
- [ ] Protected route/session behaviour verified end to end
- [ ] Loading / error / empty states across data-backed pages
- [ ] Duplicate application prevention (DB constraint + stateful Save button)
- [ ] Matching engine edge cases + vitest suite

## Phase 2 — Core product
- [ ] Career profile overview (editable) + Projects section
- [ ] Resume extraction review workflow (accept / edit / reject), secure file upload
- [ ] Opportunities: filters, sorting, richer cards, demo-data honesty
- [ ] Dashboard: correct metric naming, readiness, smarter next actions
- [ ] Application detail dialog, edit/delete

## Phase 3 — Retention
- [ ] Follow-ups (create, overdue, complete)
- [ ] Interviews (basic scheduling from an application)
- [ ] Settings restructure + human enum labels

## Phase 4 — Polish
- [ ] Mobile navigation + account menu
- [ ] Accessibility pass
- [ ] Branding/metadata cleanup, .env.example
- [ ] Production readiness sweep
