# Frontend Interview Academy

A Next.js learning platform for HTML, CSS, JavaScript, coding practice, and deadline-driven interview preparation.

## Current Phase 2 slice

- Responsive dark product homepage
- HTML/CSS/JavaScript track previews
- Two-day interview sprint preview
- Original JavaScript lesson
- Email/password signup, confirmation, sign-in, and sign-out
- Protected learner progress dashboard
- Interactive knowledge check with per-user Supabase persistence
- Durable lesson completion and quiz-attempt history
- Six original JavaScript foundation lessons with saved checkpoints
- Two-day interview sprint with ten focused sessions
- Per-user sprint completion protected by Row Level Security
- Supabase schema with per-user RLS policies
- Supabase browser/server client factories using publishable keys
- Cloudflare vinext configuration with a verified production build

## Local development

1. Copy `.env.example` to `.env.local` and enter values from a dedicated Supabase project.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

For confirmation emails outside local development, add the deployed `/auth/confirm` URL to the Supabase Auth redirect allow list and set `NEXT_PUBLIC_SITE_URL` in the deployment environment.

Run `npm run check` before committing.

## Database

Migrations are in `supabase/migrations`. They separate public published curriculum from owner-only lesson progress, sprint progress, attempts, profiles, and entitlements. Six JavaScript checkpoints use stable IDs so application content and saved progress remain aligned. Secret/service credentials must never be placed in `NEXT_PUBLIC_*` variables.

Hosted project: `frontend-interview-academy` (`gverxjnipznemvmdxdxf`) in Mumbai. Local development uses the publishable key in the ignored `.env.local`; no privileged key is required by the browser application.

## Cloudflare

`npm run cf:check` reports compatibility. `npm run build:vinext` creates the Worker build, and `npm run deploy:vinext` deploys it after Cloudflare authentication is available. See `docs/ARCHITECTURE.md`.
