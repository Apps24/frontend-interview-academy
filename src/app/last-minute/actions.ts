"use server";

import { revalidatePath } from "next/cache";

import { focusTopicOptions, lastMinuteTaskKeys, type FocusTopic, type LastMinuteConfig, type PlanDuration } from "@/lib/last-minute-plan";
import { createClient } from "@/lib/supabase/server";

const allowedTopics = new Set<FocusTopic>(focusTopicOptions.map(({ slug }) => slug));

export async function saveLastMinutePlan(config: LastMinuteConfig) {
  if (![1, 2, 4, 8].includes(config.durationHours) || config.targetRole.trim().length < 2 || config.targetRole.trim().length > 80) return { ok: false, message: "Check the plan duration and target role." };
  const topics = [...new Set(config.focusTopics)].filter((topic): topic is FocusTopic => allowedTopics.has(topic));
  if (topics.length < 1 || topics.length > 4) return { ok: false, message: "Choose between one and four focus topics." };
  const interviewAt = config.interviewAt && !Number.isNaN(Date.parse(config.interviewAt)) ? new Date(config.interviewAt).toISOString() : null;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Plan generated locally. Sign in to save it across devices." };
  const { error } = await supabase.from("last_minute_plans").upsert({ user_id: userId, duration_hours: config.durationHours as PlanDuration, target_role: config.targetRole.trim(), focus_topics: topics, interview_at: interviewAt, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: "Could not save your plan." };
  revalidatePath("/last-minute");
  revalidatePath("/account");
  return { ok: true, message: "Plan saved." };
}

export async function setLastMinuteTaskComplete(itemKey: string, completed: boolean) {
  if (!lastMinuteTaskKeys.has(itemKey)) return { ok: false, message: "Unknown plan item." };
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { ok: false, message: "Sign in to save completion progress." };
  const query = completed
    ? supabase.from("last_minute_task_progress").upsert({ user_id: userId, item_key: itemKey, completed_at: new Date().toISOString() })
    : supabase.from("last_minute_task_progress").delete().eq("user_id", userId).eq("item_key", itemKey);
  const { error } = await query;
  if (error) return { ok: false, message: "Could not update this task." };
  revalidatePath("/last-minute");
  revalidatePath("/account");
  return { ok: true, message: completed ? "Task complete." : "Task reopened." };
}
