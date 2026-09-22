import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { sprintItems } from "@/lib/interview-sprint";
import { orderLessons, type LearningLesson, type LearningModule } from "@/lib/learning";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My learning home" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth?message=Sign%20in%20to%20view%20your%20progress.");

  const { data: track } = await supabase.from("tracks").select("id").eq("slug", "javascript").single();
  const { data: moduleRows } = track ? await supabase.from("modules").select("id, title, description, position").eq("track_id", track.id).order("position") : { data: [] };
  const modules = (moduleRows ?? []) as LearningModule[];
  const { data: lessonRows } = modules.length ? await supabase.from("lessons").select("id, module_id, slug, title, summary, difficulty, estimated_minutes, position, version, access_level, objectives, prerequisites").in("module_id", modules.map(({ id }) => id)) : { data: [] };
  const lessons = orderLessons(modules, (lessonRows ?? []) as LearningLesson[]);

  const [{ data: profile }, { data: progressRows }, { count: attempts }, { count: sprintCompleted }, { count: bookmarks }, { data: entitlement }, { count: practiceSolved }, { count: practiceTotal }, { count: lastMinuteCompleted }, { data: latestDiagnostic }, { data: starRows }] = await Promise.all([
    supabase.from("profiles").select("display_name, target_role, experience_level").eq("user_id", userId).maybeSingle(),
    lessons.length ? supabase.from("lesson_progress").select("lesson_id, status, percent, updated_at").eq("user_id", userId).in("lesson_id", lessons.map(({ id }) => id)) : Promise.resolve({ data: [] }),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("sprint_item_progress").select("item_key", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("interview_bookmarks").select("question_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("entitlements").select("plan, status").eq("user_id", userId).maybeSingle(),
    supabase.from("practice_progress").select("problem_id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "solved"),
    supabase.from("practice_problems").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("last_minute_task_progress").select("item_key", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("diagnostic_attempts").select("total_correct, total_questions").eq("user_id", userId).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("star_drafts").select("status").eq("user_id", userId),
  ]);

  const email = String(claimsData.claims.email ?? "");
  const userMetadata = claimsData.claims.user_metadata as { display_name?: string } | undefined;
  const displayName = profile?.display_name || userMetadata?.display_name || email.split("@")[0] || "Learner";
  const progress = new Map((progressRows ?? []).map((row) => [row.lesson_id, row]));
  const completedLessons = progressRows?.filter(({ status }) => status === "completed").length ?? 0;
  const totalPercent = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((lesson) => progress.get(lesson.id)?.status !== "completed") ?? lessons[0];
  if (!nextLesson) redirect("/learn/javascript");
  const nextProgress = progress.get(nextLesson.id);
  const percent = nextProgress?.percent ?? 0;
  const solvedCount = practiceSolved ?? 0;
  const problemCount = practiceTotal ?? 0;
  const starReady = starRows?.filter(({ status }) => status === "ready").length ?? 0;
  const starDrafted = starRows?.length ?? 0;
  const diagnosticScore = latestDiagnostic ? Math.round(latestDiagnostic.total_correct / latestDiagnostic.total_questions * 100) : null;
  const hasActivePro = entitlement?.plan === "pro" && entitlement.status === "active";

  const setupSteps = [
    { title: "Find your starting point", copy: diagnosticScore === null ? "Take the 5-minute diagnostic" : `Diagnostic complete · ${diagnosticScore}%`, href: "/diagnostic", done: diagnosticScore !== null },
    { title: "Complete your first lesson", copy: completedLessons ? `${completedLessons} lesson${completedLessons === 1 ? "" : "s"} completed` : "Start JavaScript foundations", href: `/learn/javascript/${nextLesson.slug}`, done: completedLessons > 0 },
    { title: "Solve one coding problem", copy: solvedCount ? `${solvedCount} problem${solvedCount === 1 ? "" : "s"} solved` : "Try a guided coding challenge", href: "/practice", done: solvedCount > 0 },
    { title: "Prepare one interview answer", copy: starDrafted ? `${starDrafted} STAR answer${starDrafted === 1 ? "" : "s"} started` : "Build a reusable STAR story", href: "/behavioral", done: starDrafted > 0 || (bookmarks ?? 0) > 0 },
  ];
  const setupComplete = setupSteps.filter(({ done }) => done).length;

  return <main className="app-shell account-shell">
    <SiteHeader />
    <section className="account-welcome page-width">
      <div><span className="overline accent">MY LEARNING HOME</span><h1>Hi {displayName}, what will you finish today?</h1><p>Follow one clear next step, or choose the kind of practice you need.</p></div>
      <a href="#plans" className={`account-plan-pill ${hasActivePro ? "is-pro" : ""}`}><span>{hasActivePro ? "PRO ACTIVE" : "FREE PLAN"}</span><strong>{hasActivePro ? "All premium content unlocked" : "View plans"}</strong></a>
    </section>

    <section className="account-onboarding page-width" aria-label="Your guided start">
      <article className="account-focus-card">
        <div className="account-focus-top"><div><span className="overline accent">RECOMMENDED NEXT</span><h2>{nextLesson.title}</h2></div><span className="account-track-progress">{totalPercent}% of track</span></div>
        <p>{nextLesson.summary}</p>
        <div className="account-progress" aria-label={`${percent}% of this lesson complete`}><i style={{ width: `${percent}%` }} /></div>
        <div className="account-progress-meta"><span>{percent ? `${percent}% of this lesson complete` : `${nextLesson.estimated_minutes} min lesson`}</span><span>{completedLessons}/{lessons.length} lessons done</span></div>
        <Link href={`/learn/javascript/${nextLesson.slug}`} className="button button-primary">{percent ? "Continue where I left off" : "Start this lesson"} <span aria-hidden>→</span></Link>
      </article>

      <aside className="account-setup-card">
        <div className="account-setup-head"><div><span className="overline">QUICK START</span><h2>Your setup path</h2></div><strong>{setupComplete}/4</strong></div>
        <ol>{setupSteps.map((step, index) => <li className={step.done ? "done" : ""} key={step.title}><span className="setup-step-mark">{step.done ? "✓" : index + 1}</span><Link href={step.href}><strong>{step.title}</strong><small>{step.copy}</small></Link><span aria-hidden>→</span></li>)}</ol>
      </aside>
    </section>

    <section className="account-journeys page-width">
      <div className="account-section-heading"><div><span className="overline accent">CHOOSE YOUR FOCUS</span><h2>Three simple ways to prepare</h2></div><p>You do not need to use everything at once.</p></div>
      <div className="account-journey-grid">
        <Link href="/learn/javascript" className="account-journey-card"><span className="journey-icon learn-icon">JS</span><div><span className="overline">01 · LEARN</span><h3>Build the foundations</h3><p>Short JavaScript lessons with checks after every concept.</p><strong>{completedLessons}/{lessons.length} lessons complete <span aria-hidden>→</span></strong></div></Link>
        <Link href="/practice" className="account-journey-card"><span className="journey-icon practice-icon">{`{ }`}</span><div><span className="overline">02 · PRACTICE</span><h3>Write working code</h3><p>Solve focused problems in the browser and run the tests.</p><strong>{solvedCount}/{problemCount} problems solved <span aria-hidden>→</span></strong></div></Link>
        <Link href="/interview" className="account-journey-card"><span className="journey-icon interview-icon">Q</span><div><span className="overline">03 · INTERVIEW</span><h3>Explain with confidence</h3><p>Review technical answers and prepare reusable STAR stories.</p><strong>{starReady} answers ready <span aria-hidden>→</span></strong></div></Link>
      </div>
    </section>

    <section className="account-plans page-width" id="plans">
      <div className="account-section-heading"><div><span className="overline accent">YOUR ACCESS</span><h2>Free or Pro, managed here</h2></div><p>See exactly what is included. Payments stay paused until secure checkout is connected.</p></div>
      <div className="account-plan-grid">
        <article className={!hasActivePro ? "active-plan" : ""}><div className="account-plan-title"><span className="overline">FREE</span>{!hasActivePro && <strong>CURRENT PLAN</strong>}</div><h3>$0</h3><p>Everything needed to start a consistent preparation habit.</p><ul><li>JavaScript beginner path</li><li>Core coding challenges</li><li>Short interview answers</li><li>Progress, bookmarks, and STAR drafts</li></ul>{!hasActivePro ? <span className="button button-secondary plan-status-button">Your current plan</span> : <Link href="/learn/javascript" className="button button-secondary">Use free learning</Link>}</article>
        <article className={`pro-plan ${hasActivePro ? "active-plan" : ""}`}><div className="account-plan-title"><span className="overline accent">PRO</span>{hasActivePro && <strong>ACTIVE</strong>}</div><h3>Full library</h3><p>Deeper explanations, premium guides, and complete solutions.</p><ul><li>Every detailed technical answer</li><li>Reference solutions and mental models</li><li>Behavioral outlines, pitfalls, and follow-ups</li><li>Future advanced preparation tracks</li></ul>{hasActivePro ? <Link href="/interview" className="button button-primary">Use my Pro access <span aria-hidden>→</span></Link> : <button type="button" className="button button-primary" disabled>Upgrade checkout coming soon</button>}</article>
      </div>
    </section>

    <details className="account-details page-width">
      <summary>See all progress details <span aria-hidden>＋</span></summary>
      <div className="account-detail-grid"><div><span>Latest diagnostic</span><strong>{diagnosticScore === null ? "Not taken" : `${diagnosticScore}%`}</strong></div><div><span>Quiz attempts</span><strong>{attempts ?? 0}</strong></div><div><span>Saved questions</span><strong>{bookmarks ?? 0}</strong></div><div><span>STAR answers ready</span><strong>{starReady}/{starDrafted}</strong></div><div><span>2-day sprint</span><strong>{sprintCompleted ?? 0}/{sprintItems.length}</strong></div><div><span>Last-minute blocks</span><strong>{lastMinuteCompleted ?? 0}</strong></div></div>
      <div className="account-detail-links"><Link href="/last-minute">Last-minute plan</Link><Link href="/sprint">Two-day sprint</Link><Link href="/behavioral">Behavioral practice</Link></div>
    </details>
  </main>;
}
