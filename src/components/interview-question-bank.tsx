"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { setInterviewBookmark } from "@/app/interview/actions";
import { difficultyLabels, type InterviewQuestionPreview, type InterviewTopic } from "@/lib/interview";

type Props = {
  questions: InterviewQuestionPreview[];
  topics: InterviewTopic[];
  initialTopic: string;
  initialBookmarks: string[];
  signedIn: boolean;
};

export function InterviewQuestionBank({ questions, topics, initialTopic, initialBookmarks, signedIn }: Props) {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState("all");
  const [access, setAccess] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => new Set(initialBookmarks));
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => questions.filter((question) => {
    const haystack = `${question.title} ${question.shortAnswer} ${question.topic.title}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase()))
      && (topic === "all" || question.topic.slug === topic)
      && (difficulty === "all" || question.difficulty === Number(difficulty))
      && (access === "all" || (access === "free" ? !question.isPremium : question.isPremium))
      && (!savedOnly || bookmarks.has(question.id));
  }), [questions, search, topic, difficulty, access, savedOnly, bookmarks]);

  function toggleBookmark(questionId: string) {
    if (!signedIn) {
      setMessage("Sign in to save questions and build a review list.");
      return;
    }
    const next = !bookmarks.has(questionId);
    setBookmarks((current) => {
      const updated = new Set(current);
      if (next) updated.add(questionId); else updated.delete(questionId);
      return updated;
    });
    setMessage("");
    startTransition(async () => {
      const result = await setInterviewBookmark(questionId, next);
      if (!result.ok) {
        setBookmarks((current) => {
          const updated = new Set(current);
          if (next) updated.delete(questionId); else updated.add(questionId);
          return updated;
        });
      }
      setMessage(result.message);
    });
  }

  return <>
    <section className="question-filters" aria-label="Question filters">
      <label className="question-search"><span>Search the bank</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try closures, CORS, Grid…" /></label>
      <label><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">All topics</option>{topics.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All levels</option><option value="1">Foundation</option><option value="2">Intermediate</option><option value="3">Advanced</option></select></label>
      <label><span>Access</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option value="all">Free & Pro</option><option value="free">Free</option><option value="pro">Pro</option></select></label>
      <button className={`saved-filter ${savedOnly ? "active" : ""}`} type="button" onClick={() => setSavedOnly((value) => !value)}>★ Saved</button>
    </section>
    <div className="question-results-head"><span>{filtered.length} question{filtered.length === 1 ? "" : "s"}</span>{message && <span role="status">{message}</span>}</div>
    <section className="question-list" aria-live="polite">
      {filtered.map((question) => <article className="question-card" key={question.id}>
        <div className="question-card-top"><div className="question-badges"><span>{question.topic.title}</span><span>{difficultyLabels[question.difficulty]}</span><span className={question.isPremium ? "pro-badge" : "free-badge"}>{question.isPremium ? "PRO" : "FREE"}</span></div><button type="button" disabled={pending} aria-label={bookmarks.has(question.id) ? "Remove bookmark" : "Save question"} aria-pressed={bookmarks.has(question.id)} onClick={() => toggleBookmark(question.id)}>{bookmarks.has(question.id) ? "★" : "☆"}</button></div>
        <h2><Link href={`/interview/${question.slug}`}>{question.title}</Link></h2>
        <p>{question.shortAnswer}</p>
        <Link className="question-open" href={`/interview/${question.slug}`}>Open answer <span>→</span></Link>
      </article>)}
      {filtered.length === 0 && <div className="empty-state"><h2>No matching questions</h2><p>Try a broader search or reset one of the filters.</p></div>}
    </section>
  </>;
}
