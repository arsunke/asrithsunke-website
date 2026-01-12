import React from "react";
import PageTransition from "../components/PageTransition.jsx";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="center">
        <h1 className="h1">404</h1>
        <p className="lead">That page doesn’t exist.</p>
        <a className="button" href="/">Go Home</a>
      </div>
    </PageTransition>
  );
}
