export type PracticeTest = {
  label: string;
  expression: string;
  expected: unknown;
};

export type PracticeProblemPreview = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  topic: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  isPremium: boolean;
  progress: "not_started" | "started" | "solved";
};

export const practiceDifficulty = ["", "Foundation", "Intermediate", "Advanced"] as const;
