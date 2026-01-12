import React from "react";
import PageTransition from "../components/PageTransition.jsx";

export default function Home() {
  return (
    <PageTransition>
      <section className="hero">
        <div className="hero-left">
          <p className="pill">Data Science @ UMich • CS Minor</p>
          <h1 className="h1">
            I build clean software and data products that actually ship.
          </h1>
          <p className="lead">
            I’m Asrith. I like building practical tools—SWE projects with solid UX and
            data science work that drives decisions.
          </p>

          <div className="hero-actions">
            <a className="button" href="/software-engineering">Explore SWE</a>
            <a className="button ghost" href="/data-science">Explore Data Science</a>
          </div>

          <div className="stats">
            <div className="stat">
              <p className="stat-num">3+</p>
              <p className="muted">Team projects shipped</p>
            </div>
            <div className="stat">
              <p className="stat-num">ML</p>
              <p className="muted">Applied & measurable</p>
            </div>
            <div className="stat">
              <p className="stat-num">UX</p>
              <p className="muted">Design-first dev</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="card glass">
            <h2 className="h2">Quick Snapshot</h2>
            <ul className="list">
              <li>Focused on: SWE + Data Science</li>
              <li>Strengths: product thinking, clean code, storytelling</li>
              <li>Currently: building portfolio + project demos</li>
            </ul>
            <div className="divider" />
            <div id="contact" className="contact">
              <p className="muted">Want to reach me?</p>
              <a className="button subtle" href="mailto:you@example.com">Email me</a>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
