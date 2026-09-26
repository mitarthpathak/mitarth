import { projects } from "../content/projects";

const SITE_URL = "https://mitarth.vercel.app";

// Fixed dates from content (each repo's last commit), never `new Date()`,
// so the sitemap only changes when the content does.
export default function sitemap() {
  const latest = projects.map((p) => p.updated).sort().at(-1);
  return [
    { url: SITE_URL, lastModified: latest, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${SITE_URL}/work/${p.slug}`,
      lastModified: p.updated,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
  ];
}
