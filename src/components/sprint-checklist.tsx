"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { setSprintItemCompleted } from "@/app/sprint/actions";
import type { SprintItem } from "@/lib/interview-sprint";

type SprintChecklistProps = {
  items: SprintItem[];
  initialCompleted: string[];
  isAuthenticated: boolean;
};

export function SprintChecklist({ items, initialCompleted, isAuthenticated }: SprintChecklistProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const completedSet = new Set(completed);
  const percent = Math.round((completed.length / items.length) * 100);

  function toggle(itemKey: string) {
    if (!isAuthenticated) {
      setMessage("Sign in to save this plan and continue across devices.");
      return;
    }

    const shouldComplete = !completedSet.has(itemKey);
    setCompleted((current) => shouldComplete ? [...current, itemKey] : current.filter((key) => key !== itemKey));
    startTransition(async () => {
      const result = await setSprintItemCompleted(itemKey, shouldComplete);
      setMessage(result.message);
      if (!result.ok) setCompleted((current) => shouldComplete ? current.filter((key) => key !== itemKey) : [...current, itemKey]);
    });
  }

  return <>
    <div className="sprint-meter"><div><span>Overall readiness sprint</span><strong>{completed.length}/{items.length} complete</strong></div><i><em style={{ width: `${percent}%` }} /></i></div>
    {message && <p className="sprint-sync" role="status">{message} {!isAuthenticated && <Link href="/auth">Sign in →</Link>}</p>}
    {[1, 2].map((day) => <section className="sprint-day" key={day}><header><div><span className="overline accent">DAY {day} OF 2</span><h2>{day === 1 ? "Core knowledge & coding" : "Explanation, debugging & rehearsal"}</h2></div><strong>{items.filter((item) => item.day === day).reduce((total, item) => total + item.duration, 0) / 60} hours</strong></header>
      <div className="sprint-task-list">{items.filter((item) => item.day === day).map((item) => {
        const isDone = completedSet.has(item.key);
        return <article className={`sprint-task ${isDone ? "done" : ""}`} key={item.key}><button type="button" className="sprint-check" aria-label={`${isDone ? "Reopen" : "Complete"} ${item.title}`} aria-pressed={isDone} disabled={isPending} onClick={() => toggle(item.key)}>{isDone ? "✓" : ""}</button><time>{item.time}</time><div><span>{item.category} · {item.duration} MIN</span><h3>{item.title}</h3><p>{item.description}</p><small><b>Finish with:</b> {item.outcome}</small>{item.href && <Link href={item.href} className="sprint-task-link">Open workspace →</Link>}</div></article>;
      })}</div>
    </section>)}
  </>;
}
