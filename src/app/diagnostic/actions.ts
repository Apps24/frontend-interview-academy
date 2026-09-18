"use server";

import { revalidatePath } from "next/cache";

import { diagnosticCatalog, gradeDiagnostic } from "@/lib/diagnostic";
import { createClient } from "@/lib/supabase/server";

export async function submitDiagnostic(selections: Record<string, number>) {
  if (!selections || typeof selections !== "object" || Object.keys(selections).length > diagnosticCatalog.length) return { ok: false as const, message: "The submitted assessment is invalid." };
  for (const question of diagnosticCatalog) {
    const selected = selections[question.id];
    if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length) return { ok: false as const, message: "Answer every question before submitting." };
  }
  const result = gradeDiagnostic(selections);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  let saved = false;
  if (userId) {
    const { error } = await supabase.from("diagnostic_attempts").insert({
      user_id: userId,
      total_correct: result.totalCorrect,
      total_questions: result.totalQuestions,
      answers: result.breakdown.map(({ questionId, selectedIndex, correct }) => ({ question_id: questionId, selected_index: selectedIndex, correct })),
      topic_scores: Object.fromEntries(result.topicScores.map(({ topic, correct, total, percentage }) => [topic, { correct, total, percentage }])),
      weak_topics: result.weakTopics,
    });
    saved = !error;
    if (saved) revalidatePath("/account");
  }
  return { ok: true as const, result, saved };
}
