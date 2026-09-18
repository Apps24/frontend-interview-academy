export const focusTopicOptions = [
  { slug: "javascript", label: "JavaScript" },
  { slug: "browser", label: "Browser & Web" },
  { slug: "html-accessibility", label: "HTML & Accessibility" },
  { slug: "css", label: "CSS" },
  { slug: "coding", label: "Coding problems" },
  { slug: "behavioral", label: "Behavioral" },
] as const;

export type FocusTopic = (typeof focusTopicOptions)[number]["slug"];
export type PlanDuration = 1 | 2 | 4 | 8;

export type LastMinuteConfig = {
  durationHours: PlanDuration;
  targetRole: string;
  focusTopics: FocusTopic[];
  interviewAt: string | null;
};

export type LastMinuteTask = {
  key: string;
  title: string;
  category: string;
  minutes: number;
  description: string;
  outcome: string;
  href?: string;
};

const topicTasks: Record<FocusTopic, LastMinuteTask[]> = {
  javascript: [
    { key: "js-recall", title: "JavaScript rapid recall", category: "RECALL", minutes: 20, description: "Explain scope, closures, equality, promises, and event-loop order without notes.", outcome: "Five answers under 90 seconds each", href: "/interview?topic=javascript" },
    { key: "js-output", title: "JavaScript output drill", category: "TRACE", minutes: 25, description: "Trace coercion, closure, and async snippets one line at a time.", outcome: "Write the reason before the output", href: "/learn/javascript" },
    { key: "js-deep", title: "Advanced JavaScript follow-ups", category: "SPEAK", minutes: 20, description: "Practice the second-level questions interviewers ask after a correct definition.", outcome: "Connect each concept to production code", href: "/interview?topic=javascript" },
  ],
  browser: [
    { key: "browser-recall", title: "Browser fundamentals recall", category: "RECALL", minutes: 20, description: "Review rendering, CORS, storage, networking, and performance terminology.", outcome: "Draw one request-to-paint sequence", href: "/interview?topic=browser-web" },
    { key: "browser-debug", title: "Browser debugging scenarios", category: "DEBUG", minutes: 25, description: "Talk through a slow page, failed request, and layout-thrashing investigation.", outcome: "State evidence, tool, cause, and fix", href: "/interview?topic=browser-web" },
    { key: "browser-performance", title: "Performance answer practice", category: "SPEAK", minutes: 20, description: "Explain how you would measure and improve a slow frontend rather than guessing.", outcome: "Deliver one structured two-minute answer" },
  ],
  "html-accessibility": [
    { key: "html-recall", title: "HTML and accessibility recall", category: "RECALL", minutes: 20, description: "Review semantics, forms, keyboard flow, focus, labels, and practical ARIA.", outcome: "Name five native-first fixes", href: "/interview?topic=html-accessibility" },
    { key: "html-audit", title: "Accessibility mini-audit", category: "AUDIT", minutes: 25, description: "Inspect one form or dialog and list issues affecting keyboard and screen-reader users.", outcome: "Produce a prioritized fix list" },
    { key: "html-speak", title: "Accessible component explanation", category: "SPEAK", minutes: 15, description: "Explain how you would build and test an accessible modal or form.", outcome: "Cover semantics, focus, keyboard, and errors" },
  ],
  css: [
    { key: "css-recall", title: "CSS rapid recall", category: "RECALL", minutes: 20, description: "Review cascade, specificity, formatting contexts, Grid, Flexbox, and stacking.", outcome: "Answer six comparison questions", href: "/interview?topic=css" },
    { key: "css-layout", title: "Responsive layout drill", category: "BUILD", minutes: 30, description: "Sketch a responsive page using intrinsic sizing before adding breakpoints.", outcome: "Explain why each layout primitive fits" },
    { key: "css-debug", title: "CSS debugging scenarios", category: "DEBUG", minutes: 20, description: "Diagnose overflow, failed z-index, and unexpected shrinking aloud.", outcome: "Identify the containing context first" },
  ],
  coding: [
    { key: "coding-warmup", title: "Timed coding warm-up", category: "CODE", minutes: 25, description: "Solve one foundation problem while narrating edge cases and complexity.", outcome: "Finish, test, then simplify", href: "/practice" },
    { key: "coding-medium", title: "Intermediate coding round", category: "CODE", minutes: 35, description: "Solve one collection or recursion problem under a realistic timer.", outcome: "State assumptions before typing", href: "/practice" },
    { key: "coding-review", title: "Review a prior solution", category: "REVIEW", minutes: 20, description: "Improve naming, edge cases, and complexity in an existing solution.", outcome: "Explain the tradeoffs of the revision", href: "/practice" },
  ],
  behavioral: [
    { key: "behavioral-star", title: "Build three STAR stories", category: "STORY", minutes: 25, description: "Prepare ownership, conflict, and failure stories with specific actions and results.", outcome: "Three stories under two minutes each" },
    { key: "behavioral-record", title: "Record behavioral answers", category: "SPEAK", minutes: 20, description: "Record answers, remove vague language, and lead with the result.", outcome: "One improved second take" },
    { key: "behavioral-values", title: "Motivation and role fit", category: "ALIGN", minutes: 15, description: "Connect your experience, next step, and the target role without generic claims.", outcome: "A concise why-you, why-now answer" },
  ],
};

