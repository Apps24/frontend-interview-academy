"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { practiceDifficulty, type PracticeProblemPreview } from "@/lib/practice";

export function PracticeCatalog({ problems }: { problems: PracticeProblemPreview[] }) {
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const topics = useMemo(() => [...new Set(problems.map((problem) => problem.topic))], [problems]);
  const filtered = problems.filter((problem) => (topic === "all" || problem.topic === topic)
    && (difficulty === "all" || problem.difficulty === Number(difficulty))
    && (status === "all" || problem.progress === status));

  return <>
    <section className="practice-filters" aria-label="Practice filters">
      <label><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{topics.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All levels</option><option value="1">Foundation</option><option value="2">Intermediate</option><option value="3">Advanced</option></select></label>
      <label><span>Progress</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Any progress</option><option value="not_started">Not started</option><option value="started">In progress</option><option value="solved">Solved</option></select></label>
      <span>{filtered.length} challenge{filtered.length === 1 ? "" : "s"}</span>
    </section>
    <section className="practice-grid">
      {filtered.map((problem, index) => <article className="practice-card" key={problem.id}>
        <div className="practice-card-index">{String(index + 1).padStart(2, "0")}</div>
        <div className="question-badges"><span>{problem.topic}</span><span>{practiceDifficulty[problem.difficulty]}</span><span className={problem.isPremium ? "pro-badge" : "free-badge"}>{problem.isPremium ? "PRO" : "FREE"}</span>{problem.progress !== "not_started" && <span className="progress-badge">{problem.progress === "solved" ? "✓ SOLVED" : "IN PROGRESS"}</span>}</div>
        <h2>{problem.title}</h2><p>{problem.summary}</p>
        <div className="practice-card-footer"><span>~{problem.estimatedMinutes} min</span><Link href={`/practice/${problem.slug}`}>{problem.progress === "not_started" ? "Start challenge" : "Continue"} →</Link></div>
      </article>)}
    </section>
  </>;
}
