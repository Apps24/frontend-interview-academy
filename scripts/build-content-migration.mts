// Builds the JavaScript Beginner content migration from content/javascript-beginner/*.json.
// Run with: npx tsx scripts/build-content-migration.mts [--write] [--skip-run]
// Validates content, runs every reference solution against visible and hidden tests,
// then emits SQL to supabase/migrations/20260918103429_javascript_beginner_foundation.sql.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { CONTENT_NAMESPACE, contentId } from "./content-id.mjs";
import { javascriptLessons } from "../src/lib/curriculum";

const ROOT = resolve(import.meta.dirname, "..");
const DIR = resolve(ROOT, "content/javascript-beginner");
const OUT = resolve(ROOT, "supabase/migrations/20260918103429_javascript_beginner_foundation.sql");
const WRITE = process.argv.includes("--write");
const SKIP_RUN = process.argv.includes("--skip-run");

const EXISTING = {
  trackId: "10000000-0000-4000-8000-000000000001",
  foundationsModuleId: "10000000-0000-4000-8000-000000000002",
  javascriptTopicId: null as string | null,
};

type Block = { type: string; title: string; body: string; code?: string; code_language?: string };
type Lesson = { slug: string; module: string; position: number; difficulty: number; estimated_minutes: number; access_level: string; title: string; summary: string; objectives: string[]; prerequisites: string[]; practice_link: string; blocks: Block[]; sources?: Source[] };
type Question = { slug: string; lesson: string; position: number; type: string; difficulty: number; tags: string[]; prompt: string; code: string; options: string[]; correct?: number[]; expected?: string; explanation: string; rationale: string; misconceptions: Record<string, string> };
type Test = { label: string; expression: string; expected: unknown };
type Problem = { slug: string; title: string; topic: string; difficulty: number; estimated_minutes: number; is_premium: boolean; position: number; summary: string; prompt: string; contract: object; constraints: string[]; starter_code: string; tests: Test[]; hidden_tests: Test[]; hints: string[]; solution_code: string; explanation: string; complexity: string; sources?: Source[] };
type Source = { title: string; url: string; publisher: string };
type InterviewQuestion = { slug: string; topic: string; position: number; difficulty: number; experience_level: string; is_premium: boolean; title: string; short_answer: string; detailed_answer: string; code_example: string; common_mistakes: string[]; follow_ups: string[] };

const read = <T,>(name: string): T => JSON.parse(readFileSync(resolve(DIR, name), "utf8"));
const modulesFile = read<{ track: { slug: string; technology: string; level: string; title: string; description: string }; modules: { slug: string; title: string; description: string; position: number }[] }>("modules.json");
const lessons: Lesson[] = [...read<Lesson[]>("lessons-1.json"), ...read<Lesson[]>("lessons-2.json"), ...read<Lesson[]>("lessons-3.json")];
const questions: Question[] = [...read<Question[]>("questions-1.json"), ...read<Question[]>("questions-2.json")];
const problems: Problem[] = [...read<Problem[]>("problems-1.json"), ...read<Problem[]>("problems-2.json")];
const interview = read<{ topics: { slug: string; title: string; description: string; position: number }[]; backfill: Record<string, { experience_level: string; common_mistakes: string[] }>; questions: InterviewQuestion[] }>("interview.json");
const backfill = read<{ problems: Record<string, { contract: object; constraints: string[]; hidden_tests: Test[] }>; questions_v2_explanations: Record<string, string> }>("backfill.json");

const existingLessonSlugs = new Set(javascriptLessons.map((l) => l.slug));
const existingQuestionSlugs = new Set(javascriptLessons.map((l) => l.question.slug));
const existingProblemSlugs = new Set(Object.keys(backfill.problems));
const existingInterviewSlugs = new Set(Object.keys(interview.backfill));

const errors: string[] = [];
const warn: string[] = [];
const fail = (msg: string) => errors.push(msg);

// ---------- validation ----------
function unique(label: string, values: string[]) {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) fail(`${label}: duplicate '${v}'`);
    seen.add(v);
  }
}

unique("module slugs", modulesFile.modules.map((m) => m.slug));
unique("lesson slugs", [...existingLessonSlugs, ...lessons.map((l) => l.slug)]);
unique("question slugs", [...existingQuestionSlugs, ...questions.map((q) => q.slug)]);
unique("problem slugs", [...existingProblemSlugs, ...problems.map((p) => p.slug)]);
unique("interview slugs", [...existingInterviewSlugs, ...interview.questions.map((q) => q.slug)]);
unique("interview topic slugs", interview.topics.map((t) => t.slug));
unique("problem positions", problems.map((p) => String(p.position)));

