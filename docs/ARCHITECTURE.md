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
