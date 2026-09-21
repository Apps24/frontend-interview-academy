import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookmarkButton } from "@/components/bookmark-button";
import { SiteHeader } from "@/components/site-header";
import { difficultyLabels } from "@/lib/interview";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ") };
}

export default async function InterviewQuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: question } = await supabase.from("interview_questions").select("id, slug, title, short_answer, difficulty, is_premium, topic:interview_topics(slug, title)").eq("slug", slug).maybeSingle();
  if (!question) notFound();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: answer }, { data: bookmark }, { data: entitlement }] = await Promise.all([
    supabase.from("interview_question_answers").select("short_answer, detailed_answer, code_example, follow_ups, common_mistakes").eq("question_id", question.id).maybeSingle(),
    userId ? supabase.from("interview_bookmarks").select("question_id").eq("question_id", question.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
    userId ? supabase.from("entitlements").select("plan, status, current_period_end").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const topic = Array.isArray(question.topic) ? question.topic[0] : question.topic;
  const followUps = Array.isArray(answer?.follow_ups) ? answer.follow_ups.filter((item): item is string => typeof item === "string") : [];
  const commonMistakes = Array.isArray(answer?.common_mistakes) ? answer.common_mistakes.filter((item): item is string => typeof item === "string") : [];
  const hasActivePro = entitlement?.plan === "pro" && entitlement.status === "active" && (!entitlement.current_period_end || new Date(entitlement.current_period_end) > new Date());

  return <main className="app-shell answer-page">
    <SiteHeader />
    <article className="answer-layout page-width">
      <Link href={`/interview?topic=${topic.slug}`} className="back-link">← Back to {topic.title}</Link>
      <header className="answer-header"><div className="question-badges"><span>{topic.title}</span><span>{difficultyLabels[question.difficulty]}</span><span className={question.is_premium ? "pro-badge" : "free-badge"}>{question.is_premium ? "PRO" : "FREE"}</span></div><h1>{question.title}</h1><BookmarkButton questionId={question.id} initialBookmarked={Boolean(bookmark)} signedIn={Boolean(userId)} /></header>
      <section className="short-answer"><span className="overline accent">30-SECOND ANSWER</span><p>{answer?.short_answer ?? question.short_answer}</p></section>
      {answer ? <>
        <section className="deep-answer"><span className="overline">DEEPER EXPLANATION</span><h2>Build the mental model</h2>{answer.detailed_answer.split("\n").map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}</section>
        {answer.code_example && <section className="answer-code"><div><span /><span /><span /><small>example</small></div><pre><code>{answer.code_example}</code></pre></section>}
        {followUps.length > 0 && <section className="follow-ups"><span className="overline">LIKELY FOLLOW-UPS</span><h2>Be ready to go one level deeper</h2><ol>{followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}</ol></section>}
        {commonMistakes.length > 0 && <section className="follow-ups common-mistakes"><span className="overline">COMMON MISTAKES</span><h2>Avoid these weak-answer traps</h2><ul>{commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section>}
      </> : <section className="pro-lock"><span className="lock-mark">PRO</span><div><span className="overline accent">DETAILED ANSWER LOCKED</span><h2>Turn the short answer into a strong conversation.</h2><p>Pro unlocks the complete mental model, code example, and likely follow-up questions. The protected answer is never sent to this page without an active entitlement.</p>{userId ? <span className="sync-message">{hasActivePro ? "Your plan is active. Refresh or contact support if this remains locked." : "Pro checkout arrives in the payments phase."}</span> : <Link href={`/auth?message=${encodeURIComponent("Sign in to continue with Pro interview prep.")}`} className="button button-primary">Sign in to continue →</Link>}</div></section>}
    </article>
  </main>;
}
