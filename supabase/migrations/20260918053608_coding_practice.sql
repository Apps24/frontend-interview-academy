create table public.practice_problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  prompt text not null,
  topic text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  estimated_minutes integer not null check (estimated_minutes between 1 and 240),
  starter_code text not null,
  test_cases jsonb not null default '[]'::jsonb check (jsonb_typeof(test_cases) = 'array'),
  hints jsonb not null default '[]'::jsonb check (jsonb_typeof(hints) = 'array'),
  is_premium boolean not null default false,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practice_solutions (
  problem_id uuid primary key references public.practice_problems(id) on delete cascade,
  solution_code text not null,
  explanation text not null,
  complexity text not null,
  updated_at timestamptz not null default now()
);

create table public.practice_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.practice_problems(id) on delete cascade,
  status text not null default 'started' check (status in ('started', 'solved')),
  last_code text not null default '' check (char_length(last_code) <= 50000),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create index practice_problems_topic_position_idx on public.practice_problems(topic, position);
create index practice_progress_problem_idx on public.practice_progress(problem_id);

alter table public.practice_problems enable row level security;
alter table public.practice_solutions enable row level security;
alter table public.practice_progress enable row level security;

create policy "Published practice problems are readable"
on public.practice_problems for select
to anon, authenticated
using (status = 'published');