const moduleSlugs = new Set(modulesFile.modules.map((m) => m.slug));
const lessonSlugs = new Set([...existingLessonSlugs, ...lessons.map((l) => l.slug)]);
const problemSlugs = new Set([...existingProblemSlugs, ...problems.map((p) => p.slug)]);
const topicSlugs = new Set(interview.topics.map((t) => t.slug));
const blockTypes = new Set(["explanation", "example", "common_mistakes", "interview_relevance", "practice_link", "summary"]);

for (const l of lessons) {
  if (!moduleSlugs.has(l.module)) fail(`lesson ${l.slug}: unknown module ${l.module}`);
  if (!["free", "pro"].includes(l.access_level)) fail(`lesson ${l.slug}: bad access_level`);
  if (!Array.isArray(l.objectives) || l.objectives.length < 3) fail(`lesson ${l.slug}: needs >= 3 objectives`);
  for (const p of l.prerequisites) if (!lessonSlugs.has(p)) fail(`lesson ${l.slug}: unknown prerequisite ${p}`);
  if (!problemSlugs.has(l.practice_link)) fail(`lesson ${l.slug}: unknown practice_link ${l.practice_link}`);
  const types = l.blocks.map((b) => b.type);
  for (const t of types) if (!blockTypes.has(t)) fail(`lesson ${l.slug}: bad block type ${t}`);
  if (!types.includes("explanation")) fail(`lesson ${l.slug}: missing explanation block`);
  if (types.filter((t) => t === "example").length < 2) fail(`lesson ${l.slug}: needs >= 2 example blocks`);
  for (const t of ["common_mistakes", "interview_relevance", "practice_link"]) if (!types.includes(t)) fail(`lesson ${l.slug}: missing ${t} block`);
  const explanationWords = l.blocks.find((b) => b.type === "explanation")!.body.split(/\s+/).length;
  const totalWords = l.blocks.reduce((n, b) => n + b.body.split(/\s+/).length + (b.code?.split(/\s+/).length ?? 0), 0);
  if (explanationWords < 140) fail(`lesson ${l.slug}: explanation too short (${explanationWords} words)`);
  if (totalWords < 350) fail(`lesson ${l.slug}: lesson body too short (${totalWords} words)`);
  if (!l.sources?.length) fail(`lesson ${l.slug}: no sources`);
  if (l.estimated_minutes < 1 || l.estimated_minutes > 600) fail(`lesson ${l.slug}: bad minutes`);
}

const questionsPerLesson = new Map<string, number>();
for (const q of questions) {
  if (!lessonSlugs.has(q.lesson)) fail(`question ${q.slug}: unknown lesson ${q.lesson}`);
  questionsPerLesson.set(q.lesson, (questionsPerLesson.get(q.lesson) ?? 0) + 1);
  if (!["single_choice", "multi_choice", "output"].includes(q.type)) fail(`question ${q.slug}: bad type`);
  if (q.type === "output") {
    if (typeof q.expected !== "string" || !q.expected) fail(`question ${q.slug}: output needs expected`);
  } else {
    if (q.options.length !== 4) fail(`question ${q.slug}: needs 4 options`);
    if (!q.correct?.length) fail(`question ${q.slug}: needs correct`);
    for (const c of q.correct ?? []) if (c < 0 || c > 3) fail(`question ${q.slug}: correct index out of range`);
    if (q.type === "single_choice" && q.correct?.length !== 1) fail(`question ${q.slug}: single_choice needs one answer`);
    for (const key of Object.keys(q.misconceptions)) if (q.correct?.includes(Number(key))) fail(`question ${q.slug}: misconception on correct option ${key}`);
  }
  if (!q.rationale || !q.explanation) fail(`question ${q.slug}: needs explanation and rationale`);
  if (![1, 2, 3].includes(q.difficulty)) fail(`question ${q.slug}: bad difficulty`);
  if (!q.tags?.length) fail(`question ${q.slug}: needs tags`);
}
for (const l of lessons) if ((questionsPerLesson.get(l.slug) ?? 0) < 3) fail(`lesson ${l.slug}: needs 3 questions, has ${questionsPerLesson.get(l.slug) ?? 0}`);
for (const slug of existingLessonSlugs) if ((questionsPerLesson.get(slug) ?? 0) + 1 < 3) fail(`existing lesson ${slug}: needs 2 new questions`);

