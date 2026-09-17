"use server";

import { revalidatePath } from "next/cache";

import { variablesLesson } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

export type ProgressActionResult = {
  ok: boolean;
  message: string;
  percent?: number;
  isCorrect?: boolean;
};

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub };
}

export async function submitQuizAnswer(selected: number): Promise<ProgressActionResult> {
  if (!Number.isInteger(selected) || selected < 0 || selected >= variablesLesson.question.options.length) {
    return { ok: false, message: "Choose a valid answer." };
  }

  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false, message: "Sign in to save this attempt." };

  const isCorrect = selected === variablesLesson.question.answer;
  const now = new Date().toISOString();
  const [{ error: attemptError }, { data: existing }] = await Promise.all([
    supabase.from("question_attempts").insert({
      user_id: userId,
      question_id: variablesLesson.question.id,
      question_version: variablesLesson.question.version,
      response: { selected },
      is_correct: isCorrect,
      score: isCorrect ? 100 : 0,
    }),
    supabase.from("lesson_progress").select("status, started_at, completed_at").eq("user_id", userId).eq("lesson_id", variablesLesson.id).maybeSingle(),
  ]);

  if (attemptError) return { ok: false, message: "We could not save this attempt. Please try again." };

  const wasCompleted = existing?.status === "completed";
  const percent = isCorrect || wasCompleted ? 100 : 70;
  const { error: progressError } = await supabase.from("lesson_progress").upsert({
    user_id: userId,
    lesson_id: variablesLesson.id,
    lesson_version: variablesLesson.version,
    status: isCorrect || wasCompleted ? "completed" : "in_progress",
    percent,
    last_position: "knowledge-check",
    started_at: existing?.started_at ?? now,
    completed_at: isCorrect ? now : existing?.completed_at ?? null,
    updated_at: now,
  }, { onConflict: "user_id,lesson_id" });

  if (progressError) return { ok: false, message: "The answer was saved, but progress could not be updated." };
  revalidatePath("/account");
  revalidatePath("/learn/javascript/variables-and-types");
  return { ok: true, message: isCorrect ? "Attempt saved. Lesson completed." : "Attempt saved. Review the explanation and try again.", percent, isCorrect };
}

export async function completeLesson(): Promise<ProgressActionResult> {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return { ok: false, message: "Sign in to save lesson completion." };

  const { count } = await supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("question_id", variablesLesson.question.id);
  if (!count) return { ok: false, message: "Answer the knowledge check before completing this lesson." };

  const now = new Date().toISOString();
  const { data: existing } = await supabase.from("lesson_progress").select("started_at").eq("user_id", userId).eq("lesson_id", variablesLesson.id).maybeSingle();
  const { error } = await supabase.from("lesson_progress").upsert({
    user_id: userId,
    lesson_id: variablesLesson.id,
    lesson_version: variablesLesson.version,
    status: "completed",
    percent: 100,
    last_position: "complete",
    started_at: existing?.started_at ?? now,
    completed_at: now,
    updated_at: now,
  }, { onConflict: "user_id,lesson_id" });

  if (error) return { ok: false, message: "We could not update completion. Please try again." };
  revalidatePath("/account");
  revalidatePath("/learn/javascript/variables-and-types");
  return { ok: true, message: "Lesson completed and synced to your account.", percent: 100 };
}
