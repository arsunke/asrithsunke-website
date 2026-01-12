import React from "react";
import PageTransition from "../components/PageTransition.jsx";
import { sweProjects } from "../data/projects.js";

function ProjectCard({ p }) {
  return (
    <article className="project-card">
      <div className="project-head">
        <h3 className="h3">{p.title}</h3>
        <p className="muted">{p.subtitle}</p>
      </div>

      <ul className="list compact">
        {p.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div className="chips">
        {p.tech.map((t) => (
          <span className="chip" key={t}>{t}</span>
        ))}
      </div>

      <div className="project-links">
        {p.links.github && (
          <a className="button subtle" href={p.links.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        )}
        {p.links.demo && (
          <a className="button" href={p.links.demo} target="_blank" rel="noreferrer">
            Live Demo
          </a>
        )}
      </div>
    </article>
  );
}

export default function SoftwareEngineering() {
  return (
    <PageTransition>
      <header className="page-head">
        <h1 className="h1">Software Engineering</h1>
        <p className="lead">
          Projects focused on building reliable apps, clean interfaces, and systems that scale.
        </p>
      </header>

      <section className="grid">
        {sweProjects.map((p) => (
          <ProjectCard key={p.title} p={p} />
        ))}
      </section>
    </PageTransition>
  );
}
