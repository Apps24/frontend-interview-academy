-- An earlier, uncommitted draft of this feature created behavioral_questions,
-- behavioral_guides, and behavioral_drafts directly on the hosted project without
-- any application code or repository migration. No learner data existed in them.
-- They are replaced here so the repository is the single source of truth.
drop table if exists public.behavioral_drafts;
drop table if exists public.behavioral_guides;
drop table if exists public.behavioral_questions;

create table public.behavioral_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.behavioral_questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.behavioral_categories(id) on delete cascade,
  slug text not null unique,
  title text not null,
  why_asked text not null,
  what_to_cover jsonb not null default '[]'::jsonb check (jsonb_typeof(what_to_cover) = 'array'),
  difficulty smallint not null check (difficulty between 1 and 3),
  is_premium boolean not null default false,
  position integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.behavioral_answer_guides (
  question_id uuid primary key references public.behavioral_questions(id) on delete cascade,
  example_outline text not null,
  pitfalls jsonb not null default '[]'::jsonb check (jsonb_typeof(pitfalls) = 'array'),
  follow_ups jsonb not null default '[]'::jsonb check (jsonb_typeof(follow_ups) = 'array'),
  updated_at timestamptz not null default now()
);

create table public.star_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.behavioral_questions(id) on delete cascade,
  situation text not null default '' check (char_length(situation) <= 2000),
  task text not null default '' check (char_length(task) <= 2000),
  action text not null default '' check (char_length(action) <= 3000),
  result text not null default '' check (char_length(result) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'ready')),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index behavioral_questions_category_position_idx on public.behavioral_questions(category_id, position);
create index behavioral_questions_status_premium_idx on public.behavioral_questions(status, is_premium);
create index star_drafts_question_idx on public.star_drafts(question_id);

alter table public.behavioral_categories enable row level security;
alter table public.behavioral_questions enable row level security;
alter table public.behavioral_answer_guides enable row level security;
alter table public.star_drafts enable row level security;

create policy "Published behavioral categories are readable"
on public.behavioral_categories for select
to anon, authenticated
using (status = 'published');

create policy "Published behavioral questions are readable"
on public.behavioral_questions for select
to anon, authenticated
using (status = 'published');

