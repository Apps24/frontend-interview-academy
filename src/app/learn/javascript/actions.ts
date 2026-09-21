"use server";

import { revalidatePath } from "next/cache";

import { recordValue } from "@/lib/learning";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProgressActionResult = { ok: boolean; message: string; percent?: number; isCorrect?: boolean; rationale?: string };

function integerList(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item) || item < 0 || item > 20)) return null;
  return [...new Set(value as number[])].sort((a, b) => a - b);
}

function normalizeOutput(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
}

export async function submitQuizAnswer(lessonSlug: string, questionId: string, response: number[] | string): Promise<ProgressActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(questionId) || lessonSlug.length > 100) return { ok: false, message: "Choose a valid answer." };
  const supabase = await createClient();
  const [{ data: lesson }, { data: question }, { data: link }, { data: claimsData }] = await Promise.all([
    supabase.from("lessons").select("id, version").eq("slug", lessonSlug).maybeSingle(),
    supabase.from("questions").select("id, question_type, version").eq("id", questionId).maybeSingle(),
    supabase.from("lesson_questions").select("lesson_id").eq("question_id", questionId).maybeSingle(),
    supabase.auth.getClaims(),
  ]);
  if (!lesson || !question || link?.lesson_id !== lesson.id) return { ok: false, message: "This question does not belong to the lesson." };
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Sign in to grade and save quiz answers." };

  let admin;
  try { admin = createAdminClient(); }
  catch { return { ok: false, message: "Secure grading is temporarily unavailable." }; }
  const { data: key, error: keyError } = await admin.from("question_answer_keys").select("answer, rationale, misconceptions, version").eq("question_id", questionId).maybeSingle();
  if (keyError || !key || key.version !== question.version) return { ok: false, message: "This answer key is unavailable or out of date." };

  const answer = recordValue(key.answer);
  let isCorrect = false;
  let storedResponse: Record<string, unknown>;
  let misconception: string | undefined;
  if (question.question_type === "output") {
    if (typeof response !== "string" || response.length > 2000) return { ok: false, message: "Enter a valid output." };
    const expected = typeof answer.expected === "string" ? answer.expected : "";
    isCorrect = normalizeOutput(response) === normalizeOutput(expected);
    storedResponse = { output: response };
  } else {
    const selected = integerList(response);
    const correct = integerList(answer.correct);
    if (!selected || !correct) return { ok: false, message: "Choose a valid answer." };
    isCorrect = selected.length === correct.length && selected.every((item, index) => item === correct[index]);
    storedResponse = { selected };
    const misconceptions = recordValue(key.misconceptions);
    if (!isCorrect && selected.length === 1 && typeof misconceptions[String(selected[0])] === "string") misconception = misconceptions[String(selected[0])] as string;
  }

  const { error: attemptError } = await supabase.from("question_attempts").insert({ user_id: userId, question_id: question.id, question_version: question.version, response: storedResponse, is_correct: isCorrect, score: isCorrect ? 100 : 0 });
  if (attemptError) return { ok: false, isCorrect, message: "Your answer was graded, but the attempt could not be saved.", rationale: key.rationale };
  const { data: links } = await supabase.from("lesson_questions").select("question_id").eq("lesson_id", lesson.id);
  const questionIds = (links ?? []).map(({ question_id }) => question_id);
  const { data: attempts } = questionIds.length ? await supabase.from("question_attempts").select("question_id, is_correct").eq("user_id", userId).eq("is_correct", true).in("question_id", questionIds) : { data: [] };
  const correctCount = new Set((attempts ?? []).map(({ question_id: id }) => id)).size;
  const percent = questionIds.length ? Math.round(correctCount / questionIds.length * 100) : 0;
  const now = new Date().toISOString();
  const { data: existing } = await supabase.from("lesson_progress").select("started_at, completed_at").eq("user_id", userId).eq("lesson_id", lesson.id).maybeSingle();
  const { error: progressError } = await supabase.from("lesson_progress").upsert({ user_id: userId, lesson_id: lesson.id, lesson_version: lesson.version, status: percent === 100 ? "completed" : "in_progress", percent, last_position: `question:${question.id}`, started_at: existing?.started_at ?? now, completed_at: percent === 100 ? existing?.completed_at ?? now : null, updated_at: now }, { onConflict: "user_id,lesson_id" });
  if (progressError) return { ok: false, isCorrect, percent, message: "Your answer was saved, but lesson progress could not be updated.", rationale: key.rationale };
  revalidatePath("/account"); revalidatePath("/learn/javascript"); revalidatePath(`/learn/javascript/${lessonSlug}`);
  return { ok: true, isCorrect, percent, message: isCorrect ? (percent === 100 ? "Saved. Lesson completed." : "Correct answer saved.") : misconception ?? "Attempt saved. Review the explanation and try again.", rationale: key.rationale };
}
