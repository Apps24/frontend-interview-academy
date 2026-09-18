import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { javascriptLessons } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modern JavaScript", description: "A practical JavaScript foundations track with interview checkpoints." };

export default async function JavaScriptTrackPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: progressRows } = userId
    ? await supabase.from("lesson_progress").select("lesson_id, status, percent").eq("user_id", userId).in("lesson_id", javascriptLessons.map(({ id }) => id))
    : { data: [] };
  const progress = new Map((progressRows ?? []).map((row) => [row.lesson_id, row]));
  const completed = progressRows?.filter(({ status }) => status === "completed").length ?? 0;
  const totalPercent = Math.round((completed / javascriptLessons.length) * 100);

  return <main className="app-shell track-shell">
    <SiteHeader />
    <section className="track-hero page-width"><div><span className="overline accent">LIVE LEARNING TRACK</span><h1>Modern JavaScript</h1><p>Six focused lessons from expressions through closures and async flow. Every lesson ends with a saved interview checkpoint.</p></div><div className="track-summary"><strong>{completed}/{javascriptLessons.length}</strong><span>lessons completed</span><i><em style={{ width: `${totalPercent}%` }} /></i></div></section>
    <section className="lesson-catalog page-width">{javascriptLessons.map((lesson) => {
      const saved = progress.get(lesson.id);
      return <article className="catalog-row" key={lesson.id}><span className="catalog-index">{String(lesson.order).padStart(2, "0")}</span><div><span className="overline">{lesson.difficulty} · {lesson.estimatedMinutes} MIN</span><h2>{lesson.title}</h2><p>{lesson.summary}</p></div><div className="catalog-action"><span>{saved?.status === "completed" ? "Completed ✓" : saved ? `${saved.percent}% saved` : "Not started"}</span><Link href={`/learn/javascript/${lesson.slug}`} className="button button-secondary">{saved ? "Continue" : "Start"} →</Link></div></article>;
    })}</section>
  </main>;
}
