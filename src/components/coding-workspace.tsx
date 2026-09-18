"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { savePracticeProgress } from "@/app/practice/actions";
import type { PracticeTest } from "@/lib/practice";

type TestResult = { label: string; passed: boolean; actual?: unknown; error?: string };

const workerSource = `
self.onmessage = async function (event) {
  try {
    self.fetch = function () { throw new Error("Network access is disabled in practice tests."); };
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const run = new AsyncFunction('"use strict";\\n' + event.data.code + '\\nreturn await (' + event.data.expression + ');');
    const value = await run();
    self.postMessage({ ok: true, value: value });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};`;

function executeTest(code: string, test: PracticeTest): Promise<TestResult> {
  return new Promise((resolve) => {
    const blob = new Blob([workerSource], { type: "text/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    const cleanUp = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    const timer = window.setTimeout(() => {
      cleanUp();
      resolve({ label: test.label, passed: false, error: "Timed out after 2 seconds" });
    }, 2000);
    worker.onmessage = (event: MessageEvent<{ ok: boolean; value?: unknown; error?: string }>) => {
      window.clearTimeout(timer);
      cleanUp();
      const passed = event.data.ok && JSON.stringify(event.data.value) === JSON.stringify(test.expected);
      resolve({ label: test.label, passed, actual: event.data.value, error: event.data.error });
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      cleanUp();
      resolve({ label: test.label, passed: false, error: "The code could not be evaluated." });
    };
    worker.postMessage({ code, expression: test.expression });
  });
}

export function CodingWorkspace({ problemId, starterCode, savedCode, tests, initialSolved, signedIn }: { problemId: string; starterCode: string; savedCode: string | null; tests: PracticeTest[]; initialSolved: boolean; signedIn: boolean }) {
  const [code, setCode] = useState(savedCode || starterCode);
  const [results, setResults] = useState<TestResult[]>([]);
  const [message, setMessage] = useState("");
  const [solved, setSolved] = useState(initialSolved);
  const [running, setRunning] = useState(false);
  const [pending, startTransition] = useTransition();

  async function runTests() {
    if (tests.length === 0) {
      setMessage("This advanced challenge uses manual review. Compare your approach with the solution when available.");
      return;
    }
    setRunning(true);
    setMessage("");
    const nextResults = await Promise.all(tests.map((test) => executeTest(code, test)));
    setResults(nextResults);
    setRunning(false);
    const allPassed = nextResults.every(({ passed }) => passed);
    if (allPassed) setMessage(signedIn ? "All tests passed. You can mark this problem solved." : "All tests passed. Sign in to save this result.");
    if (signedIn) startTransition(async () => { await savePracticeProgress(problemId, code, false, true); });
  }

  function save(markSolved: boolean) {
    if (!signedIn) {
      setMessage("Sign in to save your code and completion status.");
      return;
    }
    startTransition(async () => {
      const result = await savePracticeProgress(problemId, code, markSolved);
      if (result.ok && markSolved) setSolved(true);
      setMessage(result.message);
    });
  }

  return <section className="coding-workspace">
    <div className="editor-toolbar"><div><span className="status-dot" /><strong>JavaScript workspace</strong></div><span>{code.length} characters</span></div>
    <textarea aria-label="JavaScript solution" spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} />
    <div className="workspace-actions"><button type="button" className="button button-secondary" onClick={() => { setCode(starterCode); setResults([]); }}>Reset</button><button type="button" className="button button-secondary" onClick={() => save(false)} disabled={pending}>Save draft</button><button type="button" className="button button-primary" onClick={runTests} disabled={running}>{running ? "Running…" : tests.length ? "Run tests" : "Review manually"}</button><button type="button" className={`button solved-button ${solved ? "is-solved" : ""}`} onClick={() => save(true)} disabled={pending}>{solved ? "✓ Solved" : "Mark solved"}</button></div>
    {!signedIn && <p className="workspace-signin"><Link href="/auth">Sign in</Link> to keep drafts and solved progress across devices.</p>}
    {message && <p className="workspace-message" role="status">{message}</p>}
    {results.length > 0 && <div className="test-results">{results.map((result) => <div className={result.passed ? "passed" : "failed"} key={result.label}><span>{result.passed ? "✓" : "×"}</span><div><strong>{result.label}</strong>{!result.passed && <small>{result.error || `Received ${JSON.stringify(result.actual)}`}</small>}</div></div>)}</div>}
  </section>;
}
