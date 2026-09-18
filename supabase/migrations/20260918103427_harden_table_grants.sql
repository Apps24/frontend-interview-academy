-- Harden Data API grants.
--
-- Supabase's default privileges for role "postgres" in schema "public" grant ALL on
-- every new table to anon and authenticated. Row Level Security made that safe in
-- practice (a table with no policy returns no rows), but it is broader than the
-- explicit grants each migration declared, and TRUNCATE is not subject to RLS.
-- This migration makes the effective grants equal the declared grants, and stops
-- future tables from inheriting the broad defaults. No schema or data changes.

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- initial_learning_schema
grant select on public.tracks, public.modules, public.lessons, public.questions, public.lesson_questions to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert on public.question_attempts to authenticated;
grant select on public.entitlements to authenticated;
-- anon needs SELECT privilege on entitlements only so that entitlement-aware policies
-- (interview answers, practice solutions, behavioral guides) can evaluate their
-- subquery. RLS on entitlements has no anon policy, so anon still sees zero rows.
grant select on public.entitlements to anon;
-- phase_two_sprint_and_curriculum
grant select, insert, update, delete on public.sprint_item_progress to authenticated;
-- interview_question_bank
grant select on public.interview_topics, public.interview_questions, public.interview_question_answers to anon, authenticated;
grant select, insert, delete on public.interview_bookmarks to authenticated;
-- coding_practice
grant select on public.practice_problems, public.practice_solutions to anon, authenticated;
grant select, insert, update on public.practice_progress to authenticated;
-- last_minute_planner
grant select, insert, update on public.last_minute_plans to authenticated;
grant select, insert, delete on public.last_minute_task_progress to authenticated;
-- diagnostic_assessment
grant select, insert on public.diagnostic_attempts to authenticated;
-- behavioral_question_bank
grant select on public.behavioral_categories, public.behavioral_questions, public.behavioral_answer_guides to anon, authenticated;
grant select, insert, update, delete on public.star_drafts to authenticated;