const setupTask: LastMinuteTask = { key: "plan-setup", title: "Set the finish line", category: "PLAN", minutes: 10, description: "Write the role, likely interview format, and three outcomes you must demonstrate.", outcome: "One visible priority list" };
const finalTask: LastMinuteTask = { key: "final-reset", title: "Close notes and reset", category: "FINAL", minutes: 10, description: "Review only your one-page recall sheet, prepare the environment, hydrate, and stop cramming.", outcome: "Enter the interview calm and specific" };
const commonTasks: LastMinuteTask[] = [
  { key: "project-story", title: "Prepare your strongest project story", category: "SPEAK", minutes: 20, description: "Frame the problem, your decisions, tradeoffs, measurable result, and what you learned.", outcome: "A clear three-minute technical story" },
  { key: "frontend-design", title: "Frontend architecture walkthrough", category: "DESIGN", minutes: 30, description: "Design a data-heavy page and discuss state, boundaries, loading, errors, accessibility, and performance.", outcome: "A structured whiteboard answer" },
  { key: "mock-round", title: "Mixed mock interview", category: "MOCK", minutes: 40, description: "Alternate technical recall, coding, project discussion, and one behavioral question.", outcome: "List only the gaps that still matter" },
  { key: "company-questions", title: "Prepare interviewer questions", category: "RESEARCH", minutes: 15, description: "Write questions about product decisions, engineering quality, ownership, and the first 90 days.", outcome: "Four non-generic questions" },
  { key: "recall-sheet", title: "Create a one-page recall sheet", category: "SYNTHESIZE", minutes: 20, description: "Compress weak concepts, project metrics, STAR prompts, and questions into one page.", outcome: "One page; no new material afterward" },
  { key: "component-architecture", title: "Component architecture review", category: "DESIGN", minutes: 35, description: "Design component boundaries, state ownership, server/client data flow, and error states for a feature-rich screen.", outcome: "Defend the boundaries and tradeoffs" },
  { key: "testing-strategy", title: "Frontend testing strategy", category: "QUALITY", minutes: 25, description: "Explain what to unit test, integrate, and cover end-to-end for one important user journey.", outcome: "Prioritize confidence over test count" },
  { key: "performance-lab", title: "Performance investigation drill", category: "MEASURE", minutes: 30, description: "Use a slow-page scenario to discuss profiling, network evidence, rendering cost, and validation after a fix.", outcome: "A measurement-first answer" },
  { key: "resume-walkthrough", title: "Resume and transition walkthrough", category: "SPEAK", minutes: 20, description: "Rehearse your career summary, current impact, reason for change, and why this role is the logical next step.", outcome: "A confident 90-second introduction" },
  { key: "code-review", title: "Code-review simulation", category: "REVIEW", minutes: 25, description: "Review a small frontend implementation for correctness, accessibility, maintainability, and performance.", outcome: "Separate blockers from suggestions" },
  { key: "data-state", title: "Data fetching and state decisions", category: "DESIGN", minutes: 30, description: "Compare server state, client state, URL state, caching, optimistic updates, and failure recovery.", outcome: "Choose tools from requirements" },
  { key: "full-coding-round", title: "Full timed coding round", category: "CODE", minutes: 45, description: "Solve one medium problem from clarification through tests while narrating decisions.", outcome: "Complete the solution and retrospective", href: "/practice" },
  { key: "strategic-break", title: "Strategic break", category: "RESET", minutes: 15, description: "Leave the screen, hydrate, move, and return without opening new material.", outcome: "Recover attention before the final blocks" },
  { key: "framework-deep-dive", title: "Framework deep dive", category: "EXPLAIN", minutes: 25, description: "Explain rendering, state updates, component lifecycle, and one recent architecture decision in your primary framework.", outcome: "Connect framework behavior to user impact" },
  { key: "mock-retrospective", title: "Mock-round retrospective", category: "REVIEW", minutes: 20, description: "Re-answer the weakest mock responses with a clearer structure and stronger evidence.", outcome: "Improve only the highest-impact gaps" },
];

export function buildLastMinutePlan(config: LastMinuteConfig): LastMinuteTask[] {
  const budget = config.durationHours * 60;
  const focusMinutes = Math.max(10, Math.min(20, Math.floor((budget - setupTask.minutes - finalTask.minutes) / config.focusTopics.length)));
  const firstTopicRound = config.focusTopics.map((topic) => ({ ...topicTasks[topic][0], minutes: focusMinutes }));
  const laterTopicRounds = [1, 2].flatMap((round) => config.focusTopics.map((topic) => topicTasks[topic][round]));
  const roleTask = { ...commonTasks[0], description: `Prepare the project story that best proves you can succeed as a ${config.targetRole}.` };
  const candidates = [roleTask, ...laterTopicRounds, ...commonTasks.slice(1)];
  const plan = [setupTask, ...firstTopicRound];
  let used = setupTask.minutes + finalTask.minutes + firstTopicRound.reduce((sum, task) => sum + task.minutes, 0);
  for (const task of candidates) {
    if (used + task.minutes <= budget) {
      plan.push(task);
      used += task.minutes;
    }
  }
  plan.push(finalTask);
  return plan;
}

export const lastMinuteTaskKeys = new Set([
  "plan-setup", "final-reset", ...commonTasks.map(({ key }) => key), ...Object.values(topicTasks).flat().map(({ key }) => key),
]);
