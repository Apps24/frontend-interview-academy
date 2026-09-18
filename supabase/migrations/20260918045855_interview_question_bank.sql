create table public.interview_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.interview_topics(id) on delete cascade,
  slug text not null unique,
  title text not null,
  short_answer text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  is_premium boolean not null default false,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_question_answers (
  question_id uuid primary key references public.interview_questions(id) on delete cascade,
  detailed_answer text not null,
  code_example text,
  follow_ups jsonb not null default '[]'::jsonb check (jsonb_typeof(follow_ups) = 'array'),
  updated_at timestamptz not null default now()
);

create table public.interview_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index interview_questions_topic_position_idx on public.interview_questions(topic_id, position);
create index interview_questions_status_premium_idx on public.interview_questions(status, is_premium);
create index interview_bookmarks_question_idx on public.interview_bookmarks(question_id);

alter table public.interview_topics enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_question_answers enable row level security;
alter table public.interview_bookmarks enable row level security;

create policy "Published interview topics are readable"
on public.interview_topics for select
to anon, authenticated
using (status = 'published');

create policy "Published interview questions are readable"
on public.interview_questions for select
to anon, authenticated
using (status = 'published');

create policy "Entitled interview answers are readable"
on public.interview_question_answers for select
to anon, authenticated
using (
  exists (
    select 1
    from public.interview_questions q
    where q.id = question_id
      and q.status = 'published'
      and (
        not q.is_premium
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

create policy "Users can read their interview bookmarks"
on public.interview_bookmarks for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their interview bookmarks"
on public.interview_bookmarks for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can delete their interview bookmarks"
on public.interview_bookmarks for delete
to authenticated
using (user_id = (select auth.uid()));

grant select on public.interview_topics, public.interview_questions, public.interview_question_answers to anon, authenticated;
grant select, insert, delete on public.interview_bookmarks to authenticated;

insert into public.interview_topics (id, slug, title, description, position, status) values
  ('20000000-0000-4000-8000-000000000001', 'javascript', 'JavaScript', 'Language fundamentals, async behavior, and production patterns.', 1, 'published'),
  ('20000000-0000-4000-8000-000000000002', 'browser-web', 'Browser & Web', 'Rendering, networking, storage, and browser performance.', 2, 'published'),
  ('20000000-0000-4000-8000-000000000003', 'html-accessibility', 'HTML & Accessibility', 'Semantic structure and accessible user experiences.', 3, 'published'),
  ('20000000-0000-4000-8000-000000000004', 'css', 'CSS', 'Layout, cascade, and visual rendering behavior.', 4, 'published');

insert into public.interview_questions (id, topic_id, slug, title, short_answer, difficulty, is_premium, position, status) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'let-const-var', 'What is the difference between let, const, and var?', 'var is function-scoped and hoisted with undefined. let and const are block-scoped and stay in the temporal dead zone until initialized; const prevents reassignment, not object mutation.', 1, false, 1, 'published'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'javascript-closures', 'What is a closure, and when is it useful?', 'A closure is a function together with access to the lexical environment where it was created, even after the outer function has returned.', 2, true, 2, 'published'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'equality-operators', 'How do == and === differ?', 'Strict equality compares without type coercion. Loose equality first applies a specified set of conversions, which can produce surprising results.', 1, false, 3, 'published'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'javascript-event-loop', 'How does the JavaScript event loop work?', 'The call stack runs synchronous work. When it is empty, queued jobs run: microtasks such as Promise callbacks drain before the browser takes the next task such as a timer or input event.', 3, true, 4, 'published'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'debounce-vs-throttle', 'When would you use debounce versus throttle?', 'Debounce waits for activity to stop before running; throttle limits execution to at most once per interval. Debounce suits search input, while throttle suits continuous scroll or pointer events.', 2, false, 5, 'published'),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'promise-all-failure', 'How does Promise.all handle failure?', 'Promise.all fulfills when every input fulfills and rejects as soon as one input rejects. It does not cancel the remaining operations.', 2, true, 6, 'published'),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'critical-rendering-path', 'Explain the critical rendering path.', 'The browser parses HTML into the DOM and CSS into the CSSOM, combines them into a render tree, performs layout, then paints and composites pixels.', 3, true, 1, 'published'),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', 'cors-preflight', 'What is CORS, and when does a preflight happen?', 'CORS is the browser-enforced protocol for cross-origin access. A preflight OPTIONS request checks permission before non-simple requests.', 3, true, 2, 'published'),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000002', 'storage-vs-cookies', 'When should you use localStorage versus cookies?', 'Use localStorage for non-sensitive client-only persistence. Use cookies when data must accompany HTTP requests, with HttpOnly, Secure, and SameSite protections where appropriate.', 2, false, 3, 'published'),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002', 'reflow-repaint-composite', 'What are reflow, repaint, and compositing?', 'Reflow recalculates geometry, repaint redraws pixels, and compositing combines existing layers. Layout work is usually the broadest and most expensive.', 2, false, 4, 'published'),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000003', 'semantic-html-benefits', 'Why does semantic HTML matter?', 'Semantic elements communicate structure to browsers, assistive technology, search engines, and developers while providing useful native behavior.', 1, false, 1, 'published'),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000003', 'native-html-vs-aria', 'Why prefer native HTML over ARIA?', 'Native controls include semantics, keyboard behavior, focus handling, and platform integration. ARIA can expose meaning but does not add behavior.', 2, false, 2, 'published'),
  ('30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000003', 'accessible-form-errors', 'How do you make form labels and errors accessible?', 'Give every control a programmatic label, connect help or error text with aria-describedby, identify invalid fields, and move or announce focus thoughtfully after submission.', 2, false, 3, 'published'),
  ('30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000004', 'css-cascade-specificity', 'How does the CSS cascade choose a winning declaration?', 'The cascade compares origin and importance, cascade layer, specificity, scoping proximity, then source order. Specificity is only one stage.', 2, false, 1, 'published'),
  ('30000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000004', 'flexbox-vs-grid', 'When should you use Flexbox versus Grid?', 'Flexbox is strongest for one-dimensional distribution along a row or column. Grid is strongest for two-dimensional rows and columns; they are often used together.', 1, false, 2, 'published'),
  ('30000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000004', 'stacking-contexts', 'What creates a stacking context?', 'A stacking context is an isolated z-axis group created by conditions such as positioned elements with z-index, opacity below 1, transforms, or isolation:isolate.', 3, true, 3, 'published');

