export type LearningModule = {
  id: string;
  title: string;
  description: string;
  position: number;
};

export type LearningLesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: number;
  estimated_minutes: number;
  position: number;
  version: number;
  access_level: "free" | "pro";
  objectives: unknown;
  prerequisites: unknown;
};

export type LessonContentBlock = {
  id: string;
  position: number;
  block_type: "explanation" | "example" | "common_mistakes" | "interview_relevance" | "practice_link" | "summary";
  title: string;
  body: string;
  code: string | null;
  code_language: string | null;
  meta: unknown;
};

export type LessonQuestion = {
  id: string;
  question_type: "single_choice" | "multi_choice" | "output" | "debug" | "written";
  prompt: string;
  payload: unknown;
  explanation: string;
  version: number;
};

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function difficultyLabel(value: number) {
  return ["Beginner", "Intermediate", "Advanced"][value - 1] ?? "Beginner";
}

export function orderLessons(modules: LearningModule[], lessons: LearningLesson[]) {
  const modulePosition = new Map(modules.map((module) => [module.id, module.position]));
  return [...lessons].sort((a, b) => (modulePosition.get(a.module_id) ?? 0) - (modulePosition.get(b.module_id) ?? 0) || a.position - b.position);
}
