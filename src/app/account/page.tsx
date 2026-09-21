import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { sprintItems } from "@/lib/interview-sprint";
import { orderLessons, type LearningLesson, type LearningModule } from "@/lib/learning";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My progress" };

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
  const metadata = claimsData.claims.user_metadata as { display_name?: string } | undefined;
  const displayName = profile?.display_name || metadata?.display_name || email.split("@")[0] || "Learner";
  const progress = new Map((progressRows ?? []).map((row) => [row.lesson_id, row]));
  const completedLessons = progressRows?.filter(({ status }) => status === "completed").length ?? 0;
  const totalPercent = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((lesson) => progress.get(lesson.id)?.status !== "completed") ?? lessons[0];
  if (!nextLesson) redirect("/learn/javascript");
  const nextProgress = progress.get(nextLesson.id);
  const percent = nextProgress?.percent ?? 0;
  const starReady = starRows?.filter(({ status }) => status === "ready").length ?? 0;
  const starDrafted = starRows?.length ?? 0;
  const diagnosticScore = latestDiagnostic ? Math.round(latestDiagnostic.total_correct / latestDiagnostic.total_questions * 100) : null;

  return <main className="app-shell account-shell">
    <SiteHeader />
    <section className="account-hero page-width">
      <div><span className="overline accent">YOUR LEARNING ACCOUNT</span><h1>Welcome back, {displayName}.</h1><p>{email}</p></div>
      <div className="account-score" style={{ background: `radial-gradient(circle,#10141c 58%,transparent 60%),conic-gradient(var(--accent) ${totalPercent}%,#2a303a 0)` }}><strong>{totalPercent}</strong><span>% track complete</span></div>
    </section>
    <section className="account-grid page-width">
      <article className="progress-summary"><span className="overline">NEXT CHECKPOINT</span><h2>{nextLesson.title}</h2><p>{nextLesson.summary}</p><div className="account-progress"><i style={{ width: `${percent}%` }} /></div><div className="account-progress-meta"><span>{nextProgress?.status?.replace("_", " ") ?? "not started"}</span><strong>{percent}%</strong></div><Link href={`/learn/javascript/${nextLesson.slug}`} className="button button-primary">{percent ? "Continue lesson" : "Start lesson"} →</Link></article>
      <aside className="account-stats"><div><span>Plan</span><strong className="plan-name">{entitlement?.status === "active" ? entitlement.plan : "free"}</strong></div><div><span>Latest diagnostic</span><strong>{diagnosticScore === null ? "—" : `${diagnosticScore}%`}</strong></div><div><span>STAR answers ready</span><strong>{starReady}/{starDrafted}</strong></div><div><span>Coding problems</span><strong>{practiceSolved ?? 0}/{practiceTotal ?? 0}</strong></div><div><span>Last-minute blocks</span><strong>{lastMinuteCompleted ?? 0}</strong></div><div><span>Saved questions</span><strong>{bookmarks ?? 0}</strong></div><div><span>Quiz attempts</span><strong>{attempts ?? 0}</strong></div><div><span>Lessons completed</span><strong>{completedLessons}/{lessons.length}</strong></div><div><span>Sprint completed</span><strong>{sprintCompleted ?? 0}/{sprintItems.length}</strong></div><Link href="/diagnostic">Retake diagnostic →</Link><Link href="/last-minute">Open last-minute plan →</Link><Link href="/practice">Continue coding practice →</Link><Link href="/interview">Review interview questions →</Link><Link href="/behavioral">Draft behavioral answers →</Link><Link href="/sprint">Open two-day sprint →</Link></aside>
    </section>
  </main>;
}
