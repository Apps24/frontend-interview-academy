import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { sprintItems } from "@/lib/interview-sprint";
import { tracks } from "@/lib/curriculum";

const interviewTopics = [
  ["JavaScript", "6 launch questions", "#a78bfa", "javascript"],
  ["Browser & Web", "4 launch questions", "#38bdf8", "browser-web"],
  ["HTML & Accessibility", "3 launch questions", "#34d399", "html-accessibility"],
  ["CSS", "3 launch questions", "#fb7185", "css"],
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
            <Link href="/learn/javascript" className="button button-primary">Start learning <span aria-hidden>→</span></Link>
            <Link href="/practice" className="button button-secondary">Solve coding problems</Link>
          </div>
          <div className="hero-proof">
            <div><strong>20</strong><span>launch lessons</span></div>
            <div><strong>100+</strong><span>review questions</span></div>
            <div><strong>6</strong><span>coding challenges</span></div>
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
          <Link href="/learn/javascript" className="continue-link"><span><b>Start:</b> JavaScript foundations</span><span>6 lessons&nbsp; →</span></Link>
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
          <Link href="/sprint" className="button button-primary">Build my sprint <span>→</span></Link>
        </div>
        <div className="timeline-card"><div className="timeline-top"><div><span>DAY 1 OF 2</span><h3>Core knowledge & coding</h3></div><b>6h 30m</b></div><div className="timeline-progress"><i /></div>
          <div className="timeline-list">{sprintItems.slice(0, 4).map((item, index) => <div className="timeline-item" key={item.key}><time>{item.time}</time><span className={index === 0 ? "active-node" : ""} /><div><strong>{item.title}</strong><small>{item.category} · {item.duration} min</small></div>{index === 0 && <b className="now-pill">START HERE</b>}</div>)}</div>
        </div>
      </div></section>

      <section className="interview-section page-width" id="interview">
        <div className="section-heading"><div><span className="overline accent">ANSWER WITH CONFIDENCE</span><h2>Interview answers with depth.</h2></div><p>Start with the 30-second answer, then open the reasoning, examples, and likely follow-ups.</p></div>
        <div className="topic-grid">{interviewTopics.map(([title, count, color, slug], index) => <Link href={`/interview?topic=${slug}`} className="topic-card" key={title} style={{ "--topic": color } as React.CSSProperties}><span className="topic-number">0{index + 1}</span><div><h3>{title}</h3><p>{count}</p></div><span className="topic-arrow">↗</span></Link>)}</div>
      </section>
      <section className="pricing-section page-width" id="pricing"><div className="section-heading"><div><span className="overline accent">SIMPLE ACCESS</span><h2>Start free. Go deeper with Pro.</h2></div><p>Learn the foundations before paying. Upgrade only when you want the complete interview answer library.</p></div><div className="pricing-grid"><article><span className="overline">FREE</span><h3>$0</h3><p>Build momentum with the core learning and practice experience.</p><ul><li>JavaScript learning track</li><li>10 detailed interview answers</li><li>Two-day interview sprint</li><li>Progress and bookmarks</li></ul><Link href="/auth?mode=signup" className="button button-secondary">Start free</Link></article><article className="featured"><span className="overline accent">PRO · COMING NEXT</span><h3>Full library</h3><p>Go beyond memorized replies with deeper explanations and follow-ups.</p><ul><li>Every detailed interview answer</li><li>Code examples and mental models</li><li>Advanced follow-up prompts</li><li>Future premium prep tracks</li></ul><Link href="/interview" className="button button-primary">Preview Pro questions</Link></article></div></section>
      <footer className="site-footer page-width"><div className="brand"><span className="brand-mark">F</span><span>Frontend<strong>Prep</strong></span></div><p>Learn clearly. Practice deliberately. Interview confidently.</p><span>Phase 3 · Interview question bank</span></footer>
    </main>
  );
}
