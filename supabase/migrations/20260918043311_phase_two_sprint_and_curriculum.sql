create table public.sprint_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 80),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.sprint_item_progress enable row level security;

create policy "users read own sprint progress"
on public.sprint_item_progress for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users create own sprint progress"
on public.sprint_item_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own sprint progress"
on public.sprint_item_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users delete own sprint progress"
on public.sprint_item_progress for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.sprint_item_progress to authenticated;

insert into public.lessons (id, module_id, slug, title, summary, body_key, difficulty, estimated_minutes, position, version, status)
values
  ('10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'values-and-expressions', 'Values & expressions', 'Read JavaScript as expressions that produce values and statements that direct execution.', 'javascript.values-and-expressions.v1', 1, 12, 1, 1, 'published'),
  ('10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'type-conversion', 'Type conversion', 'Predict explicit and implicit conversions without relying on memorized tricks.', 'javascript.type-conversion.v1', 1, 15, 3, 1, 'published'),
  ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'operators-and-equality', 'Operators & equality', 'Use strict equality by default and reason clearly about short-circuiting and nullish values.', 'javascript.operators-and-equality.v1', 1, 18, 4, 1, 'published'),
  ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'scope-and-closures', 'Scope & closures', 'Explain lexical scope and use closures for private, persistent function state.', 'javascript.scope-and-closures.v1', 2, 24, 5, 1, 'published'),
  ('10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 'promises-and-async-flow', 'Promises & async flow', 'Trace synchronous work, promise microtasks, and async/await without guessing output order.', 'javascript.promises-and-async-flow.v1', 2, 30, 6, 1, 'published')
on conflict (module_id, slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body_key = excluded.body_key,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  position = excluded.position,
  version = excluded.version,
  status = excluded.status,
  updated_at = now();

insert into public.questions (id, slug, question_type, prompt, payload, explanation, difficulty, version, status)
values
  ('10000000-0000-4000-8000-000000000006', 'js-expressions-001', 'single_choice', 'What does the precedence example print?', jsonb_build_object('options', jsonb_build_array('20', '14', '24', 'It throws an error')), 'Multiplication is evaluated before addition, producing 14.', 1, 1, 'published'),
  ('10000000-0000-4000-8000-000000000008', 'js-conversion-001', 'single_choice', 'How are an empty string and a non-empty string converted?', jsonb_build_object('options', jsonb_build_array('NaN false', '0 false', '0 true', 'undefined true')), 'An empty string converts to numeric zero, while every non-empty string is truthy.', 1, 1, 'published'),
  ('10000000-0000-4000-8000-000000000010', 'js-equality-001', 'single_choice', 'How do loose and strict equality compare zero with false?', jsonb_build_object('options', jsonb_build_array('true true', 'false false', 'true false', 'false true')), 'Loose equality coerces false to zero; strict equality preserves the type difference.', 1, 1, 'published'),
  ('10000000-0000-4000-8000-000000000012', 'js-closures-001', 'single_choice', 'How does a closure-backed counter change across calls?', jsonb_build_object('options', jsonb_build_array('1 1', '1 2', '0 1', '2 2')), 'Both calls access and update the same closed-over count binding.', 2, 1, 'published'),
  ('10000000-0000-4000-8000-000000000014', 'js-async-001', 'single_choice', 'In what order do synchronous logs and a promise handler run?', jsonb_build_object('options', jsonb_build_array('A, B, C', 'B, A, C', 'A, C, B', 'C, B, A')), 'The current stack completes before the promise microtask runs.', 2, 1, 'published')
on conflict (slug) do update set
  question_type = excluded.question_type,
  prompt = excluded.prompt,
  payload = excluded.payload,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  version = excluded.version,
  status = excluded.status,
  updated_at = now();

insert into public.lesson_questions (lesson_id, question_id, position)
values
  ('10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000006', 1),
  ('10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000008', 1),
  ('10000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000010', 1),
  ('10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000012', 1),
  ('10000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000014', 1)
on conflict (lesson_id, question_id) do update set position = excluded.position;