create policy "Entitled behavioral guides are readable"
on public.behavioral_answer_guides for select
to anon, authenticated
using (
  exists (
    select 1
    from public.behavioral_questions q
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

create policy "Users can read their STAR drafts"
on public.star_drafts for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can create their STAR drafts"
on public.star_drafts for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update their STAR drafts"
on public.star_drafts for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can delete their STAR drafts"
on public.star_drafts for delete
to authenticated
using (user_id = (select auth.uid()));

grant select on public.behavioral_categories, public.behavioral_questions, public.behavioral_answer_guides to anon, authenticated;
grant select, insert, update, delete on public.star_drafts to authenticated;

insert into public.behavioral_categories (id, slug, title, description, position, status) values
  ('70000000-0000-4000-8000-000000000001', 'introduction', 'Introduction & motivation', 'The opening questions that set the tone: who you are, why this role, and why now.', 1, 'published'),
  ('70000000-0000-4000-8000-000000000002', 'collaboration', 'Teamwork & collaboration', 'Working with designers, backend engineers, product managers, and other developers.', 2, 'published'),
  ('70000000-0000-4000-8000-000000000003', 'conflict', 'Conflict & feedback', 'Disagreements, difficult feedback, and pushing back without damaging trust.', 3, 'published'),
  ('70000000-0000-4000-8000-000000000004', 'ownership', 'Ownership & failure', 'Mistakes, incidents, missed deadlines, and what you did about them.', 4, 'published'),
  ('70000000-0000-4000-8000-000000000005', 'growth', 'Growth & learning', 'How you learn, adapt to new tools, and improve deliberately.', 5, 'published'),
  ('70000000-0000-4000-8000-000000000006', 'frontend-stories', 'Frontend-specific stories', 'Behavioral questions that expect a technical frontend story underneath.', 6, 'published');

insert into public.behavioral_questions (id, category_id, slug, title, why_asked, what_to_cover, difficulty, is_premium, position, status) values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'tell-me-about-yourself', 'Tell me about yourself.', 'Interviewers use this to see whether you can summarise your experience with a clear point, and to pick the threads they will pull on for the rest of the conversation.', $j$["A one-line present: your current role and the kind of frontend work you do", "Two or three highlights that connect directly to this job", "Why you are looking now and what you want next", "Keep it under 90 seconds and end by handing the conversation back"]$j$, 1, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 'why-this-company', 'Why do you want to work here?', 'They are checking whether you researched the company and whether your reasons line up with what the team actually does.', $j$["One specific thing about the product, engineering culture, or scale that attracts you", "How your experience maps to a problem they are solving", "What you expect to learn or contribute in the first year", "Avoid generic praise that could apply to any company"]$j$, 1, false, 2, 'published'),
  ('71000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 'why-leaving-current-role', 'Why are you leaving your current role?', 'This measures professionalism and self-awareness. Interviewers listen for whether you blame others and whether the reason will repeat at their company.', $j$["Lead with what you are moving toward, not what you are escaping", "State one honest, neutral reason for leaving", "Show respect for the current team and what you learned there", "Connect the reason to why this role fits better"]$j$, 2, false, 3, 'published'),
  ('71000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', 'proudest-project', 'What project are you most proud of?', 'A chance to demonstrate depth. Interviewers want to see impact, your specific contribution, and how you talk about technical decisions.', $j$["Context in one or two sentences: users, scale, constraints", "The part you personally owned and the hardest decision inside it", "A measurable outcome: performance, adoption, revenue, or reduced bugs", "One thing you would do differently now"]$j$, 2, false, 4, 'published'),
  ('71000000-0000-4000-8000-000000000005', '70000000-0000-4000-8000-000000000002', 'worked-with-designer', 'Tell me about a time you worked closely with a designer.', 'Frontend engineers sit between design and engineering. Interviewers want evidence that you can negotiate feasibility, accessibility, and polish without friction.', $j$["The design goal and the technical constraint that clashed", "How you communicated trade-offs early instead of late", "The compromise or alternative you proposed together", "What shipped and how the designer felt about the result"]$j$, 1, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000006', '70000000-0000-4000-8000-000000000002', 'unclear-requirements', 'Describe a time requirements were unclear. What did you do?', 'Ambiguity is the norm. They are checking whether you freeze, guess silently, or drive clarity through questions and small experiments.', $j$["The specific gap in the requirements", "Who you talked to and the questions you asked", "How you reduced risk: prototype, written proposal, or phased delivery", "How the clarified scope changed the outcome"]$j$, 2, false, 2, 'published'),
  ('71000000-0000-4000-8000-000000000007', '70000000-0000-4000-8000-000000000002', 'helped-teammate', 'Tell me about a time you helped a teammate who was struggling.', 'Senior-leaning signal. Interviewers listen for empathy, the ability to unblock others, and whether you respect the teammate rather than taking over.', $j$["How you noticed the struggle without being asked", "What kind of help you offered: pairing, review, breaking down the task", "How you kept ownership with the teammate", "The effect on the delivery and on the teammate"]$j$, 2, false, 3, 'published'),
  ('71000000-0000-4000-8000-000000000008', '70000000-0000-4000-8000-000000000002', 'cross-team-dependency', 'Describe a time you depended on another team to ship your work.', 'Cross-team delivery is where projects stall. They want to hear about communication, escalation judgement, and creative unblocking such as mocks or feature flags.', $j$["The dependency and why it blocked you", "How you built a shared timeline and visibility", "What you did to keep moving: contracts, mock APIs, feature flags", "When and how you escalated, if you did"]$j$, 3, true, 4, 'published'),
  ('71000000-0000-4000-8000-000000000009', '70000000-0000-4000-8000-000000000003', 'disagreed-with-decision', 'Tell me about a time you disagreed with a technical decision.', 'They are checking whether you can argue with evidence, accept a decision you did not win, and still commit to it fully.', $j$["The decision and the concrete concern you had", "How you made the case: data, prototypes, or documented risks", "What was decided and how you responded once it was final", "What happened afterwards and what you learned about influencing"]$j$, 2, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000010', '70000000-0000-4000-8000-000000000003', 'received-hard-feedback', 'Describe a time you received difficult feedback.', 'Coachability matters more than being right. Interviewers listen for whether you got defensive and whether the feedback produced a visible change.', $j$["The feedback itself, stated plainly", "Your first reaction and how you managed it", "The specific change you made in behaviour or work", "Evidence that the change stuck"]$j$, 1, false, 2, 'published'),
  ('71000000-0000-4000-8000-000000000011', '70000000-0000-4000-8000-000000000003', 'pushed-back-on-scope', 'Tell me about a time you pushed back on a deadline or scope.', 'This shows whether you protect quality and your team without being obstructive, and whether you bring options rather than only objections.', $j$["The request and why it was not achievable as stated", "The data or estimate you used to explain the risk", "The alternatives you offered: cut scope, phase it, add time", "How the stakeholder responded and what shipped"]$j$, 2, true, 3, 'published'),
  ('71000000-0000-4000-8000-000000000012', '70000000-0000-4000-8000-000000000003', 'difficult-code-review', 'Describe a code review that turned tense. How did you handle it?', 'Code review is where many teams fracture. They want to see how you separate the code from the person and keep the discussion about goals.', $j$["What the review was about and why it became tense", "How you moved the conversation to a call or shared principles", "The resolution and whether the code changed", "Anything you changed about how you review or receive reviews"]$j$, 2, false, 4, 'published'),
  ('71000000-0000-4000-8000-000000000013', '70000000-0000-4000-8000-000000000004', 'biggest-mistake', 'Tell me about a mistake you made at work.', 'Everyone makes mistakes; interviewers care about honesty, how fast you surfaced it, and whether you fixed the system rather than only the symptom.', $j$["A real mistake with real consequences, not a humble-brag", "How quickly you told the right people", "The immediate fix and the longer-term prevention", "What changed in your habits afterwards"]$j$, 1, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000014', '70000000-0000-4000-8000-000000000004', 'production-incident', 'Describe a production issue you were involved in.', 'They are looking for calm under pressure, clear communication during an incident, and a blameless approach to the root cause.', $j$["The user-visible impact and how it was detected", "Your role during the incident: diagnosis, mitigation, or communication", "The root cause and the fix", "The follow-up that made it less likely to happen again"]$j$, 2, false, 2, 'published'),
  ('71000000-0000-4000-8000-000000000015', '70000000-0000-4000-8000-000000000004', 'missed-deadline', 'Tell me about a time you missed a deadline.', 'They want to know whether you spot slippage early, communicate it honestly, and re-plan instead of quietly hoping to catch up.', $j$["What was promised and where the estimate went wrong", "When you realised and how quickly you raised it", "How you re-planned: reduced scope, new date, or extra help", "What you now do differently when estimating"]$j$, 2, true, 3, 'published'),
  ('71000000-0000-4000-8000-000000000016', '70000000-0000-4000-8000-000000000004', 'took-ownership-beyond-role', 'Describe a time you took ownership of something outside your job description.', 'A signal of initiative and judgement. Interviewers listen for whether the ownership helped the team and whether you handled it without stepping on others.', $j$["The gap you noticed and why it mattered", "Why you chose to act rather than wait", "How you kept the right people informed", "The lasting outcome and what it taught you"]$j$, 2, false, 4, 'published'),
  ('71000000-0000-4000-8000-000000000017', '70000000-0000-4000-8000-000000000005', 'learned-new-technology', 'Tell me about a time you had to learn a new technology quickly.', 'Frontend tooling changes constantly. They want to see a learning method, not just enthusiasm.', $j$["Why the technology was needed and the time pressure", "Your learning approach: docs, small spike, pairing, teaching others", "How you validated your understanding before relying on it", "The result and how you shared the knowledge"]$j$, 1, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000018', '70000000-0000-4000-8000-000000000005', 'weakness', 'What is a weakness you are working on?', 'A genuine self-awareness check. Interviewers dislike disguised strengths and respect a real weakness with a real improvement plan.', $j$["A real weakness that is not disqualifying for the role", "A concrete example of when it caused a problem", "The specific steps you are taking to improve", "Evidence that it is getting better"]$j$, 1, false, 2, 'published'),
  ('71000000-0000-4000-8000-000000000019', '70000000-0000-4000-8000-000000000005', 'stay-current', 'How do you stay current with frontend development?', 'They are checking for curiosity with judgement: do you evaluate new tools critically or chase every trend?', $j$["Two or three sources you actually use", "How you decide what is worth adopting", "A recent thing you learned and applied", "How you share what you learn with your team"]$j$, 1, false, 3, 'published'),
  ('71000000-0000-4000-8000-000000000020', '70000000-0000-4000-8000-000000000006', 'improved-performance', 'Tell me about a time you improved the performance of a web application.', 'This blends behavioural and technical assessment. They want measurement before and after, the diagnosis, and a story about prioritising the right fix.', $j$["The user-facing symptom and the metric you chose", "How you found the real bottleneck: profiling, Lighthouse, traces", "The fix and why you picked it over alternatives", "The measured improvement and how you prevented regressions"]$j$, 2, false, 1, 'published'),
  ('71000000-0000-4000-8000-000000000021', '70000000-0000-4000-8000-000000000006', 'accessibility-advocacy', 'Describe a time you advocated for accessibility or usability.', 'Accessibility is often deprioritised. Interviewers want evidence that you noticed a gap, made the business case, and shipped a fix.', $j$["The accessibility gap and who it affected", "How you made the case: testing, standards, legal or user impact", "What you changed and how you tested it", "How the team approaches accessibility now"]$j$, 2, true, 2, 'published'),
  ('71000000-0000-4000-8000-000000000022', '70000000-0000-4000-8000-000000000006', 'legacy-codebase', 'Tell me about working in a legacy or messy codebase.', 'Most real work is maintenance. They are checking whether you can improve things incrementally and safely without demanding a rewrite.', $j$["The state of the codebase and the risk it created", "How you built safety first: tests, feature flags, small pull requests", "The incremental improvements you shipped", "How you balanced cleanup with delivering features"]$j$, 2, false, 3, 'published'),
  ('71000000-0000-4000-8000-000000000023', '70000000-0000-4000-8000-000000000006', 'technical-decision-tradeoff', 'Describe a technical decision where you had to balance trade-offs.', 'A senior signal. Interviewers want structured thinking: options, criteria, the decision, and honest reflection on its costs.', $j$["The decision and the options on the table", "The criteria that mattered: time, complexity, performance, team skills", "What you chose and the cost you knowingly accepted", "How it played out and whether you would choose it again"]$j$, 3, true, 4, 'published'),
  ('71000000-0000-4000-8000-000000000024', '70000000-0000-4000-8000-000000000006', 'mentored-junior', 'Tell me about a time you mentored or onboarded another developer.', 'Even mid-level candidates are expected to lift others. They listen for patience, structure, and measurable growth in the other person.', $j$["The person and where they were starting from", "Your approach: pairing, curated tasks, review feedback", "How you adjusted when something was not working", "What the person can do now that they could not before"]$j$, 2, false, 5, 'published');

insert into public.behavioral_answer_guides (question_id, example_outline, pitfalls, follow_ups) values
  ('71000000-0000-4000-8000-000000000001', $g$Present: "I am a frontend engineer with about three years on a B2B dashboard used by a few thousand daily users. I own the ordering flow end to end in Angular."
Highlights: "Two things I am proud of: I cut our checkout load time from four seconds to under two by splitting bundles and lazy-loading the payment SDK, and I introduced our component library so three teams stopped rebuilding the same tables."
Why now: "I want to work on a product with more scale and a stronger design culture, which is why this role stood out."
Hand-back: "Happy to go deeper on any of that."$g$, $j$["Reciting your CV in chronological order", "Running past two minutes", "Sharing personal details unrelated to the job", "Ending without a clear point"]$j$, $j$["Which of those highlights was hardest and why?", "What would your current manager say you should work on?"]$j$),
  ('71000000-0000-4000-8000-000000000002', $g$Specific attraction: "Your product renders complex data tables for non-technical users, and I have spent two years learning what makes those fast and understandable."
Mapping: "The performance write-up on your engineering blog described a virtualisation problem I solved in a different context."
Contribution: "I expect to contribute on the rendering side quickly and learn how you run design systems at your scale."$g$, $j$["Talking only about what the company can do for you", "Mentioning salary or remote policy as the main reason", "Quoting the mission statement back without a personal link"]$j$, $j$["What concerns do you have about joining us?", "What do you think we do badly?"]$j$),
  ('71000000-0000-4000-8000-000000000003', $g$Forward-looking: "I am looking for a team where frontend architecture is a first-class concern."
Honest reason: "At my current company the frontend is one person deep, so I have limited peers to learn from."
Respect: "I have learned a lot about owning a product end to end and I am leaving on good terms."
Link: "That is why a team with several senior frontend engineers is attractive."$g$, $j$["Criticising your manager or colleagues", "Sounding bored or entitled", "Giving a reason that would also apply to the new company"]$j$, $j$["What would make you stay at your current company?", "How do you know this role will be different?"]$j$),
  ('71000000-0000-4000-8000-000000000004', $g$Situation: "Our POS terminal app crashed for cafeteria staff during peak lunch hours, affecting orders for roughly forty corporate sites."
Task: "I owned the investigation and the fix, with a two-week window before a large client onboarding."
Action: "I added crash reporting, found an unbounded in-memory order cache, replaced it with an indexed local store and a background sync queue, and wrote regression tests around the sync path."
Result: "Crashes dropped to zero over the next quarter and the onboarding went ahead. I would now introduce crash reporting on day one of any desktop app."$g$, $j$["Describing the whole team effort as if it were yours alone", "Listing technologies instead of decisions", "No numbers at all"]$j$, $j$["What was the hardest technical decision in that project?", "How did you know the fix was correct before shipping?"]$j$),
  ('71000000-0000-4000-8000-000000000005', $g$Situation: "A designer proposed an animated multi-step menu builder with drag-and-drop on mobile web."
Task: "I needed to ship it in a sprint while keeping it usable on low-end Android devices."
Action: "I built a rough prototype in a day, showed frame drops on a mid-range device, and proposed a tap-to-reorder fallback with the animation kept for desktop."
Result: "We shipped both variants, the designer used the prototype in later reviews, and we agreed on a rule: prototypes before pixel-perfect mockups for anything interactive."$g$, $j$["Framing the designer as the obstacle", "Saying you just implemented what was given", "Skipping how the relationship changed afterwards"]$j$, $j$["How do you handle a design that is not accessible?", "What do you do when a designer and a product manager disagree?"]$j$),
  ('71000000-0000-4000-8000-000000000006', $g$Situation: "A ticket said 'add reporting for admins' with no detail about which reports or which admins."
Task: "I was expected to estimate and start within two days."
Action: "I interviewed two customer admins, wrote a one-page proposal with three report types ranked by demand, and suggested shipping the top one first behind a feature flag."
Result: "The proposal was approved in a day, the first report shipped in a week, and the other two were reprioritised based on usage data."$g$, $j$["Describing guessing as initiative", "Blaming product for vague tickets", "No mention of how you reduced risk"]$j$, $j$["What if nobody could answer your questions?", "How do you decide when clarity is good enough to start?"]$j$),
  ('71000000-0000-4000-8000-000000000007', $g$Situation: "A newer teammate had a feature stuck in review for a week with growing comments."
Task: "The feature was on the release critical path and morale was dropping."
Action: "I offered to pair for an hour, we split the pull request into three smaller ones, and I reviewed the first within the hour so momentum returned."
Result: "All three merged within two days. The teammate now splits work by default and later used the same approach to help someone else."$g$, $j$["Taking over the work yourself", "Making the teammate sound incompetent", "No lasting change described"]$j$, $j$["How do you notice when someone is struggling remotely?", "When is it right not to help?"]$j$),
  ('71000000-0000-4000-8000-000000000008', $g$Situation: "Our new ordering UI depended on a payments API being built by another team with a slipping timeline."
Task: "I had a fixed launch date and could not move it."
Action: "I proposed an API contract in writing, built a mock server matching it, developed and tested the full UI against the mock, and set a weekly checkpoint with their lead. When the slip became clear I escalated once, with the shared timeline as evidence."
Result: "Integration took two days instead of two weeks when the real API arrived, and the contract-first approach became our standard."$g$, $j$["Complaining about the other team", "Escalating first instead of last", "Waiting idle with no mitigation"]$j$, $j$["How do you decide when to escalate?", "What if the contract changed late?"]$j$),
  ('71000000-0000-4000-8000-000000000009', $g$Situation: "The team wanted to adopt a new state management library across the whole app in one release."
Task: "I believed the migration risk was too high with our test coverage."
Action: "I measured coverage per module, prototyped the library in one isolated feature, and presented a phased plan with a rollback path."
Result: "The team chose the phased plan. I committed to it fully, migrated the first two modules myself, and we found and fixed a compatibility issue early that would have broken a big-bang migration."$g$, $j$["Being proud of winning rather than of the outcome", "Silent disagreement followed by 'I told you so'", "No evidence, only opinion"]$j$, $j$["What if the decision had gone against you?", "How do you disagree with someone more senior?"]$j$),
  ('71000000-0000-4000-8000-000000000010', $g$Situation: "My lead told me my pull request descriptions were so thin that reviewers had to reverse-engineer the intent."
Task: "I initially felt the code was self-explanatory."
Action: "I asked for an example of a good description, adopted a short template with context, approach, and testing notes, and asked the lead to check the next five."
Result: "Review turnaround for my work dropped noticeably, and the template was adopted by the team."$g$, $j$["Choosing feedback that is really a compliment", "Describing the feedback as unfair", "No visible change"]$j$, $j$["Tell me about feedback you disagreed with.", "How do you give difficult feedback?"]$j$),
  ('71000000-0000-4000-8000-000000000011', $g$Situation: "Sales promised a client a custom reporting module in three weeks; the honest estimate was seven."
Task: "I needed to protect quality without losing the deal."
Action: "I broke the module into features, estimated each with the team, and presented three options: the two most valuable reports in three weeks, everything in seven, or everything in four with another engineer."
Result: "The client accepted the phased option, the first phase shipped on time, and sales now checks estimates with engineering before committing."$g$, $j$["Simply saying no", "Padding estimates instead of explaining them", "Not offering alternatives"]$j$, $j$["What if the stakeholder insisted on the original date?", "How do you estimate work you have never done?"]$j$),
  ('71000000-0000-4000-8000-000000000012', $g$Situation: "A review on my refactor grew to thirty comments, several of them about style, and tone was sharpening on both sides."
Task: "I wanted to resolve it without either of us disengaging."
Action: "I suggested a fifteen-minute call, separated the comments into must-fix, preference, and out-of-scope, and proposed we document style rules in a linter instead of in reviews."
Result: "The pull request merged the same day, and we added three lint rules that removed that class of comment for everyone."$g$, $j$["Describing the other reviewer as difficult", "Refusing to change anything", "Not addressing the underlying cause"]$j$, $j$["What makes a good code review?", "How do you review a senior engineer's code?"]$j$),
  ('71000000-0000-4000-8000-000000000013', $g$Situation: "I deployed a config change that pointed our mobile app at the staging payment gateway for about twenty minutes."
Task: "Real users could not pay during lunch."
Action: "I noticed the spike in failures, reverted immediately, told my lead and support within five minutes, and wrote a short incident note the same day."
Result: "We added an environment check in the build pipeline so a mismatched gateway URL fails the build. It has not recurred."$g$, $j$["Choosing a trivial mistake", "Explaining why it was not really your fault", "No prevention step"]$j$, $j$["How did your team react?", "What is your process before deploying now?"]$j$),
  ('71000000-0000-4000-8000-000000000014', $g$Situation: "Orders stopped syncing from POS terminals to the server for a subset of sites after a release."
Task: "I was the on-call frontend engineer and the terminal app was mine."
Action: "I confirmed the scope from logs, communicated a status update every thirty minutes, found that a date parsing change broke a timezone edge case, and shipped a hotfix with a test for that case."
Result: "Sync recovered within ninety minutes with no lost orders thanks to the local queue. The postmortem added timezone fixtures to our test data."$g$, $j$["Only describing the technical bug", "No mention of communication", "Blaming another engineer"]$j$, $j$["How do you prioritise during an incident?", "What would you change about your monitoring?"]$j$),
  ('71000000-0000-4000-8000-000000000015', $g$Situation: "I estimated a vendor integration at two weeks; the vendor's documentation turned out to be wrong in several places."
Task: "The deadline was tied to a customer go-live."
Action: "At the end of week one I raised the risk with evidence from the failed calls, proposed a reduced scope for go-live, and set up direct contact with the vendor's engineer."
Result: "Go-live happened with the reduced scope four days late, the full integration followed a week after, and I now add a discovery spike to any third-party estimate."$g$, $j$["Pretending you have never missed a deadline", "Raising it only at the deadline", "No change to how you estimate"]$j$, $j$["How do you communicate a slip to a customer?", "What was the reaction from your manager?"]$j$),
  ('71000000-0000-4000-8000-000000000016', $g$Situation: "Nobody owned our release notes, so clients found out about changes from bugs."
Task: "It was not my job, but support was drowning in avoidable tickets."
Action: "I proposed a lightweight template, wrote the first three releases myself, and asked each engineer to add one line per feature in the pull request."
Result: "Support tickets about 'unexpected changes' fell noticeably and the practice stuck after I stopped writing them."$g$, $j$["Choosing something that stepped on a colleague's role", "Not informing the actual owner", "No outcome"]$j$, $j$["How do you avoid taking on too much?", "What happens when nobody wants to own something?"]$j$),
  ('71000000-0000-4000-8000-000000000017', $g$Situation: "We decided to move the desktop terminal from a web wrapper to Electron with two months to a client deadline."
Task: "I had never built an Electron app."
Action: "I spent two days on the official docs and a throwaway spike, listed the risky areas such as auto-update and printing, and pair-programmed those with a contractor who had done it before."
Result: "We shipped on time, and I wrote an internal guide that the next engineer used to onboard in a week."$g$, $j$["Just saying you love learning", "No validation step", "Not sharing the knowledge"]$j$, $j$["How do you decide when to stop learning and start building?", "What did you get wrong at first?"]$j$),
  ('71000000-0000-4000-8000-000000000018', $g$Weakness: "I tend to over-engineer early; I build abstractions before there are three uses."
Example: "A generic table component I built took two extra weeks and only one screen used it."
Steps: "I now write the concrete version first and refactor when the second use appears, and I ask a reviewer to flag speculative generality."
Evidence: "My last two features shipped faster with fewer abstractions and no rework."$g$, $j$["'I work too hard' style non-answers", "A weakness core to the role, like communication for a lead", "No improvement plan"]$j$, $j$["How would your teammates describe your weakness?", "What is a strength that sometimes becomes a weakness?"]$j$),
  ('71000000-0000-4000-8000-000000000019', $g$Sources: "I follow the release notes for the frameworks we use, a couple of engineering blogs, and one newsletter."
Judgement: "I only adopt something after trying it in a side project and checking it solves a problem we actually have."
Recent: "I recently learned the View Transitions API and used it to replace a fragile page-transition library."
Sharing: "I run a short monthly demo where anyone shows something they learned."$g$, $j$["Listing ten newsletters you do not read", "Chasing every new framework", "No example of applying something"]$j$, $j$["What recent trend do you think is overhyped?", "How do you convince a team to adopt something new?"]$j$),
  ('71000000-0000-4000-8000-000000000020', $g$Situation: "The ordering page took about six seconds to be interactive on mid-range phones, and drop-off was high."
Task: "I owned the page and targeted under two and a half seconds."
Action: "I profiled with Lighthouse and the performance panel, found a three hundred kilobyte payment SDK loaded eagerly and a menu list rendering every item at once. I lazy-loaded the SDK on checkout and virtualised the list."
Result: "Time to interactive dropped to about two seconds, order completion rose, and I added a bundle-size budget to CI."$g$, $j$["Optimising without measuring", "Listing every optimisation you know", "No prevention of regressions"]$j$, $j$["How would you handle a regression six months later?", "What metric matters most for your users?"]$j$),
  ('71000000-0000-4000-8000-000000000021', $g$Situation: "Our menu builder was mouse-only; a client's staff member using a screen reader could not create items."
Task: "Accessibility was not on the roadmap and the sprint was full."
Action: "I recorded a five-minute video of the failure, mapped the fix to a small set of ARIA and keyboard changes, and proposed a two-day fix plus an accessibility checklist for new features."
Result: "The fix shipped, the client renewed, and the checklist is now part of our definition of done."$g$, $j$["Treating accessibility as a compliance box", "No evidence of the problem", "Not changing the process"]$j$, $j$["How do you test accessibility?", "What do you do when a designer's mockup is not accessible?"]$j$),
  ('71000000-0000-4000-8000-000000000022', $g$Situation: "I inherited a five-year-old admin dashboard with no tests and a global state object mutated from everywhere."
Task: "I had to add features while lowering the risk of breaking things."
Action: "I added characterisation tests around the flows I touched, introduced a feature flag system, and moved state into modules one screen at a time in small pull requests."
Result: "Over six months, bug reports on the dashboard fell and we never needed a rewrite."$g$, $j$["Demanding a rewrite", "Criticising the original authors", "No safety net before changes"]$j$, $j$["How do you convince a product manager to fund cleanup?", "How do you decide what not to refactor?"]$j$),
  ('71000000-0000-4000-8000-000000000023', $g$Situation: "We needed offline support in the terminal app and could choose between a full local database with sync or a simpler queue of pending actions."
Criteria: "Time to ship, team familiarity, and the actual offline duration, which was usually minutes, not hours."
Decision: "I chose the action queue, accepting that we would not support browsing historical orders offline."
Outcome: "It shipped in two weeks instead of an estimated eight, and in a year we have not needed the fuller solution. I would choose it again with the same data."$g$, $j$["Presenting the decision as obvious", "Not naming the cost accepted", "No reflection on whether it was right"]$j$, $j$["What would have made you choose the other option?", "How did you communicate the limitation to stakeholders?"]$j$),
  ('71000000-0000-4000-8000-000000000024', $g$Situation: "A graduate joined with strong JavaScript but no experience in our Angular codebase."
Task: "I was asked to get them shipping independently within a month."
Action: "I curated a sequence of tasks from a one-line fix to a small feature, paired for the first week, and switched to review-only feedback with an explanation for every comment."
Result: "They shipped a customer-facing feature in week three and later onboarded the next hire using the same task ladder."$g$, $j$["Describing lecturing rather than mentoring", "No adjustment when something did not work", "No measurable growth"]$j$, $j$["How do you mentor someone more experienced than you in some areas?", "What did you learn from mentoring?"]$j$);
