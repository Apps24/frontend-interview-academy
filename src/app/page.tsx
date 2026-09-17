import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { tracks } from "@/lib/curriculum";

const sprintItems = [
  { time: "09:00", title: "JavaScript diagnostic", meta: "25 questions · 30 min" },
  { time: "10:00", title: "Closures & scope", meta: "Lesson + 4 exercises" },
  { time: "12:30", title: "CSS layout lab", meta: "Flexbox · Grid · responsive" },
  { time: "15:00", title: "Coding round", meta: "3 timed problems · 90 min" },
];

const interviewTopics = [
  ["JavaScript", "68 questions", "#a78bfa"],
  ["Browser & Web", "42 questions", "#38bdf8"],
  ["HTML & Accessibility", "35 questions", "#34d399"],
  ["CSS", "39 questions", "#fb7185"],
];

export default function Home() {
  return (
    <main className="app-shell">
      <SiteHeader />
      <section className="hero page-width">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> Your interview, mapped</div>
          <h1>Learn frontend.<br /><span>Prove what you know.</span></h1>
          <p>Short lessons, real coding tasks, and interview practice that adapts to your weak spots—not another endless playlist.</p>
          <div className="hero-actions">
            <Link href="/learn/javascript/variables-and-types" className="button button-primary">Start learning <span aria-hidden>→</span></Link>
            <a href="#sprint" className="button button-secondary">See 2-day sprint</a>
          </div>
          <div className="hero-proof">
            <div><strong>20</strong><span>launch lessons</span></div>
            <div><strong>100+</strong><span>review questions</span></div>
            <div><strong>30</strong><span>coding exercises</span></div>
          </div>
        </div>
        <div className="readiness-card" aria-label="Sample readiness dashboard">
          <div className="readiness-head"><div><span className="overline">FRONTEND READINESS</span><h2>Good afternoon, Apurv</h2></div><span className="streak">↗ 7 day streak</span></div>
          <div className="score-panel"><div className="score-ring"><strong>72</strong><span>/100</span></div><div><span className="overline">CURRENT SCORE</span><h3>Almost interview ready</h3><p>Focus on async JavaScript and browser APIs next.</p></div></div>
          <div className="mastery-list">
            {[['HTML & semantics', 88], ['CSS layout', 76], ['JavaScript', 68], ['Browser APIs', 54]].map(([name, value]) => (
              <div className="mastery-row" key={name}><span>{name}</span><div className="progress-track"><i style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>
            ))}
          </div>
          <Link href="/learn/javascript/variables-and-types" className="continue-link"><span><b>Continue:</b> Variables & data types</span><span>12 min&nbsp; →</span></Link>
        </div>
      </section>

      <section className="tracks-section page-width" id="learn">
        <div className="section-heading"><div><span className="overline accent">STRUCTURED LEARNING</span><h2>One path. No guesswork.</h2></div><p>Every lesson ends with a knowledge check and something practical to build or debug.</p></div>
        <div className="track-grid">
          {tracks.map((track, index) => (
            <article className="track-card" key={track.slug}>
              <div className={`track-icon track-icon-${index + 1}`}>{track.mark}</div><span className="track-level">{track.level}</span>
              <h3>{track.title}</h3><p>{track.description}</p><div className="track-meta"><span>{track.lessons} lessons</span><span>{track.duration}</span></div>
              <div className="track-progress"><i style={{ width: `${track.progress}%` }} /></div><Link href={track.href}>{track.progress ? "Continue track" : "Explore track"} <span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="sprint-wrap" id="sprint"><div className="sprint page-width">
        <div className="sprint-copy"><span className="overline accent">INTERVIEW IN 48 HOURS?</span><h2>Cut the noise.<br />Study what matters.</h2><p>Your diagnostic score, target role, and available hours become a focused two-day plan.</p>
          <ul><li><span>01</span> Find your highest-impact weak areas</li><li><span>02</span> Mix recall, coding, and speaking practice</li><li><span>03</span> Finish with a readiness report</li></ul>
          <button className="button button-primary" type="button">Build my sprint <span>→</span></button>
        </div>
        <div className="timeline-card"><div className="timeline-top"><div><span>DAY 1 OF 2</span><h3>Core knowledge & coding</h3></div><b>6h 30m</b></div><div className="timeline-progress"><i /></div>
          <div className="timeline-list">{sprintItems.map((item, index) => <div className="timeline-item" key={item.time}><time>{item.time}</time><span className={index === 0 ? "active-node" : ""} /><div><strong>{item.title}</strong><small>{item.meta}</small></div>{index === 0 && <b className="now-pill">START HERE</b>}</div>)}</div>
        </div>
      </div></section>

      <section className="interview-section page-width" id="interview">
        <div className="section-heading"><div><span className="overline accent">ANSWER WITH CONFIDENCE</span><h2>Interview answers with depth.</h2></div><p>Start with the 30-second answer, then open the reasoning, examples, and likely follow-ups.</p></div>
        <div className="topic-grid">{interviewTopics.map(([title, count, color], index) => <article className="topic-card" key={title} style={{ "--topic": color } as React.CSSProperties}><span className="topic-number">0{index + 1}</span><div><h3>{title}</h3><p>{count}</p></div><span className="topic-arrow">↗</span></article>)}</div>
      </section>
      <footer className="site-footer page-width"><div className="brand"><span className="brand-mark">F</span><span>Frontend<strong>Prep</strong></span></div><p>Learn clearly. Practice deliberately. Interview confidently.</p><span>Phase 0 · Original learning content</span></footer>
    </main>
  );
}
