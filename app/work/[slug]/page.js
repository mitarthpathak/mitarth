import { ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, getProject, getNextProject, sectionOrder } from "../../../content/projects";
import SignatureSVG from "../../components/SignatureSVG";
import ArchitectureDiagram from "../../components/case/ArchitectureDiagram";
import CaseToc from "../../components/case/CaseToc";
import CaseReveal from "../../components/case/CaseReveal";
import "../case-study.css";

const SITE_URL = "https://mitarth.vercel.app";

// Every case study is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const title = `${project.title} — Mitarth Pathak`;
  const url = `/work/${project.slug}`;
  return {
    title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: project.summary,
      siteName: "Mitarth Pathak",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: project.summary,
    },
  };
}

// Wraps the `highlight` phrase of a sentence in a yellow <mark>.
function Highlighted({ text, phrase }) {
  if (!phrase || !text.includes(phrase)) return text;
  const [before, after] = text.split(phrase);
  return (
    <>
      {before}
      <mark className="cs-mark">{phrase}</mark>
      {after}
    </>
  );
}

// Gallery rows: desktop shots full width, phone-sized shots side by side.
function galleryRows(gallery) {
  const desktops = gallery.filter((g) => !g.phone);
  const phones = gallery.filter((g) => g.phone);
  const rows = [];
  // One phone: sit it beside the first desktop shot. Several phones: keep
  // them together in their own centred row.
  if (phones.length === 1 && desktops.length) {
    rows.push(Object.assign([desktops.shift(), phones.shift()], { kind: "pair" }));
  }
  desktops.forEach((d) => rows.push(Object.assign([d], { kind: "wide" })));
  if (phones.length) rows.push(Object.assign(phones, { kind: "phones" }));
  return rows;
}

function SectionHead({ index, id, label, title }) {
  return (
    <header className="cs-section-head">
      <p className="cs-label">
        <span aria-hidden="true">{String(index).padStart(2, "0")} — </span>
        {label}
      </p>
      <h2 id={`${id}-title`} className="cs-h2">
        {title}
      </h2>
    </header>
  );
}

