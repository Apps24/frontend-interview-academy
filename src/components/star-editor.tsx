"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { deleteStarDraft, saveStarDraft } from "@/app/behavioral/actions";
import { countWords, formatSpeakingTime, reviewStarDraft, starCompleteness, starFieldLimits, starFields, starWordCount, type StarDraft } from "@/lib/behavioral";

export function StarEditor({ questionId, initialDraft, signedIn }: { questionId: string; initialDraft: StarDraft; signedIn: boolean }) {
  const [draft, setDraft] = useState(initialDraft);
  const [mode, setMode] = useState<"write" | "rehearse">("write");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const words = starWordCount(draft);
  const complete = starCompleteness(draft);
  const feedback = useMemo(() => reviewStarDraft(draft), [draft]);
  const hasContent = words > 0;

  function update(key: keyof StarDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save(status: StarDraft["status"]) {
    const next = { ...draft, status };
    setDraft(next);
    if (!signedIn) {
      setMessage("Draft kept for this visit. Sign in to save it across devices.");
      return;
    }
    startTransition(async () => {
      const result = await saveStarDraft(questionId, next);
      setMessage(result.message);
    });
  }

  function clear() {
    setDraft({ situation: "", task: "", action: "", result: "", status: "draft" });
    setMode("write");
    if (!signedIn) {
      setMessage("Cleared.");
      return;
    }
    startTransition(async () => {
      const result = await deleteStarDraft(questionId);
      setMessage(result.message);
    });
  }

  return <section className="star-editor" aria-label="STAR answer workspace">
    <header className="star-toolbar">
      <div><span className="status-dot" /><strong>Your STAR answer</strong><span className={`star-status ${draft.status}`}>{draft.status === "ready" ? "Ready to tell" : "Draft"}</span></div>
      <div className="star-mode" role="tablist" aria-label="Editor mode"><button type="button" role="tab" aria-selected={mode === "write"} onClick={() => setMode("write")}>Write</button><button type="button" role="tab" aria-selected={mode === "rehearse"} onClick={() => setMode("rehearse")} disabled={!hasContent}>Rehearse</button></div>
    </header>

    <div className="star-meter" aria-hidden="true">{starFields.map(({ key }) => <i key={key} className={countWords(draft[key]) >= 8 ? "filled" : ""} />)}</div>
    <div className="star-meta"><span>{complete}/4 sections</span><span>{words} words</span><span>≈ {formatSpeakingTime(words)} spoken</span></div>

    {mode === "write" ? <div className="star-fields">
      {starFields.map(({ key, label, hint, placeholder, targetShare }) => <label key={key} className="star-field">
        <div><span className="star-label">{label}</span><small>{targetShare} of the answer</small><em>{countWords(draft[key])} words</em></div>
        <p>{hint}</p>
        <textarea value={draft[key]} maxLength={starFieldLimits[key]} placeholder={placeholder} rows={key === "action" ? 7 : 4} onChange={(event) => update(key, event.target.value)} />
      </label>)}
    </div> : <article className="star-script">
      <span className="overline accent">SPOKEN SCRIPT</span>
      <h3>Read this aloud once at normal pace. Then close it and tell the story from memory.</h3>
      {starFields.map(({ key, label }) => draft[key].trim() && <section key={key}><b>{label}</b>{draft[key].split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>)}
    </article>}

    <aside className="star-feedback" aria-live="polite"><span className="overline">INSTANT REVIEW</span><ul>{feedback.map((item) => <li key={item.message} className={item.tone}>{item.message}</li>)}</ul></aside>

    <div className="workspace-actions">
      <button type="button" className="button button-secondary" onClick={clear} disabled={pending || !hasContent}>Clear</button>
      <button type="button" className="button button-secondary" onClick={() => save("draft")} disabled={pending || !hasContent}>Save draft</button>
      <button type="button" className={`button solved-button ${draft.status === "ready" ? "is-solved" : ""}`} onClick={() => save(draft.status === "ready" ? "draft" : "ready")} disabled={pending || complete < 4}>{draft.status === "ready" ? "✓ Ready to tell" : "Mark ready"}</button>
    </div>
    {!signedIn && <p className="workspace-signin"><Link href="/auth">Sign in</Link> to keep your answers across devices and see them on your dashboard.</p>}
    {message && <p className="workspace-message" role="status">{message}</p>}
  </section>;
}
