// Who Mitarth is, for the terminal and the "ask about my work" agent.
// Sources, and nothing else: the GitHub profile README and its whoami card
// (github.com/mitarthpathak/mitarthpathak), this site, and
// content/projects.js. Open questions are `TODO(mitarth)` comments and are
// never rendered. No phone number, anywhere.

import { projects } from "./projects.js";

export const profile = {
  name: "Mitarth Pathak",
  role: "AI & Full-Stack Developer",
  location: "Jaipur, Rajasthan, India",

  // Short bio; every clause maps to a source above.
  summary:
    "Mitarth Pathak is an AI and full-stack developer based in Jaipur, Rajasthan. He is studying for a B.Tech in Computer Science and Engineering at Arya College of Engineering & Technology (RTU Kota). He builds web apps with React and Next.js, backends with Spring Boot and Express, and AI features on top of LLM APIs such as Groq and Gemini. His projects are Swasthya-Neeti, Run-Neeti, DevTask and Yap-Render.",

  education: {
    degree: "B.Tech, Computer Science and Engineering",
    school: "Arya College of Engineering & Technology (RTU Kota)",
    // TODO(mitarth): Expected graduation year? The whoami card only says "Soph".
  },

  // Exactly as the profile README's Experience table states it.
  experience: [
    {
      role: "Web Developer",
      company: "Craftory Studio",
      period: "Ongoing",
      location: "Jaipur, India · Remote",
      note: "",
    },
    {
      role: "Big Data Analyst (Intern)",
      company: "IBM",
      period: "Jun 2026 – Aug 2026 · 3 mos",
      location: "Jaipur, India · Remote",
      note: "Completed the IBM Big Data Analyst internship with a completion certificate, focused on large-scale data processing and large-scale data analysis.",
    },
  ],
  // TODO(mitarth): The whoami card says "Interning @ Craftory Studio — open to
  // full-time opportunities" while the site's menu says "Open to AI / full-stack
  // internships". Which should the terminal say? It currently repeats neither
  // as a commitment.

  // From the whoami card: focus, languages and daily tools.
  focus: ["Backend development", "Spring Security", "API design"],
  motto: "Ship first, theorize later.",

  // Each skill is tied to the projects that use it (slugs from projects.js).
  skills: [
    { name: "Java", group: "Languages", projects: ["devtask"] },
    { name: "JavaScript", group: "Languages", projects: ["run-neeti", "swasthya-neeti", "yap-render"] },
    { name: "TypeScript", group: "Languages", projects: ["swasthya-neeti", "run-neeti", "yap-render"] },
    { name: "Kotlin", group: "Languages", projects: ["yap-render"] },
    { name: "Python", group: "Languages", projects: [] },
    { name: "C++", group: "Languages", projects: [] },
    { name: "React", group: "Frontend", projects: ["swasthya-neeti", "run-neeti", "yap-render"] },
    { name: "Next.js", group: "Frontend", projects: ["yap-render"] },
    { name: "Three.js / React Three Fiber", group: "Frontend", projects: ["yap-render"] },
    { name: "D3", group: "Frontend", projects: ["run-neeti"] },
    { name: "Jetpack Compose", group: "Mobile", projects: ["yap-render"] },
    { name: "Spring Boot", group: "Backend", projects: ["devtask"] },
    { name: "Spring Security + JWT", group: "Backend", projects: ["devtask"] },
    { name: "Express", group: "Backend", projects: ["swasthya-neeti", "run-neeti"] },
    { name: "PostgreSQL", group: "Data", projects: ["devtask"] },
    { name: "MongoDB", group: "Data", projects: ["swasthya-neeti", "run-neeti"] },
    { name: "Groq (Llama, Whisper)", group: "AI", projects: ["swasthya-neeti", "run-neeti"] },
    { name: "Gemini API", group: "AI", projects: ["yap-render"] },
    { name: "Git", group: "Tools", projects: [] },
    { name: "Vercel", group: "Tools", projects: ["swasthya-neeti", "run-neeti", "yap-render"] },
  ],

  // Tools he names in the whoami card as daily ones, plus the build tools
  // his repos use. Shown in the IDE's "Framework & Tools" pane.
  tools: ["Spring Boot", "PostgreSQL", "React", "Git", "Next.js", "Vite", "Maven", "Android Studio", "Vercel"],

  links: {
    email: "mailto:mpathak6207@gmail.com",
    emailAddress: "mpathak6207@gmail.com",
    github: "https://github.com/mitarthpathak",
    linkedin: "https://www.linkedin.com/in/mitarth-pathak",
    // TODO(mitarth): the site uses x.com/mpathak6207, the profile README
    // links twitter.com/mpathakG207. Which is right?
    x: "https://x.com/mpathak6207",
  },
};

export function projectsForSkill(skill) {
  return skill.projects.map((slug) => projects.find((p) => p.slug === slug)?.title).filter(Boolean);
}
