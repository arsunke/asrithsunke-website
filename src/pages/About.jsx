import React from "react";
import { useNavigate } from "react-router-dom";
import { ScrollableScene } from "./Portfolio";
import "./Portfolio.css";
import "./About.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="aboutShell">
      <div className="canvasContainer">
        <ScrollableScene activeSection="about" />
        <div className="vignette" />
      </div>

      <div className="aboutContent">
        <div className="aboutCard">
          <h1 className="aboutTitle">More About Me</h1>
          <p className="aboutSubtitle">Curious builder, lifelong learner, problem solver.</p>
          <p className="aboutText">
            I love shipping things end-to-end: designing resilient systems, tuning performance, and iterating
            quickly with users. Outside of code, I’m into cycling, photography, and diving deep into ML research
            papers to bring ideas back into products.
          </p>
          <div className="aboutButtons">
            <button className="btn btnPrimary" onClick={() => navigate("/")}>
              Back to Home
            </button>
            <button className="btn btnSecondary" onClick={() => navigate("/#contact")}>
              Get In Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
