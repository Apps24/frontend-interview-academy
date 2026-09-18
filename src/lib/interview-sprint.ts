export type SprintItem = {
  key: string;
  day: 1 | 2;
  time: string;
  duration: number;
  category: string;
  title: string;
  description: string;
  outcome: string;
};

export const sprintItems: SprintItem[] = [
  { key: "diagnostic", day: 1, time: "09:00", duration: 30, category: "ASSESS", title: "Frontend diagnostic", description: "Answer a focused baseline across JavaScript, browser behavior, HTML, and CSS.", outcome: "List the three weakest areas to revisit." },
  { key: "javascript-core", day: 1, time: "09:45", duration: 60, category: "LEARN", title: "JavaScript core recall", description: "Review values, equality, scope, closures, and common output questions.", outcome: "Explain five core concepts without notes." },
  { key: "html-accessibility", day: 1, time: "11:00", duration: 45, category: "RECALL", title: "HTML & accessibility", description: "Practice semantics, forms, keyboard navigation, focus, labels, and useful ARIA.", outcome: "Audit one form and state three fixes." },
  { key: "css-layout", day: 1, time: "12:00", duration: 60, category: "BUILD", title: "CSS layout lab", description: "Rebuild a responsive card layout using Grid, Flexbox, intrinsic sizing, and container constraints.", outcome: "Finish desktop and mobile layouts." },
  { key: "coding-round", day: 1, time: "14:00", duration: 90, category: "CODE", title: "Timed coding round", description: "Solve array transformation, object grouping, and DOM-state problems under a timer.", outcome: "Complete three solutions and review complexity." },
  { key: "async-browser", day: 2, time: "09:00", duration: 60, category: "LEARN", title: "Async JavaScript & browser", description: "Trace promises, event-loop ordering, fetch cancellation, storage, and rendering phases.", outcome: "Solve five async output questions." },
  { key: "framework-design", day: 2, time: "10:15", duration: 60, category: "EXPLAIN", title: "Framework architecture", description: "Explain state ownership, rendering, forms, data fetching, performance, and component boundaries.", outcome: "Deliver four two-minute architecture answers." },
  { key: "debugging", day: 2, time: "11:30", duration: 45, category: "DEBUG", title: "Debugging drill", description: "Diagnose one rendering bug, one network failure, and one stale-state problem.", outcome: "Write the evidence and root cause for each." },
  { key: "behavioral", day: 2, time: "13:00", duration: 45, category: "SPEAK", title: "Behavioral STAR stories", description: "Prepare concise stories for ownership, conflict, failure, learning, and delivery pressure.", outcome: "Record five answers under two minutes each." },
  { key: "mock-review", day: 2, time: "14:00", duration: 75, category: "MOCK", title: "Mock interview & final review", description: "Run a realistic technical round, score unclear answers, and make a final one-page recall sheet.", outcome: "Finish with a targeted last-hour checklist." },
];

export const sprintTotalMinutes = sprintItems.reduce((total, item) => total + item.duration, 0);