const testShape = (t: Test, where: string) => {
  if (!t.label || !t.expression || !("expected" in t)) fail(`${where}: bad test shape`);
};
for (const p of problems) {
  if (p.tests.length < 3) fail(`problem ${p.slug}: needs >= 3 visible tests`);
  if (p.hidden_tests.length < 3) fail(`problem ${p.slug}: needs >= 3 hidden tests`);
  if (p.hints.length < 3) fail(`problem ${p.slug}: needs >= 3 hints`);
  if (!p.solution_code || !p.explanation || !p.starter_code || !p.contract) fail(`problem ${p.slug}: incomplete`);
  p.tests.forEach((t) => testShape(t, `problem ${p.slug} visible`));
  p.hidden_tests.forEach((t) => testShape(t, `problem ${p.slug} hidden`));
  if (![1, 2, 3].includes(p.difficulty)) fail(`problem ${p.slug}: bad difficulty`);
}
for (const [slug, b] of Object.entries(backfill.problems)) {
  if (b.hidden_tests.length < 3) fail(`backfill ${slug}: needs >= 3 hidden tests`);
  b.hidden_tests.forEach((t) => testShape(t, `backfill ${slug}`));
}
for (const q of interview.questions) {
  if (!topicSlugs.has(q.topic)) fail(`interview ${q.slug}: unknown topic ${q.topic}`);
  if (!["junior", "mid", "senior"].includes(q.experience_level)) fail(`interview ${q.slug}: bad level`);
  for (const f of ["short_answer", "detailed_answer", "code_example"] as const) if (!q[f]) fail(`interview ${q.slug}: missing ${f}`);
  if (q.common_mistakes.length < 2 || q.follow_ups.length < 2) fail(`interview ${q.slug}: needs >= 2 mistakes and follow-ups`);
  const words = q.short_answer.split(/\s+/).length;
  if (words > 110) warn.push(`interview ${q.slug}: short answer is ${words} words`);
}

// near-duplicate detection (token-set Jaccard)
const STOP = new Set(["console", "log", "const", "let", "var", "return", "function", "this", "the", "what", "does", "print", "code", "true", "false", "null", "undefined", "from", "with", "and", "that", "for", "you"]);
const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const jaccard = (a: Set<string>, b: Set<string>) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
};
function nearDupes(label: string, items: { slug: string; text: string }[], threshold = 0.7) {
  const toks = items.map((i) => ({ slug: i.slug, t: tokens(i.text) }));
  for (let i = 0; i < toks.length; i++) for (let j = i + 1; j < toks.length; j++) {
    const s = jaccard(toks[i].t, toks[j].t);
    if (toks[i].t.size >= 6 && toks[j].t.size >= 6 && s > threshold) fail(`${label}: near-duplicate ${toks[i].slug} ~ ${toks[j].slug} (${s.toFixed(2)})`);
  }
}
nearDupes("questions", questions.map((q) => ({ slug: q.slug, text: q.code || q.prompt })));
nearDupes("problems", problems.map((p) => ({ slug: p.slug, text: p.prompt })));
nearDupes("interview", interview.questions.map((q) => ({ slug: q.slug, text: q.title })));
nearDupes("lessons", lessons.map((l) => ({ slug: l.slug, text: l.summary })));

// ---------- run reference solutions ----------
async function runTest(code: string, test: Test) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('"use strict";\n' + code + "\nreturn await (" + test.expression + ");");
  const value = await Promise.race([
    run(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
  ]);
  const passed = JSON.stringify(value) === JSON.stringify(test.expected);
  return { passed, value };
}

async function runAll() {
  let ran = 0;
  for (const p of problems) {
    for (const [kind, tests] of [["visible", p.tests], ["hidden", p.hidden_tests]] as const) {
      for (const t of tests) {
        ran++;
        try {
          const { passed, value } = await runTest(p.solution_code, t);
          if (!passed) fail(`problem ${p.slug} ${kind} '${t.label}': expected ${JSON.stringify(t.expected)} got ${JSON.stringify(value)}`);
        } catch (e) {
          fail(`problem ${p.slug} ${kind} '${t.label}': threw ${(e as Error).message}`);
        }
      }
    }
  }
  return ran;
}

