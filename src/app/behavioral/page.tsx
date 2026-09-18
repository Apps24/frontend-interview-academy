import type { Metadata } from "next";

import { BehavioralQuestionBank } from "@/components/behavioral-question-bank";
import { SiteHeader } from "@/components/site-header";
import type { BehavioralCategory, BehavioralQuestionPreview } from "@/lib/behavioral";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Behavioral interview questions" };

export default async function BehavioralPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: requestedCategory = "all" } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: categoryRows }, { data: questionRows }, draftResult] = await Promise.all([
    supabase.from("behavioral_categories").select("slug, title, description").order("position"),
    supabase.from("behavioral_questions").select("id, slug, title, why_asked, difficulty, is_premium, category:behavioral_categories(slug, title)").order("position"),
    userId ? supabase.from("star_drafts").select("question_id, status").eq("user_id", userId) : Promise.resolve({ data: [] as { question_id: string; status: string }[] }),
  ]);
  const categories = (categoryRows ?? []) as BehavioralCategory[];
  const validCategory = categories.some(({ slug }) => slug === requestedCategory) ? requestedCategory : "all";
  const questions: BehavioralQuestionPreview[] = (questionRows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    whyAsked: row.why_asked,
    difficulty: row.difficulty as 1 | 2 | 3,
    isPremium: row.is_premium,
    category: Array.isArray(row.category) ? row.category[0] : row.category,
  }));
  const drafts = Object.fromEntries((draftResult.data ?? []).map(({ question_id, status }) => [question_id, status as "draft" | "ready"]));
  const readyCount = Object.values(drafts).filter((status) => status === "ready").length;

  return <main className="app-shell interview-page behavioral-page">
    <SiteHeader />
    <section className="interview-hero page-width"><span className="overline accent">BEHAVIORAL & GENERAL INTERVIEW BANK</span><h1>Have the story ready.<br /><span>Tell it in two minutes.</span></h1><p>Every question comes with what the interviewer is really checking, what a strong answer covers, and a STAR workspace that reviews your draft as you write.</p><div className="bank-stats"><div><strong>{questions.length}</strong><span>questions</span></div><div><strong>{categories.length}</strong><span>categories</span></div><div><strong>{userId ? readyCount : "—"}</strong><span>answers ready</span></div></div></section>
    <div className="page-width"><BehavioralQuestionBank questions={questions} categories={categories} initialCategory={validCategory} drafts={drafts} signedIn={Boolean(userId)} /></div>
  </main>;
}
