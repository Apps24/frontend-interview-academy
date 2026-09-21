import Link from "next/link";

import { LessonQuiz } from "@/components/lesson-quiz";
import { SiteHeader } from "@/components/site-header";
import { difficultyLabel, orderLessons, recordValue, stringList, type LearningLesson, type LearningModule, type LessonContentBlock, type LessonQuestion } from "@/lib/learning";

type Props = { lesson: LearningLesson; currentModule: LearningModule; modules: LearningModule[]; lessons: LearningLesson[]; blocks: LessonContentBlock[]; questions: LessonQuestion[]; isAuthenticated: boolean; initialProgress: number };

function LessonBody({ body }: { body: string }) {
  const parts = body.split("\n").filter(Boolean);
  const list = parts.filter((line) => line.startsWith("- "));
  if (list.length === parts.length && parts.length) return <ul>{list.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
  return <>{parts.map((line) => <p key={line}>{line.replaceAll("**", "")}</p>)}</>;
}

export function JavaScriptLessonView({ lesson, currentModule, modules, lessons, blocks, questions, isAuthenticated, initialProgress }: Props) {
  const orderedLessons = orderLessons(modules, lessons);
  const lessonNumber = orderedLessons.findIndex(({ id }) => id === lesson.id) + 1;
  const objectives = stringList(lesson.objectives);
  const prerequisites = stringList(lesson.prerequisites);
  const nextLesson = orderedLessons[lessonNumber];
  const locked = lesson.access_level === "pro" && blocks.length === 0;

  return <main className="app-shell lesson-shell"><SiteHeader /><div className="lesson-layout page-width">
    <aside className="lesson-sidebar"><Link href="/learn/javascript" className="back-link">← JavaScript track</Link><span className="overline accent">JAVASCRIPT BEGINNER</span><h2>31-lesson path</h2><ol>{orderedLessons.map((item, index) => <li className={item.slug === lesson.slug ? "active" : ""} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><Link href={`/learn/javascript/${item.slug}`}>{item.title}</Link></li>)}</ol><div className="sidebar-progress"><div><span>Lesson progress</span><b>{initialProgress}%</b></div><i><em style={{ width: `${initialProgress}%` }} /></i></div></aside>
    <article className="lesson-content"><div className="lesson-breadcrumb">JavaScript <span>/</span> {currentModule.title} <span>/</span> Lesson {lessonNumber}</div><h1>{lesson.title}</h1><p className="lesson-lead">{lesson.summary}</p><div className="lesson-facts"><span>◷ {lesson.estimated_minutes} min</span><span>◇ {difficultyLabel(lesson.difficulty)}</span><span>{objectives.length} objectives</span><span>{lesson.access_level.toUpperCase()}</span></div>
      {prerequisites.length > 0 && <p className="lesson-prerequisites"><strong>Before you start:</strong> {prerequisites.join(" · ")}</p>}
      <section className="objective-box"><span className="overline">BY THE END, YOU CAN</span><ul>{objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul></section>
      {locked ? <section className="pro-lock"><span className="lock-mark">PRO</span><div><span className="overline accent">LESSON CONTENT LOCKED</span><h2>This advanced lesson is part of Pro.</h2><p>Your position in the 31-lesson path is saved. Payments remain intentionally disconnected, so no checkout is shown yet.</p></div></section> : blocks.map((block) => {
        const meta = recordValue(block.meta);
        const problem = typeof meta.problem === "string" ? meta.problem : null;
        return <section className={`lesson-section content-${block.block_type}`} key={block.id}><span className="section-index">{String(block.position).padStart(2, "0")}</span><h2>{block.title}</h2><LessonBody body={block.body} />{block.code && <div className="code-block"><div><span className="red-dot" /><span className="yellow-dot" /><span className="green-dot" /><small>{block.code_language ?? "javascript"}</small></div><pre><code>{block.code}</code></pre></div>}{problem && <Link href={`/practice/${problem}`} className="button button-secondary">Open coding practice →</Link>}</section>;
      })}
      {!locked && questions.length > 0 && <LessonQuiz questions={questions} lessonSlug={lesson.slug} isAuthenticated={isAuthenticated} initialProgress={initialProgress} />}
      <div className="lesson-footer-nav"><Link href="/learn/javascript" className="button button-secondary">← Track overview</Link>{nextLesson && <Link href={`/learn/javascript/${nextLesson.slug}`} className="button button-primary">Next lesson →</Link>}</div>
    </article>
  </div></main>;
}
