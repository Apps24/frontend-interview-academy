"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { saveLastMinutePlan, setLastMinuteTaskComplete } from "@/app/last-minute/actions";
import { buildLastMinutePlan, focusTopicOptions, type FocusTopic, type LastMinuteConfig, type PlanDuration } from "@/lib/last-minute-plan";

export function LastMinutePlanner({ initialConfig, initialCompleted, signedIn }: { initialConfig: LastMinuteConfig; initialCompleted: string[]; signedIn: boolean }) {
  const [draft, setDraft] = useState(initialConfig);
  const [config, setConfig] = useState(initialConfig);
  const [completed, setCompleted] = useState(() => new Set(initialCompleted));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const tasks = useMemo(() => buildLastMinutePlan(config), [config]);
  const completedCount = tasks.filter(({ key }) => completed.has(key)).length;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);
  const timedTasks = tasks.map((task, index) => {
    const start = tasks.slice(0, index).reduce((sum, item) => sum + item.minutes, 0);
    return { task, start, end: start + task.minutes };
  });

  function toggleTopic(topic: FocusTopic) {
    setDraft((current) => {
      const hasTopic = current.focusTopics.includes(topic);
      if (hasTopic && current.focusTopics.length === 1) return current;
      if (!hasTopic && current.focusTopics.length === 4) return current;
      return { ...current, focusTopics: hasTopic ? current.focusTopics.filter((value) => value !== topic) : [...current.focusTopics, topic] };
    });
  }

  function generate() {
    setConfig(draft);
    setMessage(signedIn ? "Saving your focused plan…" : "Plan generated locally. Sign in to save it across devices.");
    startTransition(async () => {
      const result = await saveLastMinutePlan(draft);
      setMessage(result.message);
    });
  }

  function toggleTask(key: string) {
    const next = !completed.has(key);
    setCompleted((current) => {
      const updated = new Set(current);
      if (next) updated.add(key); else updated.delete(key);
      return updated;
    });
    if (!signedIn) {
      setMessage("Progress is active for this visit. Sign in to keep it across devices.");
      return;
    }
    startTransition(async () => {
      const result = await setLastMinuteTaskComplete(key, next);
      if (!result.ok) setCompleted((current) => { const updated = new Set(current); if (next) updated.delete(key); else updated.add(key); return updated; });
      setMessage(result.message);
    });
  }

  return <div className="last-minute-grid">
    <aside className="planner-config">
      <span className="overline accent">BUILD YOUR PLAN</span><h2>Only keep what moves the score.</h2>
      <label><span>Target role</span><input value={draft.targetRole} maxLength={80} onChange={(event) => setDraft((current) => ({ ...current, targetRole: event.target.value }))} /></label>
      <fieldset><legend>Time available</legend><div className="duration-options">{([1, 2, 4, 8] as PlanDuration[]).map((hours) => <button type="button" className={draft.durationHours === hours ? "active" : ""} onClick={() => setDraft((current) => ({ ...current, durationHours: hours }))} key={hours}>{hours}h</button>)}</div></fieldset>
      <fieldset><legend>Weakest topics · choose up to 4</legend><div className="focus-options">{focusTopicOptions.map((topic) => <button type="button" aria-pressed={draft.focusTopics.includes(topic.slug)} onClick={() => toggleTopic(topic.slug)} key={topic.slug}>{topic.label}</button>)}</div></fieldset>
      <label><span>Interview time · optional</span><input type="datetime-local" value={draft.interviewAt?.slice(0, 16) ?? ""} onChange={(event) => setDraft((current) => ({ ...current, interviewAt: event.target.value || null }))} /></label>
      <button type="button" className="button button-primary" onClick={generate} disabled={pending}>Generate focused plan →</button>
      {message && <p role="status">{message}</p>}
    </aside>
    <section className="generated-plan">
      <header><div><span className="overline">YOUR LAST-MINUTE PLAN</span><h2>{config.durationHours}-hour {config.targetRole} reset</h2><p>{tasks.length} focused blocks · {totalMinutes} planned minutes</p></div><div className="plan-score"><strong>{completedCount}/{tasks.length}</strong><span>complete</span></div></header>
      <div className="last-minute-meter"><i style={{ width: `${tasks.length ? completedCount / tasks.length * 100 : 0}%` }} /></div>
      <div className="generated-tasks">{timedTasks.map(({ task, start, end }) => { const done = completed.has(task.key); return <article className={done ? "done" : ""} key={task.key}><button type="button" onClick={() => toggleTask(task.key)} disabled={pending} aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}>{done ? "✓" : ""}</button><time>T+{start}–{end}m</time><div><span>{task.category}</span><h3>{task.title}</h3><p>{task.description}</p><small><b>Finish with:</b> {task.outcome}</small>{task.href && <Link href={task.href}>Open practice material →</Link>}</div></article>; })}</div>
    </section>
  </div>;
}
