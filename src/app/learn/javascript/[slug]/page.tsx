import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JavaScriptLessonView } from "@/components/javascript-lesson-view";
import type { LearningLesson, LearningModule, LessonContentBlock, LessonQuestion } from "@/lib/learning";
import { createClient } from "@/lib/supabase/server";

type LessonPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("title, summary").eq("slug", slug).maybeSingle();
  return data ? { title: data.title, description: data.summary } : {};
}

export default async function JavaScriptLessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: lessonRow } = await supabase.from("lessons").select("id, module_id, slug, title, summary, difficulty, estimated_minutes, position, version, access_level, objectives, prerequisites").eq("slug", slug).maybeSingle();
  if (!lessonRow) notFound();
  const lesson = lessonRow as LearningLesson;
  const { data: currentModule } = await supabase.from("modules").select("id, track_id, title, description, position").eq("id", lesson.module_id).single();
  if (!currentModule) notFound();
  const [{ data: modulesRow }, { data: blocksRow }, { data: linksRow }, { data: claimsData }] = await Promise.all([
    supabase.from("modules").select("id, title, description, position").eq("track_id", currentModule.track_id).order("position"),
    supabase.from("lesson_content_blocks").select("id, position, block_type, title, body, code, code_language, meta").eq("lesson_id", lesson.id).order("position"),
    supabase.from("lesson_questions").select("question_id, position").eq("lesson_id", lesson.id).order("position"),
    supabase.auth.getClaims(),
  ]);
  const modules = (modulesRow ?? []) as LearningModule[];
  const moduleIds = modules.map(({ id }) => id);
  const { data: lessonRows } = moduleIds.length ? await supabase.from("lessons").select("id, module_id, slug, title, summary, difficulty, estimated_minutes, position, version, access_level, objectives, prerequisites").in("module_id", moduleIds) : { data: [] };
  const questionIds = (linksRow ?? []).map(({ question_id }) => question_id);
  const { data: questionRows } = questionIds.length ? await supabase.from("questions").select("id, question_type, prompt, payload, explanation, version").in("id", questionIds) : { data: [] };
  const questionById = new Map((questionRows ?? []).map((question) => [question.id, question]));
  const questions = (linksRow ?? []).map(({ question_id }) => questionById.get(question_id)).filter((question): question is LessonQuestion => Boolean(question));
  const userId = claimsData?.claims?.sub;
  const { data: progress } = userId ? await supabase.from("lesson_progress").select("percent").eq("user_id", userId).eq("lesson_id", lesson.id).maybeSingle() : { data: null };

  return <JavaScriptLessonView lesson={lesson} currentModule={currentModule as LearningModule} modules={modules} lessons={(lessonRows ?? []) as LearningLesson[]} blocks={(blocksRow ?? []) as LessonContentBlock[]} questions={questions} isAuthenticated={Boolean(userId)} initialProgress={progress?.percent ?? 0} />;
}
