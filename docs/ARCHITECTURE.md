# Architecture decisions

## ADR-001: Content ownership

The product launches with original lessons, examples, questions, and exercises. External repositories may be linked as references, but their content is not imported until a compatible license or written permission is recorded.

## ADR-002: Rendering

Public curriculum and lesson shells are Server Components. Interactivity is isolated to small Client Components such as the quiz. Authenticated data will use the user's Supabase session and RLS rather than a privileged browser client.

## ADR-003: Cloudflare

Cloudflare's current preferred Next.js path is vinext, which is still marked beta. The Phase 0 compatibility check reports 100%, and both the canonical Next.js build and Cloudflare vinext build pass. Generated deployment configuration uses Workers Cache, no separate data cache, and no paid Cloudflare Images dependency. Keep the standard Next.js build working so the adapter remains reversible.

## ADR-004: Progress

Page views do not equal completion. Durable completion requires a checkpoint attempt. The Phase 0 prototype stores the sample result locally; the next slice writes `lesson_progress` and `question_attempts` through the authenticated RLS-scoped client.
