import "server-only";

import type { DiagnosticQuestion, DiagnosticResult, DiagnosticTopic } from "@/lib/diagnostic-types";

type GradedQuestion = DiagnosticQuestion & { answer: number; explanation: string };

export const diagnosticCatalog: GradedQuestion[] = [
  { id: "diag-js-01", topic: "javascript", topicLabel: "JavaScript", difficulty: 1, prompt: "What does this closure-backed counter print?", code: "function counter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = counter();\nconsole.log(next(), next());", options: ["0 1", "1 1", "1 2", "2 2"], answer: 2, explanation: "Both calls close over the same n binding. Each call increments that binding, producing 1 and then 2." },
  { id: "diag-js-02", topic: "javascript", topicLabel: "JavaScript", difficulty: 2, prompt: "Which value does this expression produce?", code: "const retries = 0;\nconst value = retries ?? 3;", options: ["0", "3", "null", "undefined"], answer: 0, explanation: "Nullish coalescing falls back only for null or undefined. Zero is preserved as a valid value." },
  { id: "diag-js-03", topic: "javascript", topicLabel: "JavaScript", difficulty: 2, prompt: "In what order are the values logged?", code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", options: ["A, B, C, D", "A, D, C, B", "A, C, D, B", "C, A, D, B"], answer: 1, explanation: "Synchronous work logs A and D. Promise reactions are microtasks and run before the timer task, so C precedes B." },
  { id: "diag-js-04", topic: "javascript", topicLabel: "JavaScript", difficulty: 1, prompt: "What does const prevent for an object?", options: ["Changing any property", "Adding properties", "Reassigning the binding", "Passing it to a function"], answer: 2, explanation: "const prevents reassignment of the binding. It does not make the referenced object immutable." },
  { id: "diag-browser-01", topic: "browser", topicLabel: "Browser & Web", difficulty: 2, prompt: "When does a browser generally send a CORS preflight request?", options: ["Before every GET request", "Before a non-simple cross-origin request", "After a response is cached", "Only when cookies are disabled"], answer: 1, explanation: "The browser uses an OPTIONS preflight before cross-origin requests that do not meet the simple-request rules." },
  { id: "diag-browser-02", topic: "browser", topicLabel: "Browser & Web", difficulty: 2, prompt: "Which sequence best describes the core rendering pipeline?", options: ["Paint → DOM → layout → CSSOM", "DOM/CSSOM → render tree → layout → paint", "Layout → network → DOM → paint", "CSSOM → paint → DOM → layout"], answer: 1, explanation: "The browser constructs DOM and CSSOM, derives a render tree, calculates layout, and then paints and composites." },
  { id: "diag-browser-03", topic: "browser", topicLabel: "Browser & Web", difficulty: 2, prompt: "Where is a sensitive session identifier usually safest in a browser application?", options: ["localStorage", "A JavaScript global", "A Secure, HttpOnly, SameSite cookie", "A query-string parameter"], answer: 2, explanation: "A properly configured HttpOnly cookie reduces script access, while Secure and SameSite add transport and cross-site protections." },
  { id: "diag-html-01", topic: "html-accessibility", topicLabel: "HTML & Accessibility", difficulty: 1, prompt: "What is the best element for an action that submits a form?", options: ["A div with an onClick handler", "A span with role=button", "A button with type=submit", "An anchor without href"], answer: 2, explanation: "A native submit button supplies semantics, keyboard behavior, focus support, and form integration without reimplementation." },
  { id: "diag-html-02", topic: "html-accessibility", topicLabel: "HTML & Accessibility", difficulty: 2, prompt: "How should visible error text be connected to an invalid input?", options: ["Use color alone", "Put it only in the placeholder", "Reference its id with aria-describedby", "Add role=button to the input"], answer: 2, explanation: "aria-describedby lets assistive technology include the error text in the input's accessible description. aria-invalid can expose the invalid state too." },
  { id: "diag-css-01", topic: "css", topicLabel: "CSS", difficulty: 1, prompt: "When is CSS Grid generally the stronger starting point?", options: ["A two-dimensional row-and-column layout", "A single inline icon", "Changing text color", "Attaching a click handler"], answer: 0, explanation: "Grid is designed for two-dimensional tracks. Flexbox is usually more natural for distribution along one primary axis." },
  { id: "diag-css-02", topic: "css", topicLabel: "CSS", difficulty: 2, prompt: "Why can a very large z-index still fail to place an element above another element?", options: ["z-index accepts only single digits", "The element is trapped in a lower stacking context", "Grid disables z-index", "The browser ignores positioned elements"], answer: 1, explanation: "A descendant cannot escape its stacking context. The ancestor contexts themselves must be compared before descendant z-index values matter." },
  { id: "diag-css-03", topic: "css", topicLabel: "CSS", difficulty: 2, prompt: "After origin, importance, and cascade layer, what does the cascade compare next?", options: ["File size", "Selector specificity", "Property alphabetic order", "Network priority"], answer: 1, explanation: "Specificity is one stage of the cascade, followed by scoping proximity and source order when earlier stages tie." },
];

export const publicDiagnosticQuestions: DiagnosticQuestion[] = diagnosticCatalog.map((question) => ({ id: question.id, topic: question.topic, topicLabel: question.topicLabel, prompt: question.prompt, code: question.code, options: question.options, difficulty: question.difficulty }));

export function gradeDiagnostic(selections: Record<string, number>): DiagnosticResult {
  const breakdown = diagnosticCatalog.map((question) => {
    const selectedIndex = Number.isInteger(selections[question.id]) ? selections[question.id] : -1;
    return { questionId: question.id, selectedIndex, correctIndex: question.answer, correct: selectedIndex === question.answer, explanation: question.explanation };
  });
  const topics = [...new Set(diagnosticCatalog.map(({ topic }) => topic))];
  const topicScores = topics.map((topic) => {
    const topicQuestions = diagnosticCatalog.filter((question) => question.topic === topic);
    const correct = topicQuestions.filter((question) => selections[question.id] === question.answer).length;
    return { topic, label: topicQuestions[0].topicLabel, correct, total: topicQuestions.length, percentage: Math.round(correct / topicQuestions.length * 100) };
  });
  const totalCorrect = breakdown.filter(({ correct }) => correct).length;
  const weakTopics = topicScores.filter(({ percentage }) => percentage < 70).sort((a, b) => a.percentage - b.percentage).slice(0, 3).map(({ topic }) => topic as DiagnosticTopic);
  return { totalCorrect, totalQuestions: diagnosticCatalog.length, percentage: Math.round(totalCorrect / diagnosticCatalog.length * 100), topicScores, weakTopics, breakdown };
}
