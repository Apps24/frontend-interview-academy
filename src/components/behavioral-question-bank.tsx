"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { behavioralDifficultyLabels, type BehavioralCategory, type BehavioralQuestionPreview } from "@/lib/behavioral";

type DraftSummary = Record<string, "draft" | "ready">;

type Props = {
  questions: BehavioralQuestionPreview[];
  categories: BehavioralCategory[];
  initialCategory: string;
  drafts: DraftSummary;
  signedIn: boolean;
};

export function BehavioralQuestionBank({ questions, categories, initialCategory, drafts, signedIn }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [access, setAccess] = useState("all");
  const [progress, setProgress] = useState("all");

  const filtered = useMemo(() => questions.filter((question) => {
    const haystack = `${question.title} ${question.whyAsked} ${question.category.title}`.toLowerCase();
    const state = drafts[question.id] ?? "none";
    return (!search || haystack.includes(search.toLowerCase()))
      && (category === "all" || question.category.slug === category)
      && (access === "all" || (access === "free" ? !question.isPremium : question.isPremium))
      && (progress === "all" || progress === state);
  }), [questions, search, category, access, progress, drafts]);

  return <>
    <section className="question-filters" aria-label="Question filters">
      <label className="question-search"><span>Search the bank</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try conflict, deadline, mentoring…" /></label>
      <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      <label><span>Access</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option value="all">Free & Pro</option><option value="free">Free</option><option value="pro">Pro</option></select></label>
      <label><span>My answers</span><select value={progress} onChange={(event) => setProgress(event.target.value)} disabled={!signedIn}><option value="all">Everything</option><option value="none">Not started</option><option value="draft">Drafted</option><option value="ready">Ready to tell</option></select></label>
    </section>
    <div className="question-results-head"><span>{filtered.length} question{filtered.length === 1 ? "" : "s"}</span>{!signedIn && <span><Link href="/auth">Sign in</Link> to save STAR answers</span>}</div>
    <section className="question-list" aria-live="polite">
      {filtered.map((question) => { const state = drafts[question.id]; return <article className="question-card" key={question.id}>
        <div className="question-card-top"><div className="question-badges"><span>{question.category.title}</span><span>{behavioralDifficultyLabels[question.difficulty]}</span><span className={question.isPremium ? "pro-badge" : "free-badge"}>{question.isPremium ? "PRO" : "FREE"}</span></div>{state && <span className={`draft-pill ${state}`}>{state === "ready" ? "✓ Ready" : "Draft"}</span>}</div>
        <h2><Link href={`/behavioral/${question.slug}`}>{question.title}</Link></h2>
        <p>{question.whyAsked}</p>
        <Link className="question-open" href={`/behavioral/${question.slug}`}>{state ? "Continue your answer" : "Draft your answer"} <span>→</span></Link>
      </article>; })}
      {filtered.length === 0 && <div className="empty-state"><h2>No matching questions</h2><p>Try a broader search or reset one of the filters.</p></div>}
    </section>
  </>;
}
