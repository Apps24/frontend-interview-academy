export type DiagnosticTopic = "javascript" | "browser" | "html-accessibility" | "css";

export type DiagnosticQuestion = {
  id: string;
  topic: DiagnosticTopic;
  topicLabel: string;
  prompt: string;
  code?: string;
  options: string[];
  difficulty: 1 | 2 | 3;
};

export type DiagnosticTopicScore = {
  topic: DiagnosticTopic;
  label: string;
  correct: number;
  total: number;
  percentage: number;
};

export type DiagnosticBreakdown = {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
};

export type DiagnosticResult = {
  totalCorrect: number;
  totalQuestions: number;
  percentage: number;
  topicScores: DiagnosticTopicScore[];
  weakTopics: DiagnosticTopic[];
  breakdown: DiagnosticBreakdown[];
};
