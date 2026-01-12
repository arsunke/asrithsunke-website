import React from "react";
import { NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `nav-link ${isActive ? "active" : ""}`;

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-dot" />
          <span>Asrith</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className={navLinkClass} end>
            Asrith
          </NavLink>
          <NavLink to="/software-engineering" className={navLinkClass}>
            Software Engineering
          </NavLink>
          <NavLink to="/data-science" className={navLinkClass}>
            Data Science
          </NavLink>
        </nav>

        <div className="nav-cta">
          <a className="button subtle" href="#contact">
            Contact
          </a>
        </div>
      </div>
    </header>
  );
}
