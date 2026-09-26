import Link from "next/link";
import { projects } from "../content/projects";

export const metadata = {
  title: "Page not found — Mitarth Pathak",
};

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-grid" aria-hidden="true" />
      <p className="nf-code" aria-hidden="true">
        404
      </p>
      <h1 className="nf-title">This page doesn&apos;t exist.</h1>
      <p className="nf-text">The link may be old, or the case study may have moved. These are the ones that exist:</p>
      <ul className="nf-list">
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/work/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
      <p className="nf-actions">
        <Link href="/" className="nf-btn nf-btn-primary">
          <span aria-hidden="true">←</span> Home
        </Link>
        <Link href="/#work" className="nf-btn">
          All work
        </Link>
      </p>
    </main>
  );
}
