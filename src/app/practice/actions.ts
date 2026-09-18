"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function savePracticeProgress(problemId: string, code: string, solved: boolean, countAttempt = false) {
  if (!problemId || code.length > 50000) return { ok: false, message: "The saved solution is too large." };

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Sign in to save your work." };

  const [{ data: problem }, { data: current }] = await Promise.all([
    supabase.from("practice_problems").select("id").eq("id", problemId).maybeSingle(),
    supabase.from("practice_progress").select("attempts, status, completed_at").eq("user_id", userId).eq("problem_id", problemId).maybeSingle(),
  ]);
  if (!problem) return { ok: false, message: "This problem is unavailable." };

  const status = solved || current?.status === "solved" ? "solved" : "started";
  const { error } = await supabase.from("practice_progress").upsert({
    user_id: userId,
    problem_id: problemId,
    status,
    last_code: code,
    attempts: (current?.attempts ?? 0) + (countAttempt ? 1 : 0),
    completed_at: status === "solved" ? current?.completed_at ?? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: "Could not save your practice progress." };
  revalidatePath("/practice");
  revalidatePath("/account");
  return { ok: true, message: status === "solved" ? "Problem marked solved." : "Draft saved." };
}
