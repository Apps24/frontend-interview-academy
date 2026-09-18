"use server";

import { revalidatePath } from "next/cache";

import { starFieldLimits, starFields, type StarDraft } from "@/lib/behavioral";
import { createClient } from "@/lib/supabase/server";

export async function saveStarDraft(questionId: string, draft: StarDraft) {
  if (!questionId) return { ok: false, message: "This question is unavailable." };
  if (draft.status !== "draft" && draft.status !== "ready") return { ok: false, message: "Unknown draft status." };
  for (const { key } of starFields) {
    if (typeof draft[key] !== "string" || draft[key].length > starFieldLimits[key]) return { ok: false, message: `The ${key} section is too long.` };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Draft kept for this visit. Sign in to save it across devices." };

  const { data: question } = await supabase.from("behavioral_questions").select("id").eq("id", questionId).maybeSingle();
  if (!question) return { ok: false, message: "This question is unavailable." };

  const { error } = await supabase.from("star_drafts").upsert({
    user_id: userId,
    question_id: questionId,
    situation: draft.situation,
    task: draft.task,
    action: draft.action,
    result: draft.result,
    status: draft.status,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: "Could not save your draft." };

  revalidatePath("/behavioral");
  revalidatePath("/account");
  return { ok: true, message: draft.status === "ready" ? "Marked ready to tell." : "Draft saved." };
}

export async function deleteStarDraft(questionId: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Sign in to manage saved drafts." };

  const { error } = await supabase.from("star_drafts").delete().eq("user_id", userId).eq("question_id", questionId);
  if (error) return { ok: false, message: "Could not clear your draft." };

  revalidatePath("/behavioral");
  revalidatePath("/account");
  return { ok: true, message: "Draft cleared." };
}
