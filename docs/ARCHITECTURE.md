# Architecture decisions

## ADR-001: Content ownership

The product launches with original lessons, examples, questions, and exercises. External repositories may be linked as references, but their content is not imported until a compatible license or written permission is recorded.

## ADR-002: Rendering

Public curriculum and lesson shells are Server Components. Interactivity is isolated to small Client Components such as the quiz. Authenticated data will use the user's Supabase session and RLS rather than a privileged browser client.

## ADR-003: Cloudflare

Cloudflare's current preferred Next.js path is vinext, which is still marked beta. The Phase 0 compatibility check reports 100%, and both the canonical Next.js build and Cloudflare vinext build pass. Generated deployment configuration uses Workers Cache, no separate data cache, and no paid Cloudflare Images dependency. Keep the standard Next.js build working so the adapter remains reversible.

## ADR-004: Progress

Page views do not equal completion. Durable completion requires a checkpoint attempt. Phase 1 writes `lesson_progress` and `question_attempts` through authenticated server actions using the learner's RLS-scoped session. A later incorrect retry must never regress an already completed lesson.

## ADR-005: Authentication

Supabase Auth sessions are stored in cookies through `@supabase/ssr`. Next.js Proxy refreshes and validates the token with `getClaims()`, and every protected page and server action independently verifies the claims before reading or mutating user data. Only the publishable key is available to browser code.

## ADR-006: Two-day sprint

The sprint schedule is versioned application content, while `sprint_item_progress` stores only user ownership, the stable item key, and completion timestamps. Server actions validate keys against the application catalog before mutation. RLS restricts every select, insert, update, and delete to `auth.uid() = user_id`.

## ADR-007: Curriculum expansion

Phase 2 follows a progressive JavaScript topic order—expressions, values, conversion, equality, closures, then asynchronous flow—while keeping all explanations, examples, questions, and interview notes original. Stable database UUIDs connect published curriculum rows to per-user progress without coupling lesson prose to database rendering.

## ADR-008: Behavioral answers

Behavioral questions and their categories are published database content with the same free/Pro split as the technical bank: public rows hold the prompt, why it is asked, and what to cover; `behavioral_answer_guides` holds the example outline, pitfalls, and follow-ups behind an entitlement-aware policy. Learner answers are stored as structured STAR fields in `star_drafts` (owner-only RLS on every command) rather than one free-text blob so the review heuristics can measure section balance, and so future features such as printable answer sheets or mock-interview prompts can reuse the parts. Review feedback is computed in the browser from the draft alone; nothing is sent to a model. An earlier uncommitted schema for this feature was replaced by the repository migration so the migration history and the hosted project match.
