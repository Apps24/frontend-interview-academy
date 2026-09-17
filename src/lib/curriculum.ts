export const tracks = [
  { slug: "html", mark: "</>", level: "FOUNDATION", title: "HTML & Accessibility", description: "Build semantic, accessible pages that work for people and search engines.", lessons: 18, duration: "4h 20m", progress: 0, href: "/learn/javascript/variables-and-types" },
  { slug: "css", mark: "#", level: "FOUNDATION", title: "CSS & Responsive UI", description: "Master layout, cascade, responsive design, and practical debugging.", lessons: 24, duration: "6h 10m", progress: 0, href: "/learn/javascript/variables-and-types" },
  { slug: "javascript", mark: "JS", level: "CORE TRACK", title: "Modern JavaScript", description: "From values and scope to async code, browser APIs, and performance.", lessons: 42, duration: "12h 40m", progress: 28, href: "/learn/javascript/variables-and-types" },
];

export const variablesLesson = {
  slug: "variables-and-types", track: "Modern JavaScript", module: "JavaScript foundations", order: 2, title: "Variables & data types",
  summary: "Understand how JavaScript stores values, how declarations differ, and what interviewers mean by primitive versus reference values.",
  objectives: ["Choose between const and let", "Recognize JavaScript's primitive values", "Explain value versus reference behavior"],
  question: { id: "js-vars-001", prompt: "What does this code print?", code: "const user = { name: 'Mira' };\nconst copy = user;\ncopy.name = 'Ari';\nconsole.log(user.name);", options: ["Mira", "Ari", "undefined", "It throws an error"], answer: 1, explanation: "Objects are assigned by sharing a reference to the same object. Changing copy.name changes the object that user also points to." },
};
