import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodingWorkspace } from "@/components/coding-workspace";
import { SiteHeader } from "@/components/site-header";
import { practiceDifficulty, type PracticeTest } from "@/lib/practice";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Coding challenge" };

export default async function PracticeProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: problem } = await supabase.from("practice_problems").select("id, title, prompt, topic, difficulty, estimated_minutes, starter_code, test_cases, hints, is_premium").eq("slug", slug).maybeSingle();
  if (!problem) notFound();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const [{ data: progress }, { data: solution }] = await Promise.all([
    userId ? supabase.from("practice_progress").select("status, last_code, attempts").eq("user_id", userId).eq("problem_id", problem.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("practice_solutions").select("solution_code, explanation, complexity").eq("problem_id", problem.id).maybeSingle(),
  ]);
  const tests = Array.isArray(problem.test_cases) ? problem.test_cases.filter((test): test is PracticeTest => typeof test === "object" && test !== null && "label" in test && "expression" in test && "expected" in test) : [];
  const hints = Array.isArray(problem.hints) ? problem.hints.filter((hint): hint is string => typeof hint === "string") : [];

  return <main className="app-shell problem-page"><SiteHeader /><div className="problem-layout page-width"><section className="problem-brief"><Link href="/practice" className="back-link">← All coding challenges</Link><div className="question-badges"><span>{problem.topic}</span><span>{practiceDifficulty[problem.difficulty]}</span><span>{problem.estimated_minutes} MIN</span><span className={problem.is_premium ? "pro-badge" : "free-badge"}>{problem.is_premium ? "PRO" : "FREE"}</span></div><h1>{problem.title}</h1><p>{problem.prompt}</p>{hints.length > 0 && <details className="problem-hints"><summary>Need a hint?</summary><ol>{hints.map((hint) => <li key={hint}>{hint}</li>)}</ol></details>}<div className="problem-cases"><span className="overline">VISIBLE TESTS</span>{tests.length ? tests.map((test) => <div key={test.label}><strong>{test.label}</strong><code>{test.expression}</code><small>Expected: {JSON.stringify(test.expected)}</small></div>) : <p>This advanced problem is reviewed manually because timing and asynchronous behavior are part of the solution.</p>}</div></section><section className="problem-work"><CodingWorkspace problemId={problem.id} starterCode={problem.starter_code} savedCode={progress?.last_code || null} tests={tests} initialSolved={progress?.status === "solved"} signedIn={Boolean(userId)} />{solution ? <details className="solution-panel"><summary>Reveal reference solution</summary><div className="answer-code"><div><span /><span /><span /><small>reference solution</small></div><pre><code>{solution.solution_code}</code></pre></div><p>{solution.explanation}</p><strong>{solution.complexity}</strong></details> : <section className="solution-lock"><span>PRO</span><div><h2>Reference solution locked</h2><p>Solve it first, then compare your approach when Pro access is available. Stripe remains intentionally disconnected for now.</p></div></section>}</section></div></main>;
}
