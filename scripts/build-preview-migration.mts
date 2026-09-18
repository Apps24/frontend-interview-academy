// Emits the body of supabase/migrations/*_neutralize_public_answer_material.sql from
// content/javascript-beginner/public-previews.json.
//
// Why this exists: RLS protects rows, not columns. Two publicly readable columns carried
// answer material that the gated tables were supposed to own — questions.explanation
// (which stated the rule the question tests) and interview_questions.short_answer
// (a full answer, including for premium questions). This migration moves the real text
// behind the entitlement gate and leaves answer-free framing in public.
//
// Run with: npx tsx scripts/build-preview-migration.mts [--write]

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = resolve(ROOT, "content/javascript-beginner/public-previews.json");
const TARGET = resolve(
  ROOT,
  "supabase/migrations/20260918130638_neutralize_public_answer_material.sql",
);

type Previews = {
  questionExplanations: Record<string, string>;
  premiumInterviewPreviews: Record<string, string>;
};

const previews = JSON.parse(readFileSync(SOURCE, "utf8")) as Previews;

// Dollar-quoting avoids escaping apostrophes, which are common in this prose.
const quote = (value: string) => {
  if (value.includes("$c$")) throw new Error(`value collides with the dollar-quote tag: ${value}`);
  return `$c$${value}$c$`;
};

const errors: string[] = [];
const banned = /\b(returns the|is not equal|evaluates to|the answer is|because it)\b/i;

for (const [slug, text] of Object.entries(previews.questionExplanations)) {
  if (text.length < 30) errors.push(`${slug}: replacement is too short to be useful`);
  if (banned.test(text)) errors.push(`${slug}: replacement still asserts the governing fact`);
}
for (const [slug, text] of Object.entries(previews.premiumInterviewPreviews)) {
  if (text.length < 40) errors.push(`${slug}: premium preview is too short to be useful`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const explanationRows = Object.entries(previews.questionExplanations)
  .map(([slug, text]) => `  (${quote(slug)}, ${quote(text)})`)
  .join(",\n");

const previewRows = Object.entries(previews.premiumInterviewPreviews)
  .map(([slug, text]) => `  (${quote(slug)}, ${quote(text)})`)
  .join(",\n");

const sql = `-- Neutralize answer material that sits in publicly readable columns.
-- Version matches the migration already recorded by hosted Supabase.
--
-- RLS gates rows, not columns, so two columns readable by anon carried answer
-- material that belongs behind the entitlement gate:
--
--   questions.explanation           stated the rule the question tests
--   interview_questions.short_answer held a full answer, premium rows included
--
-- This migration moves the real text into the gated child tables and leaves
-- answer-free framing in the public columns. It is additive and idempotent:
-- no table, column or policy is dropped, and no seed migration is re-run.

-- 1. The gated table gains a home for the real short answer. It inherits the
--    existing entitlement policy and SELECT grant on interview_question_answers,
--    so nothing further is needed to protect it.
alter table public.interview_question_answers
  add column if not exists short_answer text;

-- 2. Move the current short answers across BEFORE the public column is rewritten.
--    The null guard makes a re-run a no-op instead of overwriting the good copy
--    with the framing text written in step 3.
update public.interview_question_answers a
   set short_answer = q.short_answer,
       updated_at = now()
  from public.interview_questions q
 where q.id = a.question_id
   and a.short_answer is null;

-- 3. Replace the public short answer on premium questions with framing that says
--    what the answer covers without giving it. The column is NOT NULL, so these
--    rows keep a usable preview rather than becoming empty.
update public.interview_questions q
   set short_answer = v.preview,
       updated_at = now()
  from (values
${previewRows}
  ) as v(slug, preview)
 where q.slug = v.slug
   and q.is_premium
   and q.short_answer is distinct from v.preview;

-- 4. Replace the public quiz explanations that stated the governing rule. The
--    full rationale already lives in question_answer_keys.rationale, which has
--    no policies and no grants, so nothing is lost. version = 2 marks a row whose
--    public explanation has been checked as answer-free, matching the six rows
--    neutralized in 20260918103429.
update public.questions q
   set explanation = v.explanation,
       version = 2,
       updated_at = now()
  from (values
${explanationRows}
  ) as v(slug, explanation)
 where q.slug = v.slug
   and (q.explanation is distinct from v.explanation or q.version <> 2);

-- 5. Guard rails. Fail loudly rather than leaving a partial fix in place.
do $$
declare
  leaking_questions integer;
  missing_short_answers integer;
begin
  select count(*) into leaking_questions from public.questions where version <> 2;
  if leaking_questions > 0 then
    raise exception 'still % question rows with an unreviewed public explanation', leaking_questions;
  end if;

  select count(*) into missing_short_answers
    from public.interview_question_answers where short_answer is null;
  if missing_short_answers > 0 then
    raise exception '% interview answers lost their short answer', missing_short_answers;
  end if;
end
$$;
`;

if (process.argv.includes("--write")) {
  writeFileSync(TARGET, sql);
  console.log(`wrote ${TARGET}`);
} else {
  console.log(sql);
}
console.log(
  `questions neutralized: ${Object.keys(previews.questionExplanations).length}, premium previews: ${Object.keys(previews.premiumInterviewPreviews).length}`,
);
