// Boxes-and-arrows architecture diagram built from `architecture.nodes/edges`
// in content/projects.js. Plain HTML so it reflows: left-to-right on wide
// screens, top-to-bottom on phones.
//
// Two shapes cover every project:
//  - a chain (each node feeds the next), drawn as one row of steps;
//  - a hub (one node talks to several), drawn as source → hub → stack of
//    targets, each target carrying its edge label.

function Node({ node, variant }) {
  return (
    <div className={`arch-node${variant ? ` arch-node-${variant}` : ""}`}>
      <span className="arch-node-label">{node.label}</span>
      {node.note && <span className="arch-node-note">{node.note}</span>}
    </div>
  );
}

function Arrow({ label }) {
  return (
    <div className="arch-arrow" aria-hidden="true">
      <span className="arch-arrow-line" />
      {label && <span className="arch-arrow-label">{label}</span>}
    </div>
  );
}

function isChain(nodes, edges) {
  if (edges.length !== nodes.length - 1) return false;
  return edges.every(([from], i) => from === nodes[i].id) && edges.every(([, to], i) => to === nodes[i + 1].id);
}

// A short text version of the same diagram for screen readers.
function describe(nodes, edges) {
  const name = (id) => nodes.find((n) => n.id === id)?.label ?? id;
  return edges.map(([from, to, label]) => `${name(from)} to ${name(to)}${label ? ` (${label})` : ""}`).join("; ");
}

export default function ArchitectureDiagram({ nodes, edges, title }) {
  const summary = `${title} architecture: ${describe(nodes, edges)}.`;

  if (isChain(nodes, edges)) {
    return (
      <figure className="arch arch-chain" data-count={nodes.length > 4 ? "long" : "short"}>
        <div className="arch-flow" aria-hidden="true">
          {nodes.map((node, i) => (
            <div className="arch-step" key={node.id}>
              {i > 0 && <Arrow label={edges[i - 1][2]} />}
              <Node node={node} variant={i === 0 ? "start" : i === nodes.length - 1 ? "end" : null} />
            </div>
          ))}
        </div>
        <figcaption className="sr-only">{summary}</figcaption>
      </figure>
    );
  }

  // Hub layout: the node with the most outgoing edges sits in the middle.
  const outCount = (id) => edges.filter(([from]) => from === id).length;
  const hub = nodes.reduce((best, n) => (outCount(n.id) > outCount(best.id) ? n : best), nodes[0]);
  const sources = edges.filter(([, to]) => to === hub.id).map(([from, , label]) => ({ node: nodes.find((n) => n.id === from), label }));
  const targets = edges.filter(([from]) => from === hub.id).map(([, to, label]) => ({ node: nodes.find((n) => n.id === to), label }));

  return (
    <figure className="arch arch-hub">
      <div className="arch-flow" aria-hidden="true">
        <div className="arch-col arch-col-sources">
          {sources.map(({ node }) => (
            <Node key={node.id} node={node} variant="start" />
          ))}
        </div>
        <Arrow label={sources[0]?.label} />
        <div className="arch-col arch-col-hub">
          <Node node={hub} variant="hub" />
        </div>
        <div className="arch-col arch-col-targets">
          {targets.map(({ node, label }) => (
            <div className="arch-branch" key={node.id}>
              <Arrow label={label} />
              <Node node={node} />
            </div>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}
