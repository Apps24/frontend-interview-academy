import type { Metadata } from "next";

import { InterviewQuestionBank } from "@/components/interview-question-bank";
import { SiteHeader } from "@/components/site-header";
import type { InterviewQuestionPreview, InterviewTopic } from "@/lib/interview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Frontend interview questions" };

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic: requestedTopic = "all" } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: topicRows }, { data: questionRows }, bookmarkResult] = await Promise.all([
    supabase.from("interview_topics").select("slug, title").order("position"),
    supabase.from("interview_questions").select("id, slug, title, short_answer, difficulty, is_premium, topic:interview_topics(slug, title)").order("position"),
    userId ? supabase.from("interview_bookmarks").select("question_id").eq("user_id", userId) : Promise.resolve({ data: [] }),
  ]);
  const topics = (topicRows ?? []) as InterviewTopic[];
  const validTopic = topics.some(({ slug }) => slug === requestedTopic) ? requestedTopic : "all";
  const questions: InterviewQuestionPreview[] = (questionRows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortAnswer: row.short_answer,
    difficulty: row.difficulty as 1 | 2 | 3,
    isPremium: row.is_premium,
    topic: Array.isArray(row.topic) ? row.topic[0] : row.topic,
  }));

  return <main className="app-shell interview-page">
    <SiteHeader />
    <section className="interview-hero page-width"><span className="overline accent">TECHNICAL INTERVIEW BANK</span><h1>Know the short answer.<br /><span>Understand the deeper one.</span></h1><p>Search focused frontend questions, review a crisp interview response, then study the reasoning, examples, and follow-up prompts.</p><div className="bank-stats"><div><strong>{questions.length}</strong><span>launch questions</span></div><div><strong>{questions.filter(({ isPremium }) => !isPremium).length}</strong><span>free deep dives</span></div><div><strong>{topics.length}</strong><span>core topics</span></div></div></section>
    <div className="page-width"><InterviewQuestionBank questions={questions} topics={topics} initialTopic={validTopic} initialBookmarks={(bookmarkResult.data ?? []).map(({ question_id }) => question_id)} signedIn={Boolean(userId)} /></div>
  </main>;
}
