import type { Metadata } from "next";

import { LastMinutePlanner } from "@/components/last-minute-planner";
import { SiteHeader } from "@/components/site-header";
import { focusTopicOptions, type FocusTopic, type LastMinuteConfig, type PlanDuration } from "@/lib/last-minute-plan";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Last-minute interview plan" };

export default async function LastMinutePage({ searchParams }: { searchParams: Promise<{ topics?: string }> }) {
  const { topics: topicParam } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: saved }, { data: progress }] = userId ? await Promise.all([
    supabase.from("last_minute_plans").select("duration_hours, target_role, focus_topics, interview_at").eq("user_id", userId).maybeSingle(),
    supabase.from("last_minute_task_progress").select("item_key").eq("user_id", userId),
  ]) : [{ data: null }, { data: [] }];
  const allowedTopics = new Set<FocusTopic>(focusTopicOptions.map(({ slug }) => slug));
  const recommendedTopics = [...new Set((topicParam ?? "").split(",").filter((topic): topic is FocusTopic => allowedTopics.has(topic as FocusTopic)))].slice(0, 4);
  const initialConfig: LastMinuteConfig = saved ? { durationHours: saved.duration_hours as PlanDuration, targetRole: saved.target_role, focusTopics: recommendedTopics.length ? recommendedTopics : saved.focus_topics as FocusTopic[], interviewAt: saved.interview_at } : { durationHours: 2, targetRole: "Frontend developer", focusTopics: recommendedTopics.length ? recommendedTopics : ["javascript", "coding"], interviewAt: null };

  return <main className="app-shell last-minute-page"><SiteHeader /><section className="last-minute-hero page-width"><span className="eyebrow"><span className="status-dot" /> Interview soon?</span><h1>Stop collecting notes.<br /><span>Start closing gaps.</span></h1><p>Choose the time you actually have and the areas most likely to hurt your score. Get a realistic schedule with a clear finish line—no new syllabus, no panic browsing.</p></section><div className="page-width"><LastMinutePlanner initialConfig={initialConfig} initialCompleted={(progress ?? []).map(({ item_key }) => item_key)} signedIn={Boolean(userId)} /></div></main>;
}
