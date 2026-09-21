"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { submitQuizAnswer } from "@/app/learn/javascript/actions";
import { recordValue, stringList, type LessonQuestion } from "@/lib/learning";

type Props = { questions: LessonQuestion[]; lessonSlug: string; isAuthenticated: boolean; initialProgress: number };

export function LessonQuiz({ questions, lessonSlug, isAuthenticated, initialProgress }: Props) {
  const [answers, setAnswers] = useState<Record<string, number[] | string>>({});
  const [feedback, setFeedback] = useState<Record<string, { correct: boolean; message: string; rationale?: string }>>({});
  const [progress, setProgress] = useState(initialProgress);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function choose(question: LessonQuestion, index: number) {
    setFeedback((current) => { const next = { ...current }; delete next[question.id]; return next; });
    setAnswers((current) => {
      if (question.question_type !== "multi_choice") return { ...current, [question.id]: [index] };
      const selected = Array.isArray(current[question.id]) ? current[question.id] as number[] : [];
      return { ...current, [question.id]: selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index] };
    });
  }

  function check(question: LessonQuestion) {
    const response = answers[question.id];
    if (response === undefined || (Array.isArray(response) && response.length === 0)) return;
    setPendingId(question.id);
    startTransition(async () => {
      const result = await submitQuizAnswer(lessonSlug, question.id, response);
      setFeedback((current) => ({ ...current, [question.id]: { correct: Boolean(result.isCorrect), message: result.message, rationale: result.rationale } }));
      if (result.percent !== undefined) setProgress(result.percent);
      setPendingId(null);
    });
  }

  return <section className="quiz-set" aria-labelledby="knowledge-check"><span className="overline accent">KNOWLEDGE CHECK</span><h2 id="knowledge-check">Test the mental model</h2><p>Complete all {questions.length} questions to finish this lesson. Answers are graded securely on the server.</p>
    {questions.map((question, questionIndex) => {
      const payload = recordValue(question.payload);
      const options = stringList(payload.options);
      const code = typeof payload.code === "string" ? payload.code : "";
      const selected = answers[question.id];
      const result = feedback[question.id];
      return <article className="quiz-card" key={question.id}><span className="overline">QUESTION {questionIndex + 1} OF {questions.length}</span><h3>{question.prompt}</h3>{code && <pre><code>{code}</code></pre>}
        {options.length > 0 ? <div className="quiz-options">{options.map((option, index) => {
          const active = Array.isArray(selected) && selected.includes(index);
          return <button type="button" className={active ? "selected" : ""} key={option} disabled={isPending} onClick={() => choose(question, index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>;
        })}</div> : <label className="output-answer"><span>Your output</span><textarea value={typeof selected === "string" ? selected : ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Enter one value per line" /></label>}
        {result && <div className={`quiz-feedback ${result.correct ? "success" : "retry"}`}><strong>{result.correct ? "Correct — nice work." : "Not quite — try again."}</strong>{result.rationale && <p>{result.rationale}</p>}<p>{result.message}</p></div>}
        <button className="button button-primary quiz-submit" type="button" disabled={selected === undefined || isPending} onClick={() => check(question)}>{isPending && pendingId === question.id ? "Checking…" : "Check answer"}</button>
      </article>;
    })}
    <p className="sync-message" role="status">Lesson progress: <strong>{progress}%</strong>{!isAuthenticated && <> · <Link href="/auth">Sign in to grade and save answers →</Link></>}</p>
  </section>;
}
