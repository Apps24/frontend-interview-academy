insert into public.tracks (id, slug, title, description, position, status)
values (
  '10000000-0000-4000-8000-000000000001',
  'javascript',
  'Modern JavaScript',
  'From values and scope to async code, browser APIs, and performance.',
  1,
  'published'
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  position = excluded.position,
  status = excluded.status,
  updated_at = now();

insert into public.modules (id, track_id, slug, title, description, position, status)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'foundations',
  'JavaScript foundations',
  'Core language concepts every frontend developer should be able to explain and apply.',
  1,
  'published'
)
on conflict (track_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  position = excluded.position,
  status = excluded.status,
  updated_at = now();

insert into public.lessons (id, module_id, slug, title, summary, body_key, difficulty, estimated_minutes, position, version, status)
values (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000002',
  'variables-and-types',
  'Variables & data types',
  'Understand how JavaScript stores values, how declarations differ, and what interviewers mean by primitive versus reference values.',
  'javascript.variables-and-types.v1',
  1,
  12,
  2,
  1,
  'published'
)
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
values (
  '10000000-0000-4000-8000-000000000004',
  'js-vars-001',
  'single_choice',
  'What does this code print?',
  '{"code":"const user = { name: ''Mira'' };\nconst copy = user;\ncopy.name = ''Ari'';\nconsole.log(user.name);","options":["Mira","Ari","undefined","It throws an error"]}'::jsonb,
  'Objects are assigned by sharing a reference to the same object. Changing copy.name changes the object that user also points to.',
  1,
  1,
  'published'
)
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
values (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  1
)
on conflict (lesson_id, question_id) do update set position = excluded.position;
