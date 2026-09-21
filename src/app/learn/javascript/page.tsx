import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { difficultyLabel, orderLessons, type LearningLesson, type LearningModule } from "@/lib/learning";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modern JavaScript", description: "A complete beginner JavaScript track with lessons, quizzes, and coding practice." };

export default async function JavaScriptTrackPage() {
  const supabase = await createClient();
  const { data: track } = await supabase.from("tracks").select("id, title, description").eq("slug", "javascript").single();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: moduleRows } = track ? await supabase.from("modules").select("id, title, description, position").eq("track_id", track.id).order("position") : { data: [] };
  const modules = (moduleRows ?? []) as LearningModule[];
  const moduleIds = modules.map(({ id }) => id);
  const { data: lessonRows } = moduleIds.length ? await supabase.from("lessons").select("id, module_id, slug, title, summary, difficulty, estimated_minutes, position, version, access_level, objectives, prerequisites").in("module_id", moduleIds) : { data: [] };
  const lessons = orderLessons(modules, (lessonRows ?? []) as LearningLesson[]);
  const { data: progressRows } = userId && lessons.length
    ? await supabase.from("lesson_progress").select("lesson_id, status, percent").eq("user_id", userId).in("lesson_id", lessons.map(({ id }) => id))
    : { data: [] };
  const progress = new Map((progressRows ?? []).map((row) => [row.lesson_id, row]));
  const completed = progressRows?.filter(({ status }) => status === "completed").length ?? 0;
  const totalPercent = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

  return <main className="app-shell track-shell">
    <SiteHeader />
    <section className="track-hero page-width"><div><span className="overline accent">COMPLETE BEGINNER TRACK</span><h1>{track?.title ?? "Modern JavaScript"}</h1><p>{track?.description ?? "Learn JavaScript from core syntax through browser APIs with a quiz and practice challenge in every lesson."}</p></div><div className="track-summary"><strong>{completed}/{lessons.length}</strong><span>lessons completed</span><i><em style={{ width: `${totalPercent}%` }} /></i></div></section>
    <section className="lesson-catalog page-width">{modules.map((module) => {
      const moduleLessons = lessons.filter(({ module_id }) => module_id === module.id);
      return <section className="catalog-module" key={module.id}><header><span className="overline accent">MODULE {String(module.position).padStart(2, "0")}</span><h2>{module.title}</h2><p>{module.description}</p></header>{moduleLessons.map((lesson) => {
        const number = lessons.findIndex(({ id }) => id === lesson.id) + 1;
        const saved = progress.get(lesson.id);
        return <article className="catalog-row" key={lesson.id}><span className="catalog-index">{String(number).padStart(2, "0")}</span><div><span className="overline">{difficultyLabel(lesson.difficulty)} · {lesson.estimated_minutes} MIN · {lesson.access_level === "pro" ? "PRO" : "FREE"}</span><h3>{lesson.title}</h3><p>{lesson.summary}</p></div><div className="catalog-action"><span>{saved?.status === "completed" ? "Completed ✓" : saved ? `${saved.percent}% saved` : "Not started"}</span><Link href={`/learn/javascript/${lesson.slug}`} className="button button-secondary">{saved ? "Continue" : "Start"} →</Link></div></article>;
      })}</section>;
    })}</section>
  </main>;
}
