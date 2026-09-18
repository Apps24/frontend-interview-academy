-- Neutralize answer material that sits in publicly readable columns.
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
  ($c$array-like-and-iterables$c$, $c$Covers how these three categories overlap, which array methods work on each, and how to convert between them.$c$),
  ($c$closures-practical-uses$c$, $c$Covers the patterns closures make possible in day-to-day code, and what each one buys you over the alternatives.$c$),
  ($c$cors-basics$c$, $c$Covers which party enforces the rule, what the browser is protecting, and where the fix has to be made.$c$),
  ($c$cors-preflight$c$, $c$Covers what makes a request simple rather than preflighted, and what the extra round trip is checking.$c$),
  ($c$critical-rendering-path$c$, $c$Covers the stages between receiving HTML and painting pixels, and which resources block which stage.$c$),
  ($c$dom-performance-reflow$c$, $c$Covers the read/write pattern that causes repeated layout work, and the techniques for rendering long lists.$c$),
  ($c$dom-ready-and-script-loading$c$, $c$Covers how script placement and loading attributes decide whether the DOM exists when your code runs.$c$),
  ($c$es-modules-vs-commonjs$c$, $c$Covers resolution, timing and syntax differences between the two module systems, and where each is used.$c$),
  ($c$event-loop-microtasks-vs-tasks$c$, $c$Covers what lands in each queue, when each is drained, and what that ordering means in practice.$c$),
  ($c$floating-point-money$c$, $c$Covers why binary representation loses certain decimals, and the standard strategies for monetary values.$c$),
  ($c$iife-and-module-pattern$c$, $c$Covers the scoping problem this pattern solved before modules, and what replaced it.$c$),
  ($c$implicit-conversion-plus$c$, $c$Covers the rules this operator follows and how to avoid depending on them.$c$),
  ($c$javascript-closures$c$, $c$Covers what a closure captures, how long it lives, and the situations where that behaviour is the point.$c$),
  ($c$javascript-event-loop$c$, $c$Covers the call stack, the queues, and the order in which pending work is picked up.$c$),
  ($c$json-stringify-gotchas$c$, $c$Covers the values that do not survive the round trip, and what to do about each.$c$),
  ($c$map-vs-object$c$, $c$Covers key types, ordering, size and iteration, and the cases that push you toward one or the other.$c$),
  ($c$promise-all-failure$c$, $c$Covers what happens to the other promises, what the caller receives, and which combinator to reach for instead.$c$),
  ($c$stacking-contexts$c$, $c$Covers the properties that establish one and why z-index sometimes appears to be ignored.$c$)
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
  ($c$js-vars-002$c$, $c$Tests the difference between mutating a value and rebinding the variable that holds it.$c$),
  ($c$js-vars-003$c$, $c$Tests the results typeof gives for values that are easy to guess wrong.$c$),
  ($c$js-expressions-002$c$, $c$Tests when the increment operators produce their value relative to the update.$c$),
  ($c$js-expressions-003$c$, $c$Tests the distinction between an expression and a statement.$c$),
  ($c$js-conversion-002$c$, $c$Tests which arithmetic operators coerce a string operand and which do not.$c$),
  ($c$js-conversion-003$c$, $c$Tests which values are treated as falsy.$c$),
  ($c$js-equality-002$c$, $c$Tests how loose equality handles null and undefined.$c$),
  ($c$js-equality-003$c$, $c$Tests the difference between the logical OR and nullish coalescing operators.$c$),
  ($c$js-closures-002$c$, $c$Tests how the declaration keyword affects the binding a loop callback captures.$c$),
  ($c$js-closures-003$c$, $c$Tests when a let binding becomes readable inside its block.$c$),
  ($c$js-async-002$c$, $c$Tests what an async function's call site actually receives.$c$),
  ($c$js-async-003$c$, $c$Tests where a rejection surfaces in a promise chain.$c$),
  ($c$js-cond-001$c$, $c$Tests how execution moves from one switch case to the next.$c$),
  ($c$js-cond-002$c$, $c$Tests the effect of using an assignment where a comparison was intended.$c$),
  ($c$js-cond-003$c$, $c$Tests which equality a switch uses to match a case.$c$),
  ($c$js-loops-001$c$, $c$Tests what each of the two iteration statements yields.$c$),
  ($c$js-loops-002$c$, $c$Tests what reading an index beyond an array's length produces.$c$),
  ($c$js-loops-003$c$, $c$Tests how continue and break affect the remainder of a loop.$c$),
  ($c$js-guard-001$c$, $c$Tests a guard clause against an input whose truthiness is misleading.$c$),
  ($c$js-guard-002$c$, $c$Tests what happens to code that follows a return.$c$),
  ($c$js-guard-003$c$, $c$Tests how a property check behaves against inherited properties.$c$),
  ($c$js-funcs-001$c$, $c$Tests what is available before the line that declares it.$c$),
  ($c$js-funcs-002$c$, $c$Tests how an arrow function's body is parsed.$c$),
  ($c$js-funcs-003$c$, $c$Tests the fixed differences between arrow and regular functions.$c$),
  ($c$js-params-001$c$, $c$Tests which argument values trigger a parameter default.$c$),
  ($c$js-params-002$c$, $c$Tests spread and rest in the two positions they can appear.$c$),
  ($c$js-params-003$c$, $c$Tests how deep a copy made with spread actually goes.$c$),
  ($c$js-hof-001$c$, $c$Tests the difference between passing a function and passing its result.$c$),
  ($c$js-hof-002$c$, $c$Tests what each function returned by a factory captures.$c$),
  ($c$js-hof-003$c$, $c$Tests whether forEach waits for anything.$c$),
  ($c$js-objects-001$c$, $c$Tests how dot and bracket access differ in what they treat as the key.$c$),
  ($c$js-objects-002$c$, $c$Tests how to tell a missing key from one holding undefined.$c$),
  ($c$js-objects-003$c$, $c$Tests what an object key becomes and how two objects compare.$c$),
  ($c$js-this-001$c$, $c$Tests what determines the value of this.$c$),
  ($c$js-this-002$c$, $c$Tests what this refers to inside an arrow callback within a method.$c$),
  ($c$js-this-003$c$, $c$Tests whether a bound function's this can be changed afterwards.$c$),
  ($c$js-destr-001$c$, $c$Tests destructuring with renaming and defaults.$c$),
  ($c$js-destr-002$c$, $c$Tests optional chaining and nullish coalescing on a partly missing structure.$c$),
  ($c$js-destr-003$c$, $c$Tests destructuring a parameter that was not passed.$c$),
  ($c$js-arrays-001$c$, $c$Tests what the mutating array methods return, not only what they change.$c$),
  ($c$js-arrays-002$c$, $c$Tests which of the two methods mutates and what each returns.$c$),
  ($c$js-arrays-003$c$, $c$Tests which assignments share an array and which create a new one.$c$),
  ($c$js-mfr-001$c$, $c$Tests reduce on an array that may be empty.$c$),
  ($c$js-mfr-002$c$, $c$Tests what filter keeps, given a callback that returns a number.$c$),
  ($c$js-mfr-003$c$, $c$Tests what the reduce callback must return on each pass.$c$),
  ($c$js-search-001$c$, $c$Tests how sort orders values when no comparator is given.$c$),
  ($c$js-search-002$c$, $c$Tests find and every, including on an empty array.$c$),
  ($c$js-search-003$c$, $c$Tests which sorting methods mutate and which return a new array.$c$),
  ($c$js-strings-001$c$, $c$Tests whether a string method changes the string it was called on.$c$),
  ($c$js-strings-002$c$, $c$Tests what split produces around adjacent separators.$c$),
  ($c$js-strings-003$c$, $c$Tests replace, replaceAll and template literal interpolation together.$c$),
  ($c$js-numbers-001$c$, $c$Tests how NaN compares and which check detects it without coercing.$c$),
  ($c$js-numbers-002$c$, $c$Tests why some decimal sums do not compare equal to the obvious value.$c$),
  ($c$js-numbers-003$c$, $c$Tests how the numeric parsers and Math.round handle awkward input.$c$),
  ($c$js-json-001$c$, $c$Tests what JSON.stringify does with values it cannot represent.$c$),
  ($c$js-json-002$c$, $c$Tests what survives a round trip through JSON for a Date.$c$),
  ($c$js-json-003$c$, $c$Tests reading a key that was never stored and parsing the result.$c$),
  ($c$js-errors-001$c$, $c$Tests the order of finally relative to a return.$c$),
  ($c$js-errors-002$c$, $c$Tests which code a try block actually guards.$c$),
  ($c$js-errors-003$c$, $c$Tests what may be thrown and what is worth throwing.$c$),
  ($c$js-debug-001$c$, $c$Tests how to read a stack trace.$c$),
  ($c$js-debug-002$c$, $c$Tests what a logged object shows when expanded later.$c$),
  ($c$js-debug-003$c$, $c$Tests what a conditional breakpoint does.$c$),
  ($c$js-dom-001$c$, $c$Tests how innerHTML treats the string assigned to it.$c$),
  ($c$js-dom-002$c$, $c$Tests what each of the two query methods returns, including when nothing matches.$c$),
  ($c$js-dom-003$c$, $c$Tests classList operations and the type of a data attribute's value.$c$),
  ($c$js-nodes-001$c$, $c$Tests what happens when an element already in the document is appended elsewhere.$c$),
  ($c$js-nodes-002$c$, $c$Tests what a document fragment is for.$c$),
  ($c$js-nodes-003$c$, $c$Tests how to empty an element's children.$c$),
  ($c$js-events-001$c$, $c$Tests the difference between the two element properties on an event.$c$),
  ($c$js-events-002$c$, $c$Tests what removeEventListener needs in order to match.$c$),
  ($c$js-events-003$c$, $c$Tests the mechanism event delegation depends on.$c$),
  ($c$js-forms-001$c$, $c$Tests the type of a number input's value.$c$),
  ($c$js-forms-002$c$, $c$Tests what FormData includes for checkboxes.$c$),
  ($c$js-forms-003$c$, $c$Tests when each of the two form events fires.$c$),
  ($c$js-timers-001$c$, $c$Tests the order of synchronous code, microtasks and timer callbacks.$c$),
  ($c$js-timers-002$c$, $c$Tests when a timer callback can run relative to a blocking loop.$c$),
  ($c$js-timers-003$c$, $c$Tests how a repeating timer is stopped.$c$),
  ($c$js-fetch-001$c$, $c$Tests whether an error status rejects the fetch promise.$c$),
  ($c$js-fetch-002$c$, $c$Tests the cost of awaiting independent requests one after another.$c$),
  ($c$js-fetch-003$c$, $c$Tests what response.json() returns.$c$),
  ($c$js-modules-001$c$, $c$Tests which import forms are valid for a module with a default export.$c$),
  ($c$js-modules-002$c$, $c$Tests what an imported binding reflects after the exporter changes it.$c$),
  ($c$js-modules-003$c$, $c$Tests the defaults a module script brings with it.$c$),
  ($c$js-storage-001$c$, $c$Tests what localStorage does with a value that is not a string.$c$),
  ($c$js-storage-002$c$, $c$Tests how the two web storage areas differ.$c$),
  ($c$js-storage-003$c$, $c$Tests where DOM updates belong in a state-driven app.$c$)
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