// ---------- SQL helpers ----------
function lit(value: string | null | undefined) {
  if (value == null) return "null";
  let tag = "c";
  while (value.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${value}$${tag}$`;
}
const jsonb = (value: unknown) => `${lit(JSON.stringify(value))}::jsonb`;
const textArray = (values: string[]) => `array[${values.map((v) => lit(v)).join(", ")}]::text[]`;
const bool = (v: boolean) => (v ? "true" : "false");

// Groups rows per table into one multi-row insert with a single ON CONFLICT clause.
class Batch {
  private groups = new Map<string, { header: string; conflict: string; rows: string[] }>();
  add(table: string, columns: string, conflict: string, row: string) {
    const key = `${table}|${columns}|${conflict}`;
    if (!this.groups.has(key)) this.groups.set(key, { header: `insert into ${table} (${columns}) values`, conflict, rows: [] });
    this.groups.get(key)!.rows.push(`(${row})`);
  }
  flush() {
    const order = ["public.modules", "public.lessons", "public.lesson_content_blocks", "public.questions", "public.question_answer_keys", "public.lesson_questions", "public.practice_problems", "public.practice_solutions", "public.practice_hidden_tests", "public.interview_topics", "public.interview_questions", "public.interview_question_answers", "public.content_sources"];
    const rank = (key: string) => { const i = order.indexOf(key.split("|")[0]); if (i === -1) throw new Error(`no flush order for ${key}`); return i; };
    const out: string[] = [];
    for (const [, g] of [...this.groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0]))) {
      for (let i = 0; i < g.rows.length; i += 200) {
        out.push(`${g.header}\n${g.rows.slice(i, i + 200).join(",\n")}\n${g.conflict};`);
      }
    }
    this.groups.clear();
    return out.join("\n");
  }
}
const batch = new Batch();

const ids = {
  module: (slug: string) => contentId("modules", slug),
  lesson: (slug: string) => (existingLessonSlugs.has(slug) ? javascriptLessons.find((l) => l.slug === slug)!.id : contentId("lessons", slug)),
  question: (slug: string) => {
    const existing = javascriptLessons.find((l) => l.question.slug === slug);
    return existing ? existing.question.id : contentId("questions", slug);
  },
  problem: (slug: string) => contentId("practice_problems", slug),
  topic: (slug: string) => contentId("interview_topics", slug),
  interview: (slug: string) => contentId("interview_questions", slug),
  block: (lessonSlug: string, position: number) => contentId("lesson_content_blocks", `${lessonSlug}#${position}`),
  source: (entityType: string, entityId: string, url: string) => contentId("content_sources", `${entityType}:${entityId}:${url}`),
};

function emitSql() {
  const out: string[] = [];
  out.push(`-- Batch 1: JavaScript Beginner foundation.
-- Generated by scripts/build-content-migration.mts from content/javascript-beginner/*.json.
-- Deterministic ids: uuid5(${CONTENT_NAMESPACE}, '<table>:<slug>') — see docs/CONTENT_IDS.md.
-- Additive only: no table is dropped, renamed, or recreated; no user data is touched.

-- ---------- schema additions ----------
alter table public.tracks add column if not exists technology text not null default 'javascript';
alter table public.tracks add column if not exists level text not null default 'beginner';
alter table public.tracks drop constraint if exists tracks_level_check;
alter table public.tracks add constraint tracks_level_check check (level in ('beginner', 'intermediate', 'advanced'));

alter table public.lessons add column if not exists access_level text not null default 'free';
alter table public.lessons drop constraint if exists lessons_access_level_check;
alter table public.lessons add constraint lessons_access_level_check check (access_level in ('free', 'pro'));
alter table public.lessons add column if not exists objectives jsonb not null default '[]'::jsonb;
alter table public.lessons drop constraint if exists lessons_objectives_check;
alter table public.lessons add constraint lessons_objectives_check check (jsonb_typeof(objectives) = 'array');
alter table public.lessons add column if not exists prerequisites jsonb not null default '[]'::jsonb;
alter table public.lessons drop constraint if exists lessons_prerequisites_check;
alter table public.lessons add constraint lessons_prerequisites_check check (jsonb_typeof(prerequisites) = 'array');

alter table public.questions add column if not exists topic_tags text[] not null default '{}'::text[];

alter table public.practice_problems add column if not exists technology text not null default 'javascript';
alter table public.practice_problems add column if not exists contract jsonb not null default '{}'::jsonb;
alter table public.practice_problems add column if not exists constraints jsonb not null default '[]'::jsonb;
alter table public.practice_problems drop constraint if exists practice_problems_constraints_check;
alter table public.practice_problems add constraint practice_problems_constraints_check check (jsonb_typeof(constraints) = 'array');

alter table public.interview_topics add column if not exists technology text not null default 'javascript';
alter table public.interview_questions add column if not exists experience_level text not null default 'junior';
alter table public.interview_questions drop constraint if exists interview_questions_experience_level_check;
alter table public.interview_questions add constraint interview_questions_experience_level_check check (experience_level in ('junior', 'mid', 'senior'));
alter table public.interview_question_answers add column if not exists common_mistakes jsonb not null default '[]'::jsonb;
alter table public.interview_question_answers drop constraint if exists interview_question_answers_common_mistakes_check;
alter table public.interview_question_answers add constraint interview_question_answers_common_mistakes_check check (jsonb_typeof(common_mistakes) = 'array');

create table if not exists public.lesson_content_blocks (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position >= 0),
  block_type text not null check (block_type in ('explanation', 'example', 'common_mistakes', 'interview_relevance', 'practice_link', 'summary')),
  title text not null,
  body text not null default '',
  code text,
  code_language text,
  meta jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position)
);

create table if not exists public.question_answer_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer jsonb not null,
  rationale text not null,
  misconceptions jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_hidden_tests (
  problem_id uuid primary key references public.practice_problems(id) on delete cascade,
  tests jsonb not null check (jsonb_typeof(tests) = 'array'),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_sources (
  id uuid primary key,
  entity_type text not null check (entity_type in ('lesson', 'practice_problem', 'interview_question')),
  entity_id uuid not null,
  title text not null,
  url text not null,
  publisher text not null,
  accessed_on date not null default current_date,
  note text,
  unique (entity_type, entity_id, url)
);

create index if not exists lesson_content_blocks_lesson_position_idx on public.lesson_content_blocks(lesson_id, position);
create index if not exists content_sources_entity_idx on public.content_sources(entity_type, entity_id);
create index if not exists tracks_technology_level_idx on public.tracks(technology, level);
create index if not exists practice_problems_technology_idx on public.practice_problems(technology, position);

alter table public.lesson_content_blocks enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.practice_hidden_tests enable row level security;
alter table public.content_sources enable row level security;

drop policy if exists "Entitled lesson content blocks are readable" on public.lesson_content_blocks;
create policy "Entitled lesson content blocks are readable"
on public.lesson_content_blocks for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_id
      and l.status = 'published'
      and (
        l.access_level = 'free'
        or exists (
          select 1
          from public.entitlements e
          where e.user_id = (select auth.uid())
            and e.plan = 'pro'
            and e.status = 'active'
            and (e.current_period_end is null or e.current_period_end > now())
        )
      )
  )
);

drop policy if exists "Published content sources are readable" on public.content_sources;
create policy "Published content sources are readable"
on public.content_sources for select
to anon, authenticated
using (true);

-- question_answer_keys and practice_hidden_tests: RLS enabled, no policies, no grants.
-- Only the service role (server-side grading and hidden-test runner) can read them.
revoke all on public.question_answer_keys from anon, authenticated;
revoke all on public.practice_hidden_tests from anon, authenticated;
grant select on public.lesson_content_blocks, public.content_sources to anon, authenticated;

-- ---------- backfill existing content rows (metadata only; ids, slugs, positions unchanged) ----------
update public.tracks set technology = 'javascript', level = 'beginner', updated_at = now() where id = '${EXISTING.trackId}';
update public.interview_topics set technology = case slug when 'javascript' then 'javascript' when 'browser-web' then 'browser' when 'html-accessibility' then 'html' when 'css' then 'css' else technology end;
`);

  // existing lessons objectives + blocks (from src/lib/curriculum.ts)
  out.push("\n-- existing foundation lessons: objectives and content blocks");
  for (const l of javascriptLessons) {
    out.push(`update public.lessons set objectives = ${jsonb(l.objectives)}, updated_at = now() where id = '${l.id}';`);
    let pos = 1;
    const blocks: (Block & { id: string; position: number })[] = [];
    for (const s of l.sections) {
      blocks.push({ id: ids.block(l.slug, pos), position: pos, type: "explanation", title: s.title, body: s.body, code: s.code, code_language: s.code ? "javascript" : undefined });
      pos++;
      if (s.interviewNote) {
        blocks.push({ id: ids.block(l.slug, pos), position: pos, type: "interview_relevance", title: "Interview note", body: s.interviewNote });
        pos++;
      }
    }
    out.push(insertBlocks(l.id, blocks));
  }

  // existing questions: answer keys + neutral public explanation (D4), version 2
  out.push("\n-- existing questions: protected answer keys; public explanation made neutral (version 2)");
  for (const l of javascriptLessons) {
    const q = l.question;
    out.push(`update public.questions set explanation = ${lit(backfill.questions_v2_explanations[q.slug])}, version = 2, topic_tags = ${textArray([l.slug.split("-")[0], "foundations"])}, updated_at = now() where id = '${q.id}';`);
    batch.add("public.question_answer_keys", "question_id, answer, rationale, misconceptions, version", "on conflict (question_id) do update set answer = excluded.answer, rationale = excluded.rationale, misconceptions = excluded.misconceptions, version = excluded.version, updated_at = now()", `'${q.id}', ${jsonb({ correct: [q.answer] })}, ${lit(q.explanation)}, '{}'::jsonb, 2`);
  }

  // existing problems: contract, constraints, hidden tests
  out.push("\n-- existing practice problems: contract, constraints, hidden tests");
  for (const [slug, b] of Object.entries(backfill.problems)) {
    out.push(`update public.practice_problems set technology = 'javascript', contract = ${jsonb(b.contract)}, constraints = ${jsonb(b.constraints)}, updated_at = now() where slug = ${lit(slug)};`);
    out.push(`insert into public.practice_hidden_tests (problem_id, tests, version) select id, ${jsonb(b.hidden_tests)}, 1 from public.practice_problems where slug = ${lit(slug)}
on conflict (problem_id) do update set tests = excluded.tests, version = excluded.version, updated_at = now();`);
  }

  // existing interview questions: experience level + common mistakes
  out.push("\n-- existing interview questions: experience level and common mistakes");
  for (const [slug, b] of Object.entries(interview.backfill)) {
    out.push(`update public.interview_questions set experience_level = ${lit(b.experience_level)}, updated_at = now() where slug = ${lit(slug)};`);
    out.push(`update public.interview_question_answers a set common_mistakes = ${jsonb(b.common_mistakes)}, updated_at = now() from public.interview_questions q where q.id = a.question_id and q.slug = ${lit(slug)};`);
  }

  // ---------- new content ----------
  out.push("\n-- ---------- new modules ----------");
  for (const m of modulesFile.modules) {
    out.push(`insert into public.modules (id, track_id, slug, title, description, position, status) values ('${ids.module(m.slug)}', '${EXISTING.trackId}', ${lit(m.slug)}, ${lit(m.title)}, ${lit(m.description)}, ${m.position}, 'published')
on conflict (track_id, slug) do update set title = excluded.title, description = excluded.description, position = excluded.position, status = excluded.status, updated_at = now();`);
  }

  out.push("\n-- ---------- new lessons ----------");
  for (const l of lessons) {
    const lessonId = ids.lesson(l.slug);
    batch.add("public.lessons", "id, module_id, slug, title, summary, body_key, difficulty, estimated_minutes, position, version, status, access_level, objectives, prerequisites", "on conflict (module_id, slug) do update set title = excluded.title, summary = excluded.summary, body_key = excluded.body_key, difficulty = excluded.difficulty, estimated_minutes = excluded.estimated_minutes, position = excluded.position, version = excluded.version, status = excluded.status, access_level = excluded.access_level, objectives = excluded.objectives, prerequisites = excluded.prerequisites, updated_at = now()", `'${lessonId}', '${ids.module(l.module)}', ${lit(l.slug)}, ${lit(l.title)}, ${lit(l.summary)}, ${lit(`javascript.${l.slug}.v1`)}, ${l.difficulty}, ${l.estimated_minutes}, ${l.position}, 1, 'published', ${lit(l.access_level)}, ${jsonb(l.objectives)}, ${jsonb(l.prerequisites)}`);
    out.push(insertBlocks(lessonId, l.blocks.map((b, i) => ({ ...b, id: ids.block(l.slug, i + 1), position: i + 1, meta: b.type === "practice_link" ? { problem: l.practice_link } : undefined }))));
    out.push(insertSources("lesson", lessonId, l.sources ?? []));
  }

  out.push("\n-- ---------- new quiz questions and answer keys ----------");
  for (const q of questions) {
    const qid = ids.question(q.slug);
    const payload = q.type === "output" ? { code: q.code } : { code: q.code, options: q.options };
    batch.add("public.questions", "id, slug, question_type, prompt, payload, explanation, difficulty, version, status, topic_tags", "on conflict (slug) do update set question_type = excluded.question_type, prompt = excluded.prompt, payload = excluded.payload, explanation = excluded.explanation, difficulty = excluded.difficulty, version = excluded.version, status = excluded.status, topic_tags = excluded.topic_tags, updated_at = now()", `'${qid}', ${lit(q.slug)}, ${lit(q.type)}, ${lit(q.prompt)}, ${jsonb(payload)}, ${lit(q.explanation)}, ${q.difficulty}, 1, 'published', ${textArray(q.tags)}`);
    const answer = q.type === "output" ? { expected: q.expected } : { correct: q.correct };
    batch.add("public.question_answer_keys", "question_id, answer, rationale, misconceptions, version", "on conflict (question_id) do update set answer = excluded.answer, rationale = excluded.rationale, misconceptions = excluded.misconceptions, version = excluded.version, updated_at = now()", `'${qid}', ${jsonb(answer)}, ${lit(q.rationale)}, ${jsonb(q.misconceptions)}, 1`);
    batch.add("public.lesson_questions", "lesson_id, question_id, position", "on conflict (lesson_id, question_id) do update set position = excluded.position", `'${ids.lesson(q.lesson)}', '${qid}', ${q.position}`);
  }

  out.push("\n-- ---------- new coding problems ----------");
  for (const p of problems) {
    const pid = ids.problem(p.slug);
    batch.add("public.practice_problems", "id, slug, title, summary, prompt, topic, difficulty, estimated_minutes, starter_code, test_cases, hints, is_premium, position, status, technology, contract, constraints", "on conflict (slug) do update set title = excluded.title, summary = excluded.summary, prompt = excluded.prompt, topic = excluded.topic, difficulty = excluded.difficulty, estimated_minutes = excluded.estimated_minutes, starter_code = excluded.starter_code, test_cases = excluded.test_cases, hints = excluded.hints, is_premium = excluded.is_premium, position = excluded.position, status = excluded.status, technology = excluded.technology, contract = excluded.contract, constraints = excluded.constraints, updated_at = now()", `'${pid}', ${lit(p.slug)}, ${lit(p.title)}, ${lit(p.summary)}, ${lit(p.prompt)}, ${lit(p.topic)}, ${p.difficulty}, ${p.estimated_minutes}, ${lit(p.starter_code)}, ${jsonb(p.tests)}, ${jsonb(p.hints)}, ${bool(p.is_premium)}, ${p.position}, 'published', 'javascript', ${jsonb(p.contract)}, ${jsonb(p.constraints)}`);
    batch.add("public.practice_solutions", "problem_id, solution_code, explanation, complexity", "on conflict (problem_id) do update set solution_code = excluded.solution_code, explanation = excluded.explanation, complexity = excluded.complexity, updated_at = now()", `'${pid}', ${lit(p.solution_code)}, ${lit(p.explanation)}, ${lit(p.complexity)}`);
    batch.add("public.practice_hidden_tests", "problem_id, tests, version", "on conflict (problem_id) do update set tests = excluded.tests, version = excluded.version, updated_at = now()", `'${pid}', ${jsonb(p.hidden_tests)}, 1`);
    out.push(insertSources("practice_problem", pid, p.sources ?? []));
  }

  out.push("\n-- ---------- new interview topics and questions ----------");
  for (const t of interview.topics) {
    out.push(`insert into public.interview_topics (id, slug, title, description, position, status, technology) values ('${ids.topic(t.slug)}', ${lit(t.slug)}, ${lit(t.title)}, ${lit(t.description)}, ${t.position}, 'published', 'javascript')
on conflict (slug) do update set title = excluded.title, description = excluded.description, position = excluded.position, status = excluded.status, technology = excluded.technology, updated_at = now();`);
  }
  for (const q of interview.questions) {
    const qid = ids.interview(q.slug);
    batch.add("public.interview_questions", "id, topic_id, slug, title, short_answer, difficulty, is_premium, position, status, experience_level", "on conflict (slug) do update set topic_id = excluded.topic_id, title = excluded.title, short_answer = excluded.short_answer, difficulty = excluded.difficulty, is_premium = excluded.is_premium, position = excluded.position, status = excluded.status, experience_level = excluded.experience_level, updated_at = now()", `'${qid}', '${ids.topic(q.topic)}', ${lit(q.slug)}, ${lit(q.title)}, ${lit(q.short_answer)}, ${q.difficulty}, ${bool(q.is_premium)}, ${q.position}, 'published', ${lit(q.experience_level)}`);
    batch.add("public.interview_question_answers", "question_id, detailed_answer, code_example, follow_ups, common_mistakes", "on conflict (question_id) do update set detailed_answer = excluded.detailed_answer, code_example = excluded.code_example, follow_ups = excluded.follow_ups, common_mistakes = excluded.common_mistakes, updated_at = now()", `'${qid}', ${lit(q.detailed_answer)}, ${lit(q.code_example)}, ${jsonb(q.follow_ups)}, ${jsonb(q.common_mistakes)}`);
  }

  out.push("\n-- ---------- batched content rows (order: parents before children) ----------");
  out.push(batch.flush());
  return out.filter(Boolean).join("\n") + "\n";
}

function insertBlocks(lessonId: string, blocks: (Block & { id: string; position: number; meta?: object })[]) {
  for (const b of blocks) batch.add("public.lesson_content_blocks", "id, lesson_id, position, block_type, title, body, code, code_language, meta, version", "on conflict (lesson_id, position) do update set id = excluded.id, block_type = excluded.block_type, title = excluded.title, body = excluded.body, code = excluded.code, code_language = excluded.code_language, meta = excluded.meta, version = excluded.version, updated_at = now()", `'${b.id}', '${lessonId}', ${b.position}, ${lit(b.type)}, ${lit(b.title)}, ${lit(b.body ?? "")}, ${lit(b.code)}, ${lit(b.code_language)}, ${jsonb(b.meta ?? {})}, 1`);
  return "";
}

function insertSources(entityType: string, entityId: string, sources: Source[]) {
  for (const s of sources) batch.add("public.content_sources", "id, entity_type, entity_id, title, url, publisher, accessed_on", "on conflict (entity_type, entity_id, url) do update set title = excluded.title, publisher = excluded.publisher", `'${ids.source(entityType, entityId, s.url)}', ${lit(entityType)}, '${entityId}', ${lit(s.title)}, ${lit(s.url)}, ${lit(s.publisher)}, '2026-09-18'`);
  return "";
}

// ---------- main ----------
const ran = SKIP_RUN ? 0 : await runAll();

const summary = {
  namespace: CONTENT_NAMESPACE,
  modules_new: modulesFile.modules.length,
  lessons_new: lessons.length,
  lessons_total: lessons.length + javascriptLessons.length,
  lessons_pro: lessons.filter((l) => l.access_level === "pro").length,
  blocks_new: lessons.reduce((n, l) => n + l.blocks.length, 0) + javascriptLessons.reduce((n, l) => n + l.sections.length + l.sections.filter((s) => s.interviewNote).length, 0),
  questions_new: questions.length,
  questions_total: questions.length + javascriptLessons.length,
  questions_by_type: Object.fromEntries(["single_choice", "multi_choice", "output"].map((t) => [t, questions.filter((q) => q.type === t).length])),
  problems_new: problems.length,
  problems_total: problems.length + existingProblemSlugs.size,
  problems_pro_new: problems.filter((p) => p.is_premium).length,
  interview_topics_new: interview.topics.length,
  interview_new: interview.questions.length,
  interview_pro_new: interview.questions.filter((q) => q.is_premium).length,
  interview_by_level: Object.fromEntries(["junior", "mid", "senior"].map((l) => [l, interview.questions.filter((q) => q.experience_level === l).length])),
  sources: lessons.reduce((n, l) => n + (l.sources?.length ?? 0), 0) + problems.reduce((n, p) => n + (p.sources?.length ?? 0), 0),
  solution_tests_run: ran,
};
console.log(JSON.stringify(summary, null, 2));
for (const w of warn) console.warn("warn:", w);
if (errors.length) {
  console.error(`\n${errors.length} validation error(s):`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("\nvalidation: OK");
if (WRITE) {
  writeFileSync(OUT, emitSql());
  console.log(`wrote ${OUT}`);
}
