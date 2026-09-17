import Link from "next/link";
import { LessonQuiz } from "@/components/lesson-quiz";
import { SiteHeader } from "@/components/site-header";
import { variablesLesson as lesson } from "@/lib/curriculum";

export default function VariablesAndTypesLesson() {
  return <main className="app-shell lesson-shell"><SiteHeader /><div className="lesson-layout page-width">
    <aside className="lesson-sidebar"><Link href="/" className="back-link">← Dashboard</Link><span className="overline accent">{lesson.track}</span><h2>{lesson.module}</h2><ol><li className="done"><span>✓</span> Values and expressions</li><li className="active"><span>02</span> Variables & data types</li><li><span>03</span> Type conversion</li><li><span>04</span> Operators</li></ol><div className="sidebar-progress"><div><span>Module progress</span><b>25%</b></div><i><em /></i></div></aside>
    <article className="lesson-content"><div className="lesson-breadcrumb">JavaScript <span>/</span> Foundations <span>/</span> Lesson {lesson.order}</div><h1>{lesson.title}</h1><p className="lesson-lead">{lesson.summary}</p><div className="lesson-facts"><span>◷ 12 min</span><span>◇ Beginner</span><span>3 objectives</span></div>
      <section className="objective-box"><span className="overline">BY THE END, YOU CAN</span><ul>{lesson.objectives.map((objective) => <li key={objective}><span>✓</span>{objective}</li>)}</ul></section>
      <section className="lesson-section"><span className="section-index">01</span><h2>Declare intent, not just variables</h2><p>Use <code>const</code> when the binding should not be reassigned. Use <code>let</code> when the binding must point to a different value later. Avoid <code>var</code> in modern application code because its function scope and hoisting behavior are easier to misuse.</p>
        <div className="code-block"><div><span className="red-dot" /><span className="yellow-dot" /><span className="green-dot" /><small>declarations.js</small></div><pre><code><span className="purple">const</span> course = <span className="green">&quot;JavaScript&quot;</span>;<br /><span className="purple">let</span> completedLessons = <span className="orange">3</span>;<br /><br />completedLessons += <span className="orange">1</span>; <span className="muted">{"// valid"}</span><br /><span className="muted">{"// course = \"CSS\"; // TypeError"}</span></code></pre></div>
        <div className="interview-note"><span>INTERVIEW NOTE</span><p><strong>const does not make an object immutable.</strong> It prevents reassignment of the binding. Properties inside the object can still change.</p></div>
      </section>
      <section className="lesson-section"><span className="section-index">02</span><h2>Primitive values and references</h2><p>Primitive values are copied as values. Objects, arrays, and functions are objects; assigning them copies a reference to the same underlying object.</p><div className="comparison-grid"><div><span>PRIMITIVE VALUES</span><h3>Copied by value</h3><p>string · number · bigint · boolean · undefined · symbol · null</p></div><div><span>OBJECT VALUES</span><h3>References are copied</h3><p>objects · arrays · functions · dates · maps · sets</p></div></div></section>
      <LessonQuiz question={lesson.question} /><div className="lesson-footer-nav"><button className="button button-secondary" type="button">← Previous lesson</button><button className="button button-primary" type="button">Complete & continue →</button></div>
    </article>
  </div></main>;
}
