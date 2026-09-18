create table public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_correct smallint not null check (total_correct >= 0),
  total_questions smallint not null check (total_questions > 0 and total_correct <= total_questions),
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  topic_scores jsonb not null check (jsonb_typeof(topic_scores) = 'object'),
  weak_topics text[] not null default '{}'::text[] check (
    weak_topics <@ array['javascript', 'browser', 'html-accessibility', 'css']::text[]
  ),
  completed_at timestamptz not null default now()
);

create index diagnostic_attempts_user_completed_idx on public.diagnostic_attempts(user_id, completed_at desc);

alter table public.diagnostic_attempts enable row level security;

create policy "Users can read their diagnostic attempts"
on public.diagnostic_attempts for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their diagnostic attempts"
on public.diagnostic_attempts for insert
to authenticated
with check (user_id = (select auth.uid()));

grant select, insert on public.diagnostic_attempts to authenticated;
