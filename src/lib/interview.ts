export type InterviewTopic = {
  slug: string;
  title: string;
};

export type InterviewQuestionPreview = {
  id: string;
  slug: string;
  title: string;
  shortAnswer: string;
  difficulty: 1 | 2 | 3;
  isPremium: boolean;
  topic: InterviewTopic;
};

export const difficultyLabels = ["", "Foundation", "Intermediate", "Advanced"] as const;
