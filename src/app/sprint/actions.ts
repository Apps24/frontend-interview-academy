"use server";

import { revalidatePath } from "next/cache";

import { sprintItems } from "@/lib/interview-sprint";
import { createClient } from "@/lib/supabase/server";

const sprintKeys = new Set(sprintItems.map(({ key }) => key));

export async function setSprintItemCompleted(itemKey: string, completed: boolean) {
  if (!sprintKeys.has(itemKey)) return { ok: false, message: "Unknown sprint item." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { ok: false, message: "Sign in to save your sprint progress." };

  const operation = completed
    ? supabase.from("sprint_item_progress").upsert({ user_id: userId, item_key: itemKey, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,item_key" })
    : supabase.from("sprint_item_progress").delete().eq("user_id", userId).eq("item_key", itemKey);
  const { error } = await operation;

  if (error) return { ok: false, message: "Progress could not be saved. Please try again." };
  revalidatePath("/sprint");
  revalidatePath("/account");
  return { ok: true, message: completed ? "Task completed." : "Task reopened." };
}