create policy "Entitled practice solutions are readable"
on public.practice_solutions for select
to anon, authenticated
using (
  exists (
    select 1
    from public.practice_problems p
    where p.id = problem_id
      and p.status = 'published'
      and (
        not p.is_premium
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

create policy "Users can read their practice progress"
on public.practice_progress for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their practice progress"
on public.practice_progress for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their practice progress"
on public.practice_progress for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select on public.practice_problems, public.practice_solutions to anon, authenticated;
grant select, insert, update on public.practice_progress to authenticated;

insert into public.practice_problems (id, slug, title, summary, prompt, topic, difficulty, estimated_minutes, starter_code, test_cases, hints, is_premium, position, status) values
  ('40000000-0000-4000-8000-000000000001', 'reverse-words', 'Reverse words without reversing letters', 'Practice tokenization and careful output formatting.', $prompt$Write reverseWords(text) so it reverses the order of words. Treat consecutive whitespace as one separator and return words joined by a single space.$prompt$, 'Strings', 1, 15, $code$function reverseWords(text) {
  // Return the words in reverse order.
}$code$, jsonb_build_array(
    jsonb_build_object('label', 'basic sentence', 'expression', 'reverseWords("learn frontend clearly")', 'expected', 'clearly frontend learn'),
    jsonb_build_object('label', 'extra whitespace', 'expression', 'reverseWords("  ship   small  steps ")', 'expected', 'steps small ship'),
    jsonb_build_object('label', 'single word', 'expression', 'reverseWords("focus")', 'expected', 'focus')
  ), jsonb_build_array('Trim the input before splitting.', 'A regular expression can match one or more whitespace characters.'), false, 1, 'published'),
  ('40000000-0000-4000-8000-000000000002', 'valid-palindrome', 'Validate a normalized palindrome', 'Combine filtering, normalization, and two-pointer reasoning.', $prompt$Write isPalindrome(text). Ignore punctuation, spaces, and letter case. Return true when the remaining alphanumeric characters read the same in both directions.$prompt$, 'Strings', 1, 20, $code$function isPalindrome(text) {
  // Return true or false.
}$code$, jsonb_build_array(
    jsonb_build_object('label', 'classic phrase', 'expression', 'isPalindrome("A man, a plan, a canal: Panama")', 'expected', true),
    jsonb_build_object('label', 'not a palindrome', 'expression', 'isPalindrome("frontend")', 'expected', false),
    jsonb_build_object('label', 'empty after cleanup', 'expression', 'isPalindrome("...")', 'expected', true)
  ), jsonb_build_array('Normalize the text before comparing.', 'You can compare characters from both ends without creating a reversed copy.'), false, 2, 'published'),
  ('40000000-0000-4000-8000-000000000003', 'group-by-key', 'Group objects by a property', 'Transform a collection into a lookup object in one pass.', $prompt$Write groupBy(items, key). Return an object whose keys are property values and whose values are arrays containing the matching items. Preserve input order within each group.$prompt$, 'Arrays & objects', 2, 25, $code$function groupBy(items, key) {
  // Build and return the grouped object.
}$code$, jsonb_build_array(
    jsonb_build_object('label', 'group roles', 'expression', 'groupBy([{name:"A",role:"dev"},{name:"B",role:"design"},{name:"C",role:"dev"}], "role")', 'expected', jsonb_build_object('dev', jsonb_build_array(jsonb_build_object('name','A','role','dev'), jsonb_build_object('name','C','role','dev')), 'design', jsonb_build_array(jsonb_build_object('name','B','role','design')))),
    jsonb_build_object('label', 'empty input', 'expression', 'groupBy([], "type")', 'expected', jsonb_build_object())
  ), jsonb_build_array('Create the bucket when a value appears for the first time.', 'reduce is useful, but a for...of loop is equally valid.'), false, 3, 'published'),
  ('40000000-0000-4000-8000-000000000004', 'flatten-tree', 'Flatten a nested tree', 'Use recursion while preserving depth-first order.', $prompt$Write flattenTree(nodes). Each node has an id and may have a children array. Return an array of ids in pre-order depth-first traversal.$prompt$, 'Recursion', 2, 30, $code$function flattenTree(nodes) {
  // Return ids in depth-first pre-order.
}$code$, jsonb_build_array(
    jsonb_build_object('label', 'nested tree', 'expression', 'flattenTree([{id:"a",children:[{id:"b"},{id:"c",children:[{id:"d"}]}]},{id:"e"}])', 'expected', jsonb_build_array('a','b','c','d','e')),
    jsonb_build_object('label', 'empty forest', 'expression', 'flattenTree([])', 'expected', jsonb_build_array())
  ), jsonb_build_array('Add the current node before visiting its children.', 'A helper can share one output array across recursive calls.'), false, 4, 'published'),
  ('40000000-0000-4000-8000-000000000005', 'implement-debounce', 'Implement debounce', 'Control rapid calls while preserving the latest arguments.', $prompt$Write debounce(fn, delay). It should return a function that delays execution until calls have stopped for delay milliseconds. The latest call arguments and this value must be used.$prompt$, 'Functions', 3, 35, $code$function debounce(fn, delay) {
  // Return the debounced function.
}$code$, jsonb_build_array(), jsonb_build_array('Keep the timer identifier in a closure.', 'Use apply or Reflect.apply to preserve this.'), true, 5, 'published'),
  ('40000000-0000-4000-8000-000000000006', 'promise-pool', 'Run promises with a concurrency limit', 'Coordinate asynchronous work without exceeding a limit.', $prompt$Write promisePool(tasks, limit). tasks is an array of functions that each return a promise. Resolve with results in input order while running no more than limit tasks simultaneously.$prompt$, 'Async JavaScript', 3, 45, $code$async function promisePool(tasks, limit) {
  // Resolve with ordered results.
}$code$, jsonb_build_array(), jsonb_build_array('Share a next-index counter between workers.', 'Create at most min(limit, tasks.length) worker loops.'), true, 6, 'published');

insert into public.practice_solutions (problem_id, solution_code, explanation, complexity) values
  ('40000000-0000-4000-8000-000000000001', $code$function reverseWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).reverse().join(" ");
}$code$, 'Normalize whitespace into tokens, reverse the token array, and join it with one space. filter handles the empty-string edge case.', 'O(n) time and O(n) space'),
  ('40000000-0000-4000-8000-000000000002', $code$function isPalindrome(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left++] !== clean[right--]) return false;
  }
  return true;
}$code$, 'Normalize once, then compare symmetric characters with two pointers. Return immediately on the first mismatch.', 'O(n) time and O(n) space for normalization'),
  ('40000000-0000-4000-8000-000000000003', $code$function groupBy(items, key) {
  const groups = {};
  for (const item of items) {
    const value = item[key];
    (groups[value] ??= []).push(item);
  }
  return groups;
}$code$, 'Visit every item once. Nullish assignment creates a bucket only when it does not already exist.', 'O(n) time and O(n) space'),
  ('40000000-0000-4000-8000-000000000004', $code$function flattenTree(nodes) {
  const ids = [];
  function visit(items) {
    for (const node of items) {
      ids.push(node.id);
      if (node.children) visit(node.children);
    }
  }
  visit(nodes);
  return ids;
}$code$, 'Pre-order means recording the current node before recursively visiting children. The shared array avoids repeated concatenation.', 'O(n) time and O(h) call-stack space'),
  ('40000000-0000-4000-8000-000000000005', $code$function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => Reflect.apply(fn, this, args), delay);
  };
}$code$, 'The returned function closes over one timer. Each call cancels the previous schedule and creates a new trailing invocation.', 'O(1) work per call and O(1) retained state'),
  ('40000000-0000-4000-8000-000000000006', $code$async function promisePool(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  const count = Math.min(Math.max(1, limit), tasks.length);
  await Promise.all(Array.from({ length: count }, worker));
  return results;
}$code$, 'Workers share a synchronous index counter, claim one task at a time, and store results by original position. Promise.all waits for every worker.', 'O(n) time excluding task duration and O(n + limit) space');
