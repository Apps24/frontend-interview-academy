create table public.last_minute_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  duration_hours smallint not null default 2 check (duration_hours in (1, 2, 4, 8)),
  target_role text not null default 'Frontend developer' check (char_length(target_role) between 2 and 80),
  focus_topics text[] not null default array['javascript', 'browser']::text[] check (
    cardinality(focus_topics) between 1 and 4
    and focus_topics <@ array['javascript', 'browser', 'html-accessibility', 'css', 'coding', 'behavioral']::text[]
  ),
  interview_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.last_minute_task_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 80),
  completed_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.last_minute_plans enable row level security;
alter table public.last_minute_task_progress enable row level security;

create policy "Users can read their last minute plan"
on public.last_minute_plans for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their last minute plan"
on public.last_minute_plans for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their last minute plan"
on public.last_minute_plans for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can read their last minute task progress"
on public.last_minute_task_progress for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their last minute task progress"
on public.last_minute_task_progress for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can delete their last minute task progress"
on public.last_minute_task_progress for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update on public.last_minute_plans to authenticated;
grant select, insert, delete on public.last_minute_task_progress to authenticated;
