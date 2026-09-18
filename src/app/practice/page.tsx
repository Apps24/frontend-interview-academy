import type { Metadata } from "next";

import { PracticeCatalog } from "@/components/practice-catalog";
import { SiteHeader } from "@/components/site-header";
import type { PracticeProblemPreview } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Frontend coding practice" };

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: rows }, progressResult] = await Promise.all([
    supabase.from("practice_problems").select("id, slug, title, summary, topic, difficulty, estimated_minutes, is_premium").order("position"),
    userId ? supabase.from("practice_progress").select("problem_id, status").eq("user_id", userId) : Promise.resolve({ data: [] }),
  ]);
  const progress = new Map((progressResult.data ?? []).map((row) => [row.problem_id, row.status]));
  const problems: PracticeProblemPreview[] = (rows ?? []).map((row) => ({ id: row.id, slug: row.slug, title: row.title, summary: row.summary, topic: row.topic, difficulty: row.difficulty as 1 | 2 | 3, estimatedMinutes: row.estimated_minutes, isPremium: row.is_premium, progress: progress.get(row.id) === "solved" ? "solved" : progress.get(row.id) === "started" ? "started" : "not_started" }));
  const solved = problems.filter(({ progress: value }) => value === "solved").length;

  return <main className="app-shell practice-page"><SiteHeader /><section className="practice-hero page-width"><div><span className="overline accent">DELIBERATE CODING PRACTICE</span><h1>Read less.<br /><span>Solve more.</span></h1><p>Work through focused JavaScript challenges, test the core cases in your browser, save drafts, and revisit the reasoning after you solve them.</p></div><aside><strong>{solved}/{problems.length}</strong><span>challenges solved</span><i><em style={{ width: `${problems.length ? (solved / problems.length) * 100 : 0}%` }} /></i></aside></section><div className="page-width"><PracticeCatalog problems={problems} /></div></main>;
}
