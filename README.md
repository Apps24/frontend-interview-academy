# Frontend Interview Academy

A Next.js learning platform for HTML, CSS, JavaScript, coding practice, and deadline-driven interview preparation.

## Current Phase 0 slice

- Responsive dark product homepage
- HTML/CSS/JavaScript track previews
- Two-day interview sprint preview
- Original JavaScript lesson
- Interactive knowledge check with local progress
- Supabase schema with per-user RLS policies
- Supabase browser/server client factories using publishable keys
- Cloudflare vinext configuration with a verified production build

## Local development

1. Copy `.env.example` to `.env.local` and enter values from a dedicated Supabase project.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Run `npm run check` before committing.

## Database

The initial migration is in `supabase/migrations`. It separates public published curriculum from owner-only progress, attempts, profiles, and entitlements. Secret/service credentials must never be placed in `NEXT_PUBLIC_*` variables.

## Cloudflare

`npm run cf:check` reports compatibility. `npm run build:vinext` creates the Worker build, and `npm run deploy:vinext` deploys it after Cloudflare authentication is available. See `docs/ARCHITECTURE.md`.
