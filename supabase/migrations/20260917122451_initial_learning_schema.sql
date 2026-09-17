create extension if not exists pgcrypto;

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.progress_status as enum ('not_started', 'in_progress', 'completed');
create type public.subscription_plan as enum ('free', 'pro');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  target_role text,
  experience_level text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  position integer not null default 0 check (position >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  position integer not null default 0 check (position >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track_id, slug)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null,
  body_key text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  estimated_minutes integer not null check (estimated_minutes between 1 and 600),
  position integer not null default 0 check (position >= 0),
  version integer not null default 1 check (version > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question_type text not null check (question_type in ('single_choice', 'multi_choice', 'output', 'debug', 'written')),
  prompt text not null,
  payload jsonb not null default '{}'::jsonb,
  explanation text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  version integer not null default 1 check (version > 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_questions (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position integer not null default 0,
  primary key (lesson_id, question_id)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  lesson_version integer not null,
  status public.progress_status not null default 'not_started',
  percent smallint not null default 0 check (percent between 0 and 100),
  last_position text,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  question_version integer not null,
  response jsonb not null,
  is_correct boolean,
  score numeric(5,2) check (score between 0 and 100),
  duration_ms integer check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create table public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status text not null default 'active',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index modules_track_position_idx on public.modules(track_id, position);
create index lessons_module_position_idx on public.lessons(module_id, position);
create index question_attempts_user_created_idx on public.question_attempts(user_id, created_at desc);
create index lesson_progress_user_status_idx on public.lesson_progress(user_id, status);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.lesson_questions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.question_attempts enable row level security;
alter table public.entitlements enable row level security;

create policy "published tracks are public" on public.tracks for select to anon, authenticated using (status = 'published');
create policy "published modules are public" on public.modules for select to anon, authenticated using (status = 'published');
create policy "published lessons are public" on public.lessons for select to anon, authenticated using (status = 'published');
create policy "published questions are public" on public.questions for select to anon, authenticated using (status = 'published');
create policy "published lesson questions are public" on public.lesson_questions for select to anon, authenticated using (
  exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
  and exists (select 1 from public.questions q where q.id = question_id and q.status = 'published')
);

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users read own lesson progress" on public.lesson_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own lesson progress" on public.lesson_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own lesson progress" on public.lesson_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own lesson progress" on public.lesson_progress for delete to authenticated using ((select auth.uid()) = user_id);
create policy "users read own attempts" on public.question_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own attempts" on public.question_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users read own entitlements" on public.entitlements for select to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.tracks, public.modules, public.lessons, public.questions, public.lesson_questions to anon, authenticated;
grant select, insert, update on public.profiles, public.lesson_progress to authenticated;
grant delete on public.lesson_progress to authenticated;
grant select, insert on public.question_attempts to authenticated;
grant select on public.entitlements to authenticated;
