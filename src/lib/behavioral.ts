export type BehavioralCategory = {
  slug: string;
  title: string;
  description?: string;
};

export type BehavioralQuestionPreview = {
  id: string;
  slug: string;
  title: string;
  whyAsked: string;
  difficulty: 1 | 2 | 3;
  isPremium: boolean;
  category: BehavioralCategory;
};

export type StarField = "situation" | "task" | "action" | "result";

export type StarDraft = Record<StarField, string> & { status: "draft" | "ready" };

export const emptyStarDraft: StarDraft = { situation: "", task: "", action: "", result: "", status: "draft" };

export const starFieldLimits: Record<StarField, number> = { situation: 2000, task: 2000, action: 3000, result: 2000 };

export const starFields: { key: StarField; label: string; hint: string; placeholder: string; targetShare: string }[] = [
  { key: "situation", label: "Situation", hint: "Set the scene in two sentences: the product, the team, the constraint.", placeholder: "At my last company our ordering page was slow on mobile and…", targetShare: "~15%" },
  { key: "task", label: "Task", hint: "What you specifically were responsible for, and why it mattered.", placeholder: "I owned the page and was asked to…", targetShare: "~10%" },
  { key: "action", label: "Action", hint: "The steps you took. Use \"I\", name the decisions, and skip the technologies list.", placeholder: "First I measured…, then I…, and I chose to… because…", targetShare: "~60%" },
  { key: "result", label: "Result", hint: "A measurable outcome plus one sentence on what you learned or would change.", placeholder: "Load time dropped from six seconds to two, and…", targetShare: "~15%" },
];

export const behavioralDifficultyLabels = ["", "Common", "Probing", "Senior"] as const;

const wordsPerMinute = 130;

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function starWordCount(draft: Pick<StarDraft, StarField>) {
  return starFields.reduce((sum, { key }) => sum + countWords(draft[key]), 0);
}

export function speakingSeconds(words: number) {
  return Math.round((words / wordsPerMinute) * 60);
}

export function formatSpeakingTime(words: number) {
  const seconds = speakingSeconds(words);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export function starCompleteness(draft: Pick<StarDraft, StarField>) {
  return starFields.filter(({ key }) => countWords(draft[key]) >= 8).length;
}

export type StarFeedback = { tone: "good" | "warn"; message: string };

export function reviewStarDraft(draft: Pick<StarDraft, StarField>): StarFeedback[] {
  const feedback: StarFeedback[] = [];
  const words = starWordCount(draft);
  const actionWords = countWords(draft.action);
  const actionText = draft.action.toLowerCase();
  const resultText = draft.result;

  if (words === 0) return [{ tone: "warn", message: "Start with the Situation. One or two sentences are enough." }];
  if (words < 90) feedback.push({ tone: "warn", message: "Under about 90 words this will sound thin when spoken. Add the decisions you made and why." });
  else if (words > 320) feedback.push({ tone: "warn", message: "Over about 320 words runs past two minutes. Cut background from the Situation first." });
  else feedback.push({ tone: "good", message: `About ${formatSpeakingTime(words)} spoken, which fits a typical answer window.` });

  if (words > 0 && actionWords / Math.max(words, 1) < 0.4) feedback.push({ tone: "warn", message: "The Action section should carry most of the answer. Interviewers grade what you did, not the backdrop." });
  else if (actionWords > 0) feedback.push({ tone: "good", message: "Action carries the answer, which is the right balance." });

  const weCount = (actionText.match(/\bwe\b/g) ?? []).length;
  const iCount = (actionText.match(/\bi\b/g) ?? []).length;
  if (actionWords > 20 && weCount > iCount) feedback.push({ tone: "warn", message: "Action uses \"we\" more than \"I\". Make your personal contribution explicit." });

  if (countWords(resultText) > 0 && !/\d|percent|%|half|double|zero|faster|dropped|reduced|increased|rose|fell/i.test(resultText)) feedback.push({ tone: "warn", message: "The Result has no measurable outcome. Add a number, a before/after, or a concrete change that stuck." });
  else if (countWords(resultText) > 0) feedback.push({ tone: "good", message: "Result includes a concrete outcome." });

  return feedback;
}
