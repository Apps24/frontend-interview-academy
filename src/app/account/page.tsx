import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { variablesLesson } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My progress" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth?message=Sign%20in%20to%20view%20your%20progress.");

  const [{ data: profile }, { data: progress }, { count: attempts }] = await Promise.all([
    supabase.from("profiles").select("display_name, target_role, experience_level").eq("user_id", userId).maybeSingle(),
    supabase.from("lesson_progress").select("status, percent, updated_at").eq("user_id", userId).eq("lesson_id", variablesLesson.id).maybeSingle(),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const email = String(claimsData.claims.email ?? "");
  const metadata = claimsData.claims.user_metadata as { display_name?: string } | undefined;
  const displayName = profile?.display_name || metadata?.display_name || email.split("@")[0] || "Learner";
  const percent = progress?.percent ?? 0;

  return <main className="app-shell account-shell">
    <SiteHeader />
    <section className="account-hero page-width">
      <div><span className="overline accent">YOUR LEARNING ACCOUNT</span><h1>Welcome back, {displayName}.</h1><p>{email}</p></div>
      <div className="account-score" style={{ background: `radial-gradient(circle,#10141c 58%,transparent 60%),conic-gradient(var(--accent) ${percent}%,#2a303a 0)` }}><strong>{percent}</strong><span>% lesson progress</span></div>
    </section>
    <section className="account-grid page-width">
      <article className="progress-summary"><span className="overline">CURRENT CHECKPOINT</span><h2>{variablesLesson.title}</h2><p>{variablesLesson.summary}</p><div className="account-progress"><i style={{ width: `${percent}%` }} /></div><div className="account-progress-meta"><span>{progress?.status?.replace("_", " ") ?? "not started"}</span><strong>{percent}%</strong></div><Link href="/learn/javascript/variables-and-types" className="button button-primary">{percent ? "Continue lesson" : "Start lesson"} →</Link></article>
      <aside className="account-stats"><div><span>Quiz attempts</span><strong>{attempts ?? 0}</strong></div><div><span>Lessons completed</span><strong>{progress?.status === "completed" ? 1 : 0}</strong></div><div><span>Current plan</span><strong>Free</strong></div></aside>
    </section>
  </main>;
}
