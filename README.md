# Frontend Interview Academy

A Next.js learning platform for HTML, CSS, JavaScript, coding practice, and deadline-driven interview preparation.

## Current product slice

- Responsive dark product homepage
- HTML/CSS/JavaScript track previews
- Two-day interview sprint preview
- Database-backed JavaScript beginner track with 10 modules and 31 lessons
- Email/password signup, confirmation, sign-in, and sign-out
- Protected learner progress dashboard
- Secure server-graded knowledge checks with per-user Supabase persistence
- Durable lesson completion and quiz-attempt history
- 93 JavaScript review questions with protected answer keys and saved checkpoints
- Two-day interview sprint with ten focused sessions
- Per-user sprint completion protected by Row Level Security
- Searchable interview bank with topic, difficulty, access, and bookmark filters
- 62 technical interview questions across JavaScript, Browser & Web, HTML & Accessibility, and CSS
- Public 30-second answers with deeper explanations, code examples, and follow-up prompts
- Database-enforced Free/Pro access: premium answers are stored separately and protected by RLS
- Per-user saved questions and plan summary on the account dashboard
- 31 coding challenges with contracts, constraints, an isolated browser test runner, hints, saved drafts, and solved progress
- RLS-protected practice drafts and entitlement-gated reference solutions
- Customizable 1-, 2-, 4-, or 8-hour last-minute plans based on weak topics and target role
- Durable per-user planner settings and task completion, with a useful unsigned local mode
- Twelve-question frontend diagnostic with server-only answer keys and topic-level scoring
- Saved attempt history and weak-topic recommendations that prefill the last-minute planner
- Behavioral and general interview bank: 24 original questions across six categories, each with what the interviewer is checking and what a strong answer covers
- STAR answer workspace with instant review (length, spoken time, Action share, "I" versus "we", measurable result), a rehearsal script mode, and draft/ready status
- Per-user STAR drafts protected by Row Level Security, with a local mode for unsigned visitors and a ready-count on the account dashboard
- Pro-gated example outlines, common pitfalls, and likely follow-ups stored separately from the public question rows
- Free/Pro product preview; payment checkout is reserved for the payments phase
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

Migrations are in `supabase/migrations`. They separate public published curriculum and question previews from owner-only progress and bookmarks. Premium answer bodies and behavioral example outlines live in separate RLS-protected tables and require an active Pro entitlement. JavaScript lessons, content blocks, quizzes, coding problems, and interview answers are database-backed. Secret/service credentials must never be placed in `NEXT_PUBLIC_*` variables.

Hosted project: `frontend-interview-academy` (`gverxjnipznemvmdxdxf`) in Mumbai. Local development uses the publishable key in the ignored `.env.local`. `SUPABASE_SECRET_KEY` is server-only and is required for protected quiz grading; it must be configured as a GitHub Actions secret and a Cloudflare Worker secret, never exposed to client code.

## Cloudflare

`npm run cf:check` reports compatibility. `npm run build:vinext` creates the Worker build, and `npm run deploy:vinext` deploys it after Cloudflare authentication is available. See `docs/ARCHITECTURE.md`.
