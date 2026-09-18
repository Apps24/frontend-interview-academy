"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { submitDiagnostic } from "@/app/diagnostic/actions";
import type { DiagnosticQuestion, DiagnosticResult, DiagnosticTopic } from "@/lib/diagnostic-types";

const interviewTopic: Record<DiagnosticTopic, string> = { javascript: "javascript", browser: "browser-web", "html-accessibility": "html-accessibility", css: "css" };

export function DiagnosticAssessment({ questions, signedIn, latestScore }: { questions: DiagnosticQuestion[]; signedIn: boolean; latestScore: number | null }) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const question = questions[current];
  const answered = Object.keys(selections).length;

  function finish() {
    setMessage("");
    startTransition(async () => {
      const response = await submitDiagnostic(selections);
      if (!response.ok) {
        setMessage(response.message);
        return;
      }
      setResult(response.result);
      setMessage(response.saved ? "Result saved to your account." : signedIn ? "Your score is ready, but attempt history could not be saved." : "Your score is ready. Sign in to save future attempts.");
    });
  }

  function restart() {
    setSelections({});
    setCurrent(0);
    setResult(null);
    setMessage("");
    setStarted(true);
  }

  if (!started) return <section className="diagnostic-start"><div className="diagnostic-start-copy"><span className="overline accent">12 QUESTIONS · ABOUT 8 MINUTES</span><h2>Find the gaps before choosing what to study.</h2><p>This is a focused baseline, not trivia. You will get a topic-by-topic score and direct links to the material with the highest likely return.</p><ul><li>JavaScript fundamentals and async behavior</li><li>Browser networking, rendering, and storage</li><li>Semantic HTML and accessibility</li><li>CSS layout, cascade, and stacking</li></ul><button type="button" className="button button-primary" onClick={() => setStarted(true)}>Start diagnostic →</button></div><aside><span className="overline">YOUR HISTORY</span>{latestScore === null ? <><strong>First run</strong><p>Sign in to keep attempts and compare future scores.</p></> : <><strong>{latestScore}%</strong><p>Your latest saved diagnostic score.</p></>}</aside></section>;

  if (result) {
    const plannerTopics = result.weakTopics.length ? result.weakTopics.join(",") : "coding,behavioral";
    return <section className="diagnostic-results"><header><div className="result-ring" style={{ background: `radial-gradient(circle,#11151d 57%,transparent 59%),conic-gradient(var(--accent) ${result.percentage}%,#2b313b 0)` }}><strong>{result.percentage}</strong><span>/100</span></div><div><span className="overline accent">DIAGNOSTIC COMPLETE</span><h2>{result.percentage >= 80 ? "Strong base. Sharpen the edges." : result.percentage >= 60 ? "Good base. Close the visible gaps." : "Focus beats covering everything."}</h2><p>{result.totalCorrect} of {result.totalQuestions} correct. {message}</p></div></header><div className="topic-score-grid">{result.topicScores.map((score) => <article key={score.topic}><div><span>{score.label}</span><strong>{score.percentage}%</strong></div><i><em style={{ width: `${score.percentage}%` }} /></i><small>{score.correct}/{score.total} correct</small></article>)}</div><section className="diagnostic-recommendations"><span className="overline">NEXT BEST ACTIONS</span><h3>{result.weakTopics.length ? "Start with your lowest-scoring topics" : "No weak topic detected—switch to application"}</h3><div>{result.weakTopics.map((topic) => { const score = result.topicScores.find((item) => item.topic === topic); return <Link href={`/interview?topic=${interviewTopic[topic]}`} key={topic}><span>{score?.label}</span><strong>Review focused answers →</strong></Link>; })}<Link href={`/last-minute?topics=${plannerTopics}`}><span>Personalized schedule</span><strong>Build from these results →</strong></Link><Link href="/practice"><span>Coding application</span><strong>Solve a timed problem →</strong></Link></div></section><details className="diagnostic-review"><summary>Review all answers</summary>{result.breakdown.map((item, index) => { const reviewed = questions.find(({ id }) => id === item.questionId)!; return <article className={item.correct ? "correct" : "incorrect"} key={item.questionId}><span>{item.correct ? "✓" : "×"}</span><div><strong>{index + 1}. {reviewed.prompt}</strong><p>Your answer: {item.selectedIndex >= 0 ? reviewed.options[item.selectedIndex] : "No answer"}</p>{!item.correct && <p>Correct answer: {reviewed.options[item.correctIndex]}</p>}<small>{item.explanation}</small></div></article>; })}</details><button type="button" className="button button-secondary" onClick={restart}>Retake diagnostic</button></section>;
  }

  return <section className="diagnostic-card"><header><div><span className="overline">QUESTION {current + 1} OF {questions.length}</span><strong>{question.topicLabel}</strong></div><span>{answered}/{questions.length} answered</span></header><div className="diagnostic-meter"><i style={{ width: `${(current + 1) / questions.length * 100}%` }} /></div><div className="diagnostic-question"><span className="difficulty-label">{["", "FOUNDATION", "INTERMEDIATE", "ADVANCED"][question.difficulty]}</span><h2>{question.prompt}</h2>{question.code && <pre><code>{question.code}</code></pre>}<div className="diagnostic-options">{question.options.map((option, index) => <button type="button" className={selections[question.id] === index ? "selected" : ""} onClick={() => setSelections((currentSelections) => ({ ...currentSelections, [question.id]: index }))} key={option}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><footer><button type="button" className="button button-secondary" onClick={() => setCurrent((value) => value - 1)} disabled={current === 0}>← Previous</button>{current < questions.length - 1 ? <button type="button" className="button button-primary" onClick={() => setCurrent((value) => value + 1)} disabled={selections[question.id] === undefined}>Next →</button> : <button type="button" className="button button-primary" onClick={finish} disabled={answered !== questions.length || pending}>{pending ? "Scoring…" : "Finish & score"}</button>}</footer>{message && <p className="diagnostic-message" role="alert">{message}</p>}</section>;
}
