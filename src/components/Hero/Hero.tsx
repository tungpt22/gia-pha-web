import React from "react";
import "./Hero.css";
export default function Hero({
  title,
  subtitle,
  background,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  background: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="hero">
      <div className="bg" style={{ backgroundImage: `url(${background})` }} />
      <div className="overlay" />
      <div className="inner">
        <div className="container">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {actions && <div className="actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
