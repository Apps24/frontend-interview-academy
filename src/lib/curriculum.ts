export type LessonSection = {
  title: string;
  body: string;
  code?: string;
  interviewNote?: string;
};

export type LessonQuestion = {
  id: string;
  slug: string;
  version: number;
  prompt: string;
  code: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type JavaScriptLesson = {
  id: string;
  slug: string;
  version: number;
  track: string;
  module: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate";
  objectives: string[];
  sections: LessonSection[];
  question: LessonQuestion;
};

export const tracks = [
  { slug: "html", mark: "</>", level: "UP NEXT", title: "HTML & Accessibility", description: "Build semantic, accessible pages that work for people and search engines.", lessons: 18, duration: "4h 20m", progress: 0, href: "/#learn" },
  { slug: "css", mark: "#", level: "UP NEXT", title: "CSS & Responsive UI", description: "Master layout, cascade, responsive design, and practical debugging.", lessons: 24, duration: "6h 10m", progress: 0, href: "/#learn" },
  { slug: "javascript", mark: "JS", level: "LIVE TRACK", title: "Modern JavaScript", description: "From values and scope to async code, browser APIs, and performance.", lessons: 6, duration: "2h 25m", progress: 0, href: "/learn/javascript" },
];

export const javascriptLessons: JavaScriptLesson[] = [
  {
    id: "10000000-0000-4000-8000-000000000005", slug: "values-and-expressions", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 1, title: "Values & expressions", estimatedMinutes: 12, difficulty: "Beginner",
    summary: "Read JavaScript as a sequence of expressions that produce values and statements that direct execution.",
    objectives: ["Recognize expressions", "Apply precedence", "Read evaluation order"],
    sections: [
      { title: "Expressions produce values", body: "A literal, function call, property lookup, or operator expression evaluates to a value. Statements such as if and for control when expressions run.", code: "const subtotal = 20 + 5;\nconst label = subtotal > 20 ? 'large' : 'small';" },
      { title: "Precedence controls grouping", body: "Multiplication is evaluated before addition. Parentheses are still valuable when they make intent obvious to the next developer.", code: "const total = 2 + 3 * 4;      // 14\nconst grouped = (2 + 3) * 4;  // 20", interviewNote: "When explaining output, state the grouping first, then evaluate one step at a time." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000006", slug: "js-expressions-001", version: 1, prompt: "What does this code print?", code: "const result = 2 + 3 * 4;\nconsole.log(result);", options: ["20", "14", "24", "It throws an error"], answer: 1, explanation: "Multiplication has higher precedence than addition, so 3 * 4 is evaluated before adding 2." },
  },
  {
    id: "10000000-0000-4000-8000-000000000003", slug: "variables-and-types", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 2, title: "Variables & data types", estimatedMinutes: 12, difficulty: "Beginner",
    summary: "Understand how JavaScript stores values, how declarations differ, and what interviewers mean by primitive versus reference values.",
    objectives: ["Choose between const and let", "Recognize primitive values", "Explain shared references"],
    sections: [
      { title: "Declare intent, not just variables", body: "Use const when the binding should not be reassigned. Use let when the binding must point to a different value later. Avoid var in modern application code because its function scope and hoisting behavior are easier to misuse.", code: "const course = 'JavaScript';\nlet completedLessons = 3;\ncompletedLessons += 1;" },
      { title: "Primitive values and references", body: "Primitive values are copied as values. Objects, arrays, and functions are objects; assigning them copies a reference to the same underlying object.", interviewNote: "const does not make an object immutable. It prevents reassignment of the binding; properties can still change." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000004", slug: "js-vars-001", version: 1, prompt: "What does this code print?", code: "const user = { name: 'Mira' };\nconst copy = user;\ncopy.name = 'Ari';\nconsole.log(user.name);", options: ["Mira", "Ari", "undefined", "It throws an error"], answer: 1, explanation: "Objects are assigned by sharing a reference to the same object. Changing copy.name changes the object that user also points to." },
  },
  {
    id: "10000000-0000-4000-8000-000000000007", slug: "type-conversion", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 3, title: "Type conversion", estimatedMinutes: 15, difficulty: "Beginner",
    summary: "Predict explicit and implicit conversions without relying on memorized tricks.",
    objectives: ["Convert values explicitly", "Apply truthiness", "Spot coercion risks"],
    sections: [
      { title: "Prefer visible conversion", body: "Number, String, and Boolean make conversion intent readable. Validate converted numbers because Number can return NaN without throwing.", code: "const quantity = Number(input);\nif (Number.isNaN(quantity)) {\n  throw new Error('Quantity must be numeric');\n}" },
      { title: "Truthiness is not text meaning", body: "Every non-empty string is truthy, including strings such as false and 0. Empty strings, zero, NaN, null, undefined, and false are falsy.", interviewNote: "A strong answer separates conversion rules from business validation. A truthy string is not necessarily valid input." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000008", slug: "js-conversion-001", version: 1, prompt: "What does this code print?", code: "console.log(Number(''), Boolean('false'));", options: ["NaN false", "0 false", "0 true", "undefined true"], answer: 2, explanation: "Number converts an empty string to 0. The string 'false' is non-empty, so Boolean converts it to true." },
  },
  {
    id: "10000000-0000-4000-8000-000000000009", slug: "operators-and-equality", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 4, title: "Operators & equality", estimatedMinutes: 18, difficulty: "Beginner",
    summary: "Use strict equality by default and reason clearly about short-circuiting and nullish values.",
    objectives: ["Compare without coercion", "Use nullish coalescing", "Explain short-circuiting"],
    sections: [
      { title: "Strict equality preserves type", body: "Triple equality compares without converting operands. Loose equality follows a larger coercion algorithm, which makes local reasoning harder.", code: "0 === false; // false\n0 == false;  // true after coercion" },
      { title: "Choose the right fallback", body: "Logical OR falls back for every falsy value. Nullish coalescing falls back only for null or undefined, preserving valid values such as 0 and an empty string.", code: "const retries = configuredRetries ?? 3;", interviewNote: "Use == null only when you intentionally want one concise check for both null and undefined; otherwise prefer strict equality." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000010", slug: "js-equality-001", version: 1, prompt: "What does this code print?", code: "console.log(0 == false, 0 === false);", options: ["true true", "false false", "true false", "false true"], answer: 2, explanation: "Loose equality converts false to 0, making the first comparison true. Strict equality sees different types, so the second is false." },
  },
  {
    id: "10000000-0000-4000-8000-000000000011", slug: "scope-and-closures", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 5, title: "Scope & closures", estimatedMinutes: 24, difficulty: "Intermediate",
    summary: "Explain lexical scope and use closures for private, persistent function state.",
    objectives: ["Trace lexical scope", "Explain closure lifetime", "Avoid loop capture bugs"],
    sections: [
      { title: "Functions remember their environment", body: "A closure is a function together with access to the lexical environment where it was created. That environment can outlive the outer function call.", code: "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}" },
      { title: "State can be isolated", body: "Each call to makeCounter creates a separate environment. Closures power callbacks, memoization, factories, and encapsulation without global variables.", interviewNote: "Define a closure first, then give one practical use and one memory-lifetime tradeoff." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000012", slug: "js-closures-001", version: 1, prompt: "What does this code print?", code: "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counter = makeCounter();\nconsole.log(counter(), counter());", options: ["1 1", "1 2", "0 1", "2 2"], answer: 1, explanation: "The returned function closes over one count binding. The first call increments it to 1 and the second increments the same binding to 2." },
  },
  {
    id: "10000000-0000-4000-8000-000000000013", slug: "promises-and-async-flow", version: 1, track: "Modern JavaScript", module: "JavaScript foundations", order: 6, title: "Promises & async flow", estimatedMinutes: 30, difficulty: "Intermediate",
    summary: "Trace synchronous work, promise microtasks, and async/await without guessing output order.",
    objectives: ["Trace the event loop", "Compose promises", "Handle async failures"],
    sections: [
      { title: "Synchronous code finishes first", body: "Promise handlers are queued as microtasks. JavaScript finishes the current call stack before running those handlers, even when the promise is already resolved.", code: "console.log('A');\nPromise.resolve().then(() => console.log('B'));\nconsole.log('C');" },
      { title: "await pauses one async function", body: "await does not block the thread. It schedules the rest of the async function to continue after the awaited promise settles.", interviewNote: "For output questions, separate the current stack, microtask queue, and later task queue before listing the order." },
    ],
    question: { id: "10000000-0000-4000-8000-000000000014", slug: "js-async-001", version: 1, prompt: "In what order are the values logged?", code: "console.log('A');\nPromise.resolve().then(() => console.log('B'));\nconsole.log('C');", options: ["A, B, C", "B, A, C", "A, C, B", "C, B, A"], answer: 2, explanation: "A and C run on the current call stack. The promise handler runs afterward as a microtask, producing A, C, B." },
  },
];

export function getJavaScriptLesson(slug: string) {
  return javascriptLessons.find((lesson) => lesson.slug === slug);
}

export const variablesLesson = javascriptLessons[1];
