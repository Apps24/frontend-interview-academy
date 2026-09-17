"use client";

import { useState } from "react";

type Question = { id: string; prompt: string; code: string; options: string[]; answer: number; explanation: string };

export function LessonQuiz({ question }: { question: Question }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selected === question.answer;
  function checkAnswer() { if (selected === null) return; window.localStorage.setItem(`answer:${question.id}`, String(selected)); window.localStorage.setItem("progress:variables-and-types", isCorrect ? "100" : "70"); setSubmitted(true); }
  return <section className="quiz-card" aria-labelledby="knowledge-check"><span className="overline accent">KNOWLEDGE CHECK</span><h2 id="knowledge-check">{question.prompt}</h2><pre><code>{question.code}</code></pre><div className="quiz-options">
    {question.options.map((option, index) => { const state = submitted && index === question.answer ? "correct" : submitted && index === selected ? "incorrect" : selected === index ? "selected" : ""; return <button type="button" className={state} key={option} onClick={() => { setSelected(index); setSubmitted(false); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>; })}
  </div>{submitted && <div className={`quiz-feedback ${isCorrect ? "success" : "retry"}`}><strong>{isCorrect ? "Correct — nice work." : "Not quite. Review the reference."}</strong><p>{question.explanation}</p></div>}<button className="button button-primary quiz-submit" type="button" disabled={selected === null} onClick={checkAnswer}>{submitted ? "Check again" : "Check answer"}</button></section>;
}
