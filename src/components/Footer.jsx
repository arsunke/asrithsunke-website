import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="muted">© {new Date().getFullYear()} Asrith Sunke</p>
        <div className="footer-links">
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
          <a href="mailto:you@example.com">Email</a>
        </div>
      </div>
    </footer>
  );
}