insert into public.interview_question_answers (question_id, detailed_answer, code_example, follow_ups) values
  ('30000000-0000-4000-8000-000000000001', $answer$Use const by default because the binding cannot be reassigned. Use let when the binding must change. Avoid var in modern code: its function scope ignores ordinary blocks, and its declaration is hoisted and initialized to undefined. let and const declarations are also hoisted, but accessing them before initialization throws because they are in the temporal dead zone. A const object can still be mutated because the binding, not the value, is protected.$answer$, $code$const user = { name: "Ada" };
user.name = "Grace"; // valid mutation

let page = 1;
page += 1; // valid reassignment$code$, jsonb_build_array('Does const make an object immutable?', 'What is the temporal dead zone?')),
  ('30000000-0000-4000-8000-000000000002', $answer$JavaScript functions capture bindings from the lexical scope where they are declared. The captured environment remains reachable for as long as the inner function does. This enables private state, function factories, event handlers, memoization, and partial application. A closure captures a binding rather than a frozen snapshot, so later changes to that binding are visible. The tradeoff is lifetime: captured objects cannot be collected while the closure remains reachable.$answer$, $code$function createCounter() {
  let count = 0;
  return () => ++count;
}

const next = createCounter();
next(); // 1
next(); // 2$code$, jsonb_build_array('Do closures capture values or bindings?', 'How can closures cause memory retention?')),
  ('30000000-0000-4000-8000-000000000003', $answer$Strict equality compares values without converting their types, so 0 === false is false. Loose equality follows the Abstract Equality Comparison algorithm and may coerce operands; for example, 0 == false is true and null == undefined is true. Prefer strict equality because its result is easier to reason about. A deliberate null check with value == null is a common narrow exception when both null and undefined should match.$answer$, $code$0 === false;       // false
0 == false;        // true
null == undefined; // true
null === undefined;// false$code$, jsonb_build_array('When can == be used intentionally?', 'How does Object.is differ from ===?')),
  ('30000000-0000-4000-8000-000000000004', $answer$JavaScript executes one call stack at a time. Host APIs perform work such as timers and network requests outside that stack and enqueue callbacks when ready. After the current stack finishes, the runtime drains the microtask queue, including Promise reactions and queueMicrotask callbacks. The browser can then render before taking the next task from sources such as timers or user input. A long task or an endlessly replenished microtask queue can delay rendering and interaction.$answer$, $code$console.log("A");
setTimeout(() => console.log("task"), 0);
Promise.resolve().then(() => console.log("microtask"));
console.log("B");
// A, B, microtask, task$code$, jsonb_build_array('Can microtasks starve rendering?', 'Where does requestAnimationFrame run?')),
  ('30000000-0000-4000-8000-000000000005', $answer$Debouncing resets a timer on every call and invokes only after calls have stopped for a chosen delay. It is useful when only the final intent matters, such as validating a completed query. Throttling allows execution at a controlled maximum frequency, retaining periodic updates during continuous activity. Production implementations should define leading and trailing behavior and expose cancellation when a component unmounts.$answer$, $code$function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}$code$, jsonb_build_array('What are leading and trailing calls?', 'How would you cancel a pending debounce?')),
  ('30000000-0000-4000-8000-000000000006', $answer$Promise.all preserves input order and fulfills with an array only after every input fulfills. It rejects when the first observed rejection occurs, but the other operations continue unless you cancel them separately, for example with AbortController. Use Promise.allSettled when every outcome matters, Promise.any when the first fulfillment wins, and Promise.race when the first settled result wins.$answer$, $code$const results = await Promise.allSettled(requests);
for (const result of results) {
  if (result.status === "fulfilled") use(result.value);
  else report(result.reason);
}$code$, jsonb_build_array('Does Promise.all cancel remaining work?', 'Compare all, allSettled, any, and race.')),
  ('30000000-0000-4000-8000-000000000007', $answer$HTML bytes are incrementally parsed into the DOM. CSS is parsed into the CSSOM and generally blocks rendering because styles affect which nodes appear and their geometry. DOM and CSSOM produce a render tree, followed by layout, paint, and compositing. Parser-blocking scripts can delay DOM construction. Improve the path by sending useful HTML early, minimizing render-blocking CSS, deferring noncritical scripts, preloading only critical assets, and avoiding costly layout work.$answer$, null, jsonb_build_array('Why is CSS render-blocking?', 'How do async and defer affect parsing?')),
  ('30000000-0000-4000-8000-000000000008', $answer$The same-origin policy prevents scripts from freely reading cross-origin responses. CORS lets a server opt in with response headers such as Access-Control-Allow-Origin. The browser sends a preflight OPTIONS request before requests that are not simple, often because of the method, content type, or custom headers. The server must approve the requested origin, method, and headers. CORS is enforced by browsers; it is not authentication and does not protect a server from direct requests.$answer$, $code$Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type, Authorization$code$, jsonb_build_array('Which requests are simple?', 'Why is CORS not an authentication mechanism?')),
  ('30000000-0000-4000-8000-000000000009', $answer$localStorage is synchronous, origin-scoped, persists across browser restarts, and is readable by JavaScript, so an XSS vulnerability can expose it. Cookies are smaller and can be sent automatically with matching HTTP requests. Sensitive session identifiers are usually safer in Secure, HttpOnly, SameSite cookies, which reduce script access and cross-site request risk. Do not store secrets merely because storage is persistent.$answer$, null, jsonb_build_array('What does SameSite protect against?', 'Why can localStorage hurt performance?')),
  ('30000000-0000-4000-8000-000000000010', $answer$Layout, often called reflow, calculates element sizes and positions and can affect many descendants or siblings. Paint records or rasterizes visual changes such as colors and shadows. Compositing assembles already painted layers, often making transform and opacity animations cheaper. Avoid layout thrashing by batching reads before writes, reducing DOM scope, and measuring with performance tools instead of assuming every visual change is equally expensive.$answer$, $code$const width = element.offsetWidth; // read layout
requestAnimationFrame(() => {
  element.style.width = `${width + 20}px`; // write later
});$code$, jsonb_build_array('What is layout thrashing?', 'Are transform animations always free?')),
  ('30000000-0000-4000-8000-000000000011', $answer$Semantic elements express the role and structure of content: nav identifies navigation, button provides an operable control, and headings create a navigable outline. Browsers and assistive technologies can expose this information without extra code. Native semantics also improve maintainability and often supply keyboard and focus behavior. Choose elements for meaning first, then style them as needed.$answer$, null, jsonb_build_array('When would you use a div?', 'How should heading levels be chosen?')),
  ('30000000-0000-4000-8000-000000000012', $answer$Native HTML controls already implement semantics, keyboard interaction, focus behavior, states, and compatibility across accessibility APIs. ARIA changes what assistive technology perceives but does not implement expected interaction. For example, role button on a div still needs focusability and keyboard handlers. Use ARIA to fill genuine semantic gaps, keep states synchronized, and prefer a real button whenever it represents an action.$answer$, $code$<!-- Prefer this -->
<button type="button">Save</button>

<!-- Not a complete replacement -->
<div role="button">Save</div>$code$, jsonb_build_array('What is the first rule of ARIA?', 'What behavior must a custom button implement?')),
  ('30000000-0000-4000-8000-000000000013', $answer$Associate visible label text with its input using a label element and matching for and id values, or by nesting the input. Connect instructions and errors using aria-describedby, and set aria-invalid when validation fails. After submission, provide a concise error summary or move focus to the first invalid field when that helps the user recover. Do not rely on color or placeholder text alone.$answer$, $code$<label for="email">Email</label>
<input id="email" aria-invalid="true" aria-describedby="email-error">
<p id="email-error">Enter a valid email address.</p>$code$, jsonb_build_array('Should errors use aria-live?', 'When should focus move after validation?')),
  ('30000000-0000-4000-8000-000000000014', $answer$The cascade first considers relevance, then origin and importance, including transitions and animations. Within an origin it considers cascade layers, then specificity, then scoping proximity, and finally source order. Inline styles and !important participate in that larger model rather than simply winning everything. Keep specificity low with classes and use layers to define precedence between groups of styles.$answer$, $code$@layer reset, components, utilities;

@layer components {
  .button { color: white; }
}$code$, jsonb_build_array('How do cascade layers affect specificity?', 'How is :where() specificity calculated?')),
  ('30000000-0000-4000-8000-000000000015', $answer$Flexbox lays items out along a main axis and handles alignment or distribution in one dimension, even though items can wrap. Grid defines rows and columns together and can place items into a two-dimensional structure. Use Grid for page or component skeletons with aligned tracks and Flexbox for navigation, toolbars, and content distribution within a track. Combining them is normal.$answer$, null, jsonb_build_array('When is flex-wrap insufficient?', 'What is the difference between auto-fit and auto-fill?')),
  ('30000000-0000-4000-8000-000000000016', $answer$A stacking context is an independent z-ordering world. Descendants are layered within it and cannot use a large z-index to escape above a sibling stacking context. Common triggers include the root element, positioned elements with non-auto z-index, fixed or sticky positioning, opacity below 1, transforms, filters, containment, and isolation:isolate. Debug by finding the nearest ancestor contexts and comparing those contexts as units.$answer$, $code$.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  isolation: isolate;
}$code$, jsonb_build_array('Why does z-index sometimes appear not to work?', 'How do top-layer elements differ?'));