function ExternalLink({ href, children, className }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(slug);
  const index = projects.findIndex((p) => p.slug === slug) + 1;
  const { hero, gallery } = project.images;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": project.links.code.length ? "SoftwareSourceCode" : "CreativeWork",
    name: project.title,
    headline: `${project.title} — ${project.oneLiner}`,
    description: project.summary,
    url: `${SITE_URL}/work/${project.slug}`,
    image: `${SITE_URL}${hero.src}`,
    keywords: project.stack.join(", "),
    ...(project.links.code.length && { codeRepository: project.links.code[0].href }),
    ...(project.links.live && { sameAs: project.links.live }),
    author: {
      "@type": "Person",
      name: "Mitarth Pathak",
      url: SITE_URL,
      sameAs: ["https://github.com/mitarthpathak", "https://www.linkedin.com/in/mitarth-pathak"],
    },
  };

  const titles = {
    problem: "The problem",
    role: "What I did",
    built: "What I built",
    architecture: "How it fits together",
    decisions: "Choices and their costs",
    results: "What shipped",
    learned: "What I'd carry forward",
  };

  return (
    <div className="cs-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CaseReveal />

      <header className="cs-topbar">
        <Link href="/#work" className="cs-back">
          <span aria-hidden="true">←</span> All work
        </Link>
        <Link href="/" className="cs-sig" aria-label="Mitarth Pathak — home">
          <SignatureSVG strokeWidth="9" />
        </Link>
        <p className="cs-count" aria-hidden="true">
          {String(index).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
        </p>
      </header>

      <main className="cs-frame">
        <section className="cs-hero" aria-labelledby="cs-title">
          <p className="cs-label cs-eyebrow">Case study</p>
          <ViewTransition name={`work-title-${project.slug}`} share="work-title">
            <h1 id="cs-title" className="cs-title">
              {project.title}
            </h1>
          </ViewTransition>
          <p className="cs-oneliner">{project.oneLiner}</p>

          <dl className="cs-meta">
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{project.roleShort}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>
                {project.stack.slice(0, 3).map((item, i, list) => (
                  <span key={item} className="cs-meta-item">
                    {item}
                    {i < list.length - 1 && " · "}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{project.status}</dd>
            </div>
          </dl>

          <p className="cs-cta">
            {project.links.live && (
              <ExternalLink href={project.links.live} className="cs-btn cs-btn-primary">
                Live
              </ExternalLink>
            )}
            {project.links.code.map((c) => (
              <ExternalLink key={c.href} href={c.href} className="cs-btn">
                {project.links.code.length > 1 ? `Code · ${c.label}` : "Code"}
              </ExternalLink>
            ))}
          </p>
        </section>

        <figure className="cs-hero-media">
          <ViewTransition name={`work-media-${project.slug}`} share="work-morph">
            <Image
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              sizes="(max-width: 768px) 100vw, (max-width: 1440px) 94vw, 1360px"
              preload
              className="cs-hero-img"
            />
          </ViewTransition>
          {hero.generated && (
            <figcaption className="cs-caption">
              DevTask has no interface, so this is a visual of its real endpoints, not a screenshot.
            </figcaption>
          )}
        </figure>

        <div className="cs-body">
          <CaseToc sections={sectionOrder} />

          <article className="cs-content">
            <section id="problem" className="cs-section" aria-labelledby="problem-title" data-reveal>
              <SectionHead index={1} id="problem" label="Problem" title={titles.problem} />
              <p className="cs-lead">
                <Highlighted text={project.problem} phrase={project.highlight} />
              </p>
            </section>

            <section id="role" className="cs-section" aria-labelledby="role-title" data-reveal>
              <SectionHead index={2} id="role" label="My role" title={titles.role} />
              <p>{project.myRole}</p>
            </section>

            <section id="built" className="cs-section" aria-labelledby="built-title">
              <SectionHead index={3} id="built" label="What I built" title={titles.built} />
              <p data-reveal>{project.summary}</p>

              {project.products && (
                <ul className="cs-products" data-reveal>
                  {project.products.map((p) => (
                    <li key={p.name}>
                      <h3 className="cs-h3">{p.name}</h3>
                      <p>{p.text}</p>
                    </li>
                  ))}
                </ul>
              )}

              <ul className="cs-features" data-reveal>
                {project.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {project.endpoints && (
                <div className="cs-api" data-reveal>
                  <h3 className="cs-h3">Endpoints</h3>
                  <div className="cs-table-wrap">
                    <table className="cs-table">
                      <thead>
                        <tr>
                          <th scope="col">Method</th>
                          <th scope="col">Path</th>
                          <th scope="col">Auth</th>
                          <th scope="col">Does</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.endpoints.map((e) => (
                          <tr key={`${e.method} ${e.path}`}>
                            <td>
                              <span className={`cs-method cs-method-${e.method.toLowerCase()}`}>{e.method}</span>
                            </td>
                            <td>
                              <code>{e.path}</code>
                            </td>
                            <td>{e.auth ? "Bearer" : "Public"}</td>
                            <td>{e.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3 className="cs-h3">Request and response</h3>
                  <div className="cs-code-pair">
                    <figure className="cs-code">
                      <figcaption>Request</figcaption>
                      <pre tabIndex={0}>
                        <code>{project.example.request}</code>
                      </pre>
                    </figure>
                    <figure className="cs-code">
                      <figcaption>Response</figcaption>
                      <pre tabIndex={0}>
                        <code>{project.example.response}</code>
                      </pre>
                    </figure>
                  </div>
                  <p className="cs-note">Example values; the shape matches the TaskRequest and TaskResponse DTOs.</p>
                </div>
              )}

              {project.ai && (
                <div className="cs-ai" data-reveal>
                  <h3 className="cs-h3">How the AI part works</h3>
                  <dl className="cs-ai-list">
                    <div>
                      <dt>Model and approach</dt>
                      <dd>{project.ai.approach}</dd>
                    </div>
                    <div>
                      <dt>Data</dt>
                      <dd>{project.ai.data}</dd>
                    </div>
                    <div>
                      <dt>How quality was checked</dt>
                      <dd>{project.ai.quality}</dd>
                    </div>
                    {project.ai.safety && (
                      <div>
                        <dt>Safety guardrails</dt>
                        <dd>{project.ai.safety}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Limits</dt>
                      <dd>{project.ai.limits}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {gallery.length > 0 && (
                <div className="cs-gallery" data-reveal>
                  <h3 className="cs-h3">Screens</h3>
                  <div className="cs-gallery-grid">
                    {galleryRows(gallery).map((row) => (
                      <div key={row.map((g) => g.src).join()} className={`cs-gallery-row cs-gallery-row-${row.kind}`}>
                        {row.map((g) => (
                          <figure key={g.src} className={`cs-shot${g.phone ? " cs-shot-phone" : ""}`}>
                            <div className="cs-shot-frame">
                              <Image
                                src={g.src}
                                alt={g.alt}
                                width={g.width}
                                height={g.height}
                                sizes={g.phone ? "(max-width: 768px) 70vw, 240px" : "(max-width: 768px) 100vw, 720px"}
                              />
                            </div>
                            <figcaption className="cs-caption">{g.caption}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section id="architecture" className="cs-section" aria-labelledby="architecture-title">
              <SectionHead index={4} id="architecture" label="Architecture" title={titles.architecture} />
              <p data-reveal>{project.architecture.text}</p>
              <div data-reveal>
                <ArchitectureDiagram
                  title={project.title}
                  nodes={project.architecture.nodes}
                  edges={project.architecture.edges}
                />
              </div>
            </section>

            <section id="decisions" className="cs-section" aria-labelledby="decisions-title">
              <SectionHead index={5} id="decisions" label="Key decisions" title={titles.decisions} />
              <ol className="cs-decisions">
                {project.decisions.map((d, i) => (
                  <li key={d.decision} className="cs-decision" data-reveal>
                    <span className="cs-decision-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="cs-decision-title">{d.decision}</h3>
                    <dl>
                      <div>
                        <dt>Why</dt>
                        <dd>{d.why}</dd>
                      </div>
                      <div>
                        <dt>Trade-off</dt>
                        <dd>{d.tradeoff}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ol>
            </section>

            <section id="results" className="cs-section" aria-labelledby="results-title" data-reveal>
              <SectionHead index={6} id="results" label="Results" title={titles.results} />
              <ul className="cs-results">
                {project.results.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>

            <section id="learned" className="cs-section" aria-labelledby="learned-title" data-reveal>
              <SectionHead index={7} id="learned" label="What I learned" title={titles.learned} />
              <ul className="cs-learned">
                {project.learnings.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        <nav className="cs-next-wrap" aria-label="Next case study">
          <Link href={`/work/${next.slug}`} className="cs-next">
            <span className="cs-label">
              Next project <span aria-hidden="true">→</span>
            </span>
            <span className="cs-next-body">
              <span className="cs-next-title">{next.title}</span>
              <span className="cs-next-line">{next.oneLiner}</span>
            </span>
            <span className="cs-next-media" aria-hidden="true">
              <ViewTransition name={`work-media-${next.slug}`} share="work-morph">
                <Image
                  src={next.images.hero.src}
                  alt=""
                  width={next.images.hero.width}
                  height={next.images.hero.height}
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              </ViewTransition>
            </span>
          </Link>
        </nav>
      </main>

      <footer className="cs-footer">
        <p>
          Built by Mitarth Pathak ·{" "}
          <a href="mailto:mpathak6207@gmail.com">mpathak6207@gmail.com</a>
        </p>
        <Link href="/#work" className="cs-back">
          <span aria-hidden="true">←</span> All work
        </Link>
      </footer>
    </div>
  );
}
