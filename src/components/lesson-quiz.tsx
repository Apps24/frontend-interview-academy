"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { completeLesson, submitQuizAnswer } from "@/app/learn/javascript/actions";

type Question = { id: string; prompt: string; code: string; options: string[]; answer: number; explanation: string };

type LessonQuizProps = {
  question: Question;
  lessonSlug: string;
  isAuthenticated: boolean;
  initialProgress: number;
};

export function LessonQuiz({ question, lessonSlug, isAuthenticated, initialProgress }: LessonQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [syncMessage, setSyncMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (selected === null) return;
    setSubmitted(true);
    if (!isAuthenticated) {
      setSyncMessage("Sign in to save this attempt and continue on any device.");
      return;
    }

    startTransition(async () => {
      const result = await submitQuizAnswer(lessonSlug, selected);
      setSyncMessage(result.message);
      if (result.percent !== undefined) setProgress(result.percent);
    });
  }

  function finishLesson() {
    if (!isAuthenticated) {
      setSyncMessage("Sign in to save lesson completion.");
      return;
    }
    startTransition(async () => {
      const result = await completeLesson(lessonSlug);
      setSyncMessage(result.message);
      if (result.percent !== undefined) setProgress(result.percent);
    });
  }

  return <><section className="quiz-card" aria-labelledby="knowledge-check"><span className="overline accent">KNOWLEDGE CHECK</span><h2 id="knowledge-check">{question.prompt}</h2><pre><code>{question.code}</code></pre><div className="quiz-options">
    {question.options.map((option, index) => { const state = submitted && index === question.answer ? "correct" : submitted && index === selected ? "incorrect" : selected === index ? "selected" : ""; return <button type="button" className={state} key={option} onClick={() => { setSelected(index); setSubmitted(false); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>; })}
  </div>{submitted && <div className={`quiz-feedback ${isCorrect ? "success" : "retry"}`}><strong>{isCorrect ? "Correct — nice work." : "Not quite. Review the reference."}</strong><p>{question.explanation}</p></div>}{syncMessage && <p className="sync-message" role="status">{syncMessage} {!isAuthenticated && <Link href="/auth">Sign in →</Link>}</p>}<button className="button button-primary quiz-submit" type="button" disabled={selected === null || isPending} onClick={checkAnswer}>{isPending ? "Saving…" : submitted ? "Check again" : "Check answer"}</button></section>
  <div className="lesson-footer-nav"><Link href="/learn/javascript" className="button button-secondary">← Track overview</Link><button className="button button-primary" type="button" disabled={isPending || (progress === 0 && !submitted)} onClick={finishLesson}>{progress === 100 ? "Completed ✓" : "Complete & continue →"}</button></div></>;
}
