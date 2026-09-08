# JobOS final design and presentation pass

## Direction
Apply the selected bento-style information hierarchy across JobOS while keeping the locked identity authoritative:
- Warm paper canvas, charcoal text, petrol accent, subtle grey-green borders
- Instrument Serif for editorial headings; Work Sans for interface and body copy
- Structured 248px workspace sidebar
- Compact bento groupings only where they clarify related information
- Restrained 6–12px corners, near-flat surfaces, no gradients, glow, glass, fake data, or decorative AI styling

The selected prototype is a composition reference, not a content source. All rendered metrics, actions, navigation, statuses, and records will come from the existing product.

## Implementation

### 1. Establish the shared visual system
- Replace the existing blue-neutral tokens with the locked Petrol & Paper palette in the global stylesheet.
- Load Instrument Serif and Work Sans through the root document head.
- Standardize typography, focus rings, controls, tabs, badges, borders, shadows, spacing, and responsive surface behavior.
- Keep existing component APIs and behavior unchanged.

### 2. Refine the workspace shell
- Reorganize the existing navigation into Workspace, Career, and Account groups without changing routes.
- Rename visible labels to the agreed professional terminology: Overview, Career Record, Opportunities, Applications, Documents, Settings.
- Retain all existing disabled “Coming next” entries and make their state quiet but explicit.
- Refine desktop and mobile headers, account identity, active states, and page-width constraints.

### 3. Recompose authenticated screens
- **Overview:** adapt the selected bento structure to real match readiness, scored opportunities, recorded skills, active applications, top matches, and next actions; preserve refresh and onboarding behavior.
- **Career Record:** present skills, experience, education, and credentials as an orderly professional record with consistent add/remove patterns.
- **Opportunities:** emphasize score, role evidence, strengths, gaps, sample-posting status, save, explanation, and external posting links without adding new filters or logic.
- **Applications:** turn the existing status columns into a clearer responsive pipeline while preserving creation and status changes.
- **Documents:** clarify the two-part flow of adding resume text and reviewing extracted document status.
- **Settings:** organize the existing preferences as a calm settings form with readable enum labels.
- **Onboarding:** make the three-step intake feel deliberate and professional while preserving all fields, suggestions, and save behavior.

### 4. Redesign public and sign-in surfaces
- Reframe the home page around “Your career, organized.” with evidence-led product copy and no AI-startup language.
- Keep all existing authentication-aware calls to action and links.
- Refine sign-in/create-account presentation and copy while preserving the completed session, OAuth callback, confirmation, and error handling.

### 5. Verify the full presentation pass
- Check every content route at desktop and mobile widths, including 1440px and 375px.
- Confirm typography loads, text wraps correctly, focus states are visible, and controls remain keyboard-accessible.
- Exercise existing links, buttons, tabs, forms, status changes, responsive navigation, and sign-out where available.
- Confirm no authentication, database, matching, server-function, query, or route behavior was changed.
- Resolve any current build/runtime errors and verify route-specific metadata remains complete and JobOS-specific.

## Scope guardrails
- No schema, authentication, matching-engine, AI-provider, or data-model changes.
- No new product features or fake content.
- No removed controls, routes, statuses, forms, or disabled future items.
- No implementation of the prototype’s invented Export Report, New Application, response-rate, time-to-offer, or weekly-activity content.
