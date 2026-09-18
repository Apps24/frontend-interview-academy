"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function setInterviewBookmark(questionId: string, bookmarked: boolean) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return { ok: false, message: "Sign in to save questions." };

  const { data: question } = await supabase
    .from("interview_questions")
    .select("id")
    .eq("id", questionId)
    .maybeSingle();

  if (!question) return { ok: false, message: "This question is unavailable." };

  const query = bookmarked
    ? supabase.from("interview_bookmarks").upsert({ user_id: userId, question_id: questionId })
    : supabase.from("interview_bookmarks").delete().eq("user_id", userId).eq("question_id", questionId);
  const { error } = await query;

  if (error) return { ok: false, message: "Could not update your saved questions." };

  revalidatePath("/interview");
  revalidatePath("/account");
  return { ok: true, message: bookmarked ? "Question saved." : "Question removed." };
}
