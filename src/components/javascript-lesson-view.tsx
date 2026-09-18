import Link from "next/link";

import { LessonQuiz } from "@/components/lesson-quiz";
import { SiteHeader } from "@/components/site-header";
import { javascriptLessons, type JavaScriptLesson } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";

export async function JavaScriptLessonView({ lesson }: { lesson: JavaScriptLesson }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { data: progress } = userId
    ? await supabase.from("lesson_progress").select("percent").eq("user_id", userId).eq("lesson_id", lesson.id).maybeSingle()
    : { data: null };
  const progressPercent = progress?.percent ?? 0;

  return <main className="app-shell lesson-shell">
    <SiteHeader />
    <div className="lesson-layout page-width">
      <aside className="lesson-sidebar">
        <Link href="/learn/javascript" className="back-link">← JavaScript track</Link>
        <span className="overline accent">{lesson.track}</span><h2>{lesson.module}</h2>
        <ol>{javascriptLessons.map((item) => <li className={item.slug === lesson.slug ? "active" : ""} key={item.id}><span>{String(item.order).padStart(2, "0")}</span><Link href={`/learn/javascript/${item.slug}`}>{item.title}</Link></li>)}</ol>
        <div className="sidebar-progress"><div><span>Lesson progress</span><b>{progressPercent}%</b></div><i><em style={{ width: `${progressPercent}%` }} /></i></div>
      </aside>
      <article className="lesson-content">
        <div className="lesson-breadcrumb">JavaScript <span>/</span> Foundations <span>/</span> Lesson {lesson.order}</div>
        <h1>{lesson.title}</h1><p className="lesson-lead">{lesson.summary}</p>
        <div className="lesson-facts"><span>◷ {lesson.estimatedMinutes} min</span><span>◇ {lesson.difficulty}</span><span>{lesson.objectives.length} objectives</span></div>
        <section className="objective-box"><span className="overline">BY THE END, YOU CAN</span><ul>{lesson.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul></section>
        {lesson.sections.map((section, index) => <section className="lesson-section" key={section.title}>
          <span className="section-index">{String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2><p>{section.body}</p>
          {section.code && <div className="code-block"><div><span className="red-dot" /><span className="yellow-dot" /><span className="green-dot" /><small>example.js</small></div><pre><code>{section.code}</code></pre></div>}
          {section.interviewNote && <div className="interview-note"><span>INTERVIEW NOTE</span><p>{section.interviewNote}</p></div>}
        </section>)}
        <LessonQuiz question={lesson.question} lessonSlug={lesson.slug} isAuthenticated={Boolean(userId)} initialProgress={progressPercent} />
      </article>
    </div>
  </main>;
}
