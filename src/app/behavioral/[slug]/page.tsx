import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { StarEditor } from "@/components/star-editor";
import { behavioralDifficultyLabels, emptyStarDraft, type StarDraft } from "@/lib/behavioral";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.split("-").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ") };
}

export default async function BehavioralQuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: question } = await supabase.from("behavioral_questions").select("id, slug, title, why_asked, what_to_cover, difficulty, is_premium, category:behavioral_categories(slug, title)").eq("slug", slug).maybeSingle();
  if (!question) notFound();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: guide }, { data: savedDraft }, { data: entitlement }] = await Promise.all([
    supabase.from("behavioral_answer_guides").select("example_outline, pitfalls, follow_ups").eq("question_id", question.id).maybeSingle(),
    userId ? supabase.from("star_drafts").select("situation, task, action, result, status").eq("question_id", question.id).eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
    userId ? supabase.from("entitlements").select("plan, status, current_period_end").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const category = Array.isArray(question.category) ? question.category[0] : question.category;
  const toStrings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  const whatToCover = toStrings(question.what_to_cover);
  const pitfalls = toStrings(guide?.pitfalls);
  const followUps = toStrings(guide?.follow_ups);
  const hasActivePro = entitlement?.plan === "pro" && entitlement.status === "active" && (!entitlement.current_period_end || new Date(entitlement.current_period_end) > new Date());
  const initialDraft: StarDraft = savedDraft ? { situation: savedDraft.situation, task: savedDraft.task, action: savedDraft.action, result: savedDraft.result, status: savedDraft.status === "ready" ? "ready" : "draft" } : emptyStarDraft;

  return <main className="app-shell answer-page behavioral-page">
    <SiteHeader />
    <article className="answer-layout behavioral-layout page-width">
      <Link href={`/behavioral?category=${category.slug}`} className="back-link">← Back to {category.title}</Link>
      <header className="answer-header"><div className="question-badges"><span>{category.title}</span><span>{behavioralDifficultyLabels[question.difficulty]}</span><span className={question.is_premium ? "pro-badge" : "free-badge"}>{question.is_premium ? "PRO" : "FREE"}</span></div><h1>{question.title}</h1></header>
      <section className="short-answer"><span className="overline accent">WHAT THEY ARE REALLY ASKING</span><p>{question.why_asked}</p></section>
      <section className="cover-list"><span className="overline">A STRONG ANSWER COVERS</span><ol>{whatToCover.map((item) => <li key={item}>{item}</li>)}</ol></section>

      <StarEditor questionId={question.id} initialDraft={initialDraft} signedIn={Boolean(userId)} />

      {guide ? <>
        <section className="deep-answer"><span className="overline">EXAMPLE OUTLINE</span><h2>How a strong answer sounds</h2><p className="example-note">Borrow the shape, not the story. Interviewers can tell when an answer is not yours.</p><div className="example-outline">{guide.example_outline.split("\n").map((line: string) => { const [label, ...rest] = line.split(": "); return rest.length ? <p key={line}><b>{label}:</b> {rest.join(": ")}</p> : <p key={line}>{line}</p>; })}</div></section>
        {pitfalls.length > 0 && <section className="pitfalls"><span className="overline">COMMON PITFALLS</span><h2>What weakens this answer</h2><ul>{pitfalls.map((item) => <li key={item}>{item}</li>)}</ul></section>}
        {followUps.length > 0 && <section className="follow-ups"><span className="overline">LIKELY FOLLOW-UPS</span><h2>Be ready for the next question</h2><ol>{followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}</ol></section>}
      </> : <section className="pro-lock"><span className="lock-mark">PRO</span><div><span className="overline accent">EXAMPLE OUTLINE LOCKED</span><h2>See how a strong answer is built.</h2><p>Pro unlocks the example outline, common pitfalls, and likely follow-up questions for this prompt. The guide is never sent to this page without an active entitlement. Your STAR workspace above stays free.</p>{userId ? <span className="sync-message">{hasActivePro ? "Your plan is active. Refresh or contact support if this remains locked." : "Pro checkout arrives in the payments phase."}</span> : <Link href={`/auth?message=${encodeURIComponent("Sign in to continue with Pro interview prep.")}`} className="button button-primary">Sign in to continue →</Link>}</div></section>}
    </article>
  </main>;
}
