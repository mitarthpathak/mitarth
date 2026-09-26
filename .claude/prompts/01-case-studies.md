# Task: case-study pages with a card-to-hero morph

You are working in my portfolio repo, live at https://mitarth.vercel.app. It's Next.js 16 (App Router) with React 19 and plain JavaScript. It uses GSAP, Motion and React Three Fiber, with hand-written CSS in `app/globals.css`.

Build a case-study page for every project, opened from the home page cards with a smooth card-to-hero morph. The bar is a very high visual standard: it should feel like the same site, only better.

Work autonomously. Don't stop to ask me questions: make the best call, log it in `.agent-work/DECISIONS.md`, and keep going. Take as long as it needs; finishing properly matters more than speed.

## Decisions already made (edit before running if you disagree)

- **Primary title:** "AI & Full-Stack Developer". It replaces "Visual Designer" as the visible role; design stays my differentiator. "MITARTH THE GREAT" stays as the visual hero.
- **No phone number on the public site.** Contact routes are email (a `mailto:` link), LinkedIn and GitHub.
- **Intro:** the signature intro plays once per browser session, is skippable, and never hides content.

## 0. Ground rules

- **Read the docs first.** Read `AGENTS.md`. This is Next.js 16: before using any Next.js API (routing, `Link`, metadata, `next/image`, `opengraph-image`, view transitions), read the matching guide in `node_modules/next/dist/docs/`. Follow the installed version, not memory.
- **Git:**
  - Work on a new branch, `feat/case-studies`.
  - Commit after each finished step with a clear message.
  - Never push to or merge into `main`; main auto-deploys to production.
  - Never force-push.
- **Never invent facts.** That means no made-up metrics, users, awards, testimonials, dates or team roles.
  - If a fact is unknown, write around it honestly.
  - Add the question to `.agent-work/QUESTIONS-FOR-MITARTH.md` and mark the spot in content with `// TODO(mitarth): …`.
  - No TODO text may ever render on the page.
- **Keep the site's identity.**
  - Palette (from `:root` in globals.css): cream `#F7F1ED`, dark `#242424`, yellow `#FFE862`, blue `#37ACE8`, signature orange `#FF9500`.
  - Fonts: Inter for display and body, Geist Mono for labels and meta.
  - Reuse existing patterns (vertical guide lines, staircase reveal, yellow accents, the "View project ↗" cursor) rather than inventing a new style.
  - No UI libraries. If a frontend-design skill is available in this Claude Code install, use it.
- **Don't break what works:** the signature, hero letters, yellow section, tech-stack IDE and 3D graph, footer and menu.
- **Keep working files out of the repo.** Add `.agent-work/` and `.claude/prompts/` to `.gitignore`.
- **Track progress in a file.** Keep a live checklist in `.agent-work/case-studies-progress.md` by copying the Definition of Done (section 7) into it.
  - Re-read it at the start of every turn.
  - Tick an item only after you have verified it.

## 1. Gather real content first (no UI yet)

- **Read my repos.** Clone these public repos read-only into `.agent-work/repos/`:
  - `mitarthpathak/Swasthya-Neeti`
  - `mitarthpathak/Run-Neeti`
  - `mitarthpathak/DevTask`
  - `mitarthpathak/yap-render`
  - `mitarthpathak/yap-render-APP`
  - `mitarthpathak/yap-render-extension`
  - `mitarthpathak/mitarthpathak` (my profile repo)

  Read the READMEs, the manifests (package.json, pom.xml, build.gradle), the folder structure and the key source files.
- **Screenshot the live demos.** Use the Playwright MCP from `.mcp.json` to open swasthya-neeti.vercel.app, run-neeti.vercel.app and yap-render.vercel.app. Capture clean screenshots at 1440×900 and 390×844.
- **DevTask has no UI.** Build a clean visual instead, from its real code: an endpoint table, a request/response example and an architecture diagram. Never a fake screenshot.
- **Create `content/projects.js` as the single source of truth.** For each project it holds:

  | Field | Notes |
  |---|---|
  | `slug`, `title`, `year` | |
  | `oneLiner`, `summary`, `problem` | |
  | `myRole` | |
  | `stack[]`, `tags[]` | e.g. `ai`, `web`, `backend`, `mobile` |
  | `features[]` | |
  | `architecture` | short text plus data for a diagram |
  | `decisions[]` | each is `{ decision, why, tradeoff }` |
  | `results[]` | verifiable only |
  | `learnings[]` | |
  | `links` | `{ live, code[] }` |
  | `images` | `{ hero, gallery[] }` |

- **Yap-Render covers three products:** the web app, the Kotlin Android app and the browser extension.
- **AI projects also state:** the model or approach, the data, how quality was checked, and the limits. For Swasthya-Neeti (health guidance) that includes medical-safety guardrails and disclaimers if they exist in the code; if they don't, add it as a question for me.
- **Copy style:**
  - first person ("I built…")
  - specific and tight: body paragraphs under ~70 words
  - no buzzwords ("passionate", "cutting-edge", "seamless")

## 2. Fix what would break this feature

- **Intro.** Right now the signature lives in the root layout, and all page content sits at `opacity: 0` until about 5.7 s (`#sig-page-content` in `app/styles/animation.css`). Change it so that it:
  - plays only on the first home visit per browser session, never on `/work/*`, and never again when navigating back to `/`;
  - is decided before first paint by a tiny inline script that sets a `data-` attribute on `<html>` from sessionStorage (wrapped in try/catch), so there's no flash either way;
  - never blocks content: the hero is visible at first paint, and the signature plays on top for ≤1.2 s, then settles into the header mark;
  - can be skipped with a visible "Skip" button, Esc or a click;
  - doesn't play at all under `prefers-reduced-motion`.
- **Menu (`app/components/Menu.js`).** Make it route-aware and accessible, keeping the morphing look:
  - The toggle becomes a `<button aria-expanded aria-controls>`.
  - HOME, WORKS and CONTACT become real links (`/`, `/#work`, and the contact view) that work from any page.
  - Esc closes it, and focus moves sensibly.
  - Contact view: replace "if you wanna contact me (ONLY IF)" with a friendly line such as "Open to AI / full-stack internships", make the email a `mailto:` link, add LinkedIn and GitHub, and remove the phone number.
- **The fixed Menu pill must never cover content.** Add safe space at the end of every page (`padding-bottom: calc(<pill height> + <offset> + env(safe-area-inset-bottom))`). Verify the footer social icons on a 390 px phone; today the pill covers LinkedIn and X.
- **Project cards (`app/page.js`).**
  - Replace `<article onClick={window.open}>` with an accessible card. The title is a `next/link` to `/work/[slug]`, and its `::after` stretches over the whole card. Small "Live ↗" and "Code ↗" links sit above it (never nest anchors).
  - Add a 1–2 line summary and 3–4 stack chips. Keep the date, the mark and the layout rhythm.
  - The vertical guide lines must never cross text.
  - The custom cursor may stay on desktop, but only under `(pointer: fine) and (hover: hover)`. Never hide the system cursor, so `cursor: none` goes.
- **Hero.**
  - Semantically, the page gets exactly one `<h1>`: "Mitarth Pathak — AI & Full-Stack Developer". The visual can stay "MITARTH THE GREAT"; use visually-hidden text or restructure so the look doesn't change.
  - The role line must be visible on phones too; `.hero-side-lines` is currently `display: none` on mobile.
  - Fix the cursor bubble's contrast: white on `#37ACE8` is 2.55:1, so use dark text.
- **Headings.** "Created projects" becomes `<h2 id="projects-title">`, which also fixes the broken `aria-labelledby`. Card titles become `<h3>`.

## 3. Build the case-study pages

- **Route:** `app/work/[slug]/page.js` as a Server Component (no page-level `"use client"`).
  - Use `generateStaticParams` so the pages are static, and `notFound()` for unknown slugs.
  - Put interactive bits in small client components.
- **Metadata:** use `generateMetadata`:
  - title "<Project> — Mitarth Pathak", description from `summary`, and a canonical URL
  - Open Graph, plus Twitter `summary_large_image`
  - a per-project `opengraph-image.js` (1200×630, `ImageResponse`, cream/yellow/dark with the project title)
  - JSON-LD (`CreativeWork` or `SoftwareSourceCode` with an author `Person`), following the Next.js JSON-LD guide
- **Desktop layout:**
  1. A top bar with a "← All work" link (to `/#work`) and the small signature mark.
  2. The hero:
     - the project title, large, in Inter with tight tracking like the home hero
     - the one-liner
     - a meta row in Geist Mono: Year · Role · Stack · Status
     - primary "Live ↗" and "Code ↗" buttons
  3. The hero image. This is the **morph target**.
     - It spans the full content grid, rounded like the cards.
     - Use `next/image` with correct `sizes`, and preload/priority as the installed docs say.
  4. The sections, each with an `id` anchor: Problem · My role · What I built · Architecture · Key decisions · Results · What I learned.
     - A sticky mini table of contents on desktop.
     - A readable column (max ~70ch) with generous whitespace on an 8 px spacing scale.
     - Section labels in Geist Mono uppercase, and subtle yellow highlights for key phrases.
  5. A gallery of real screenshots, with desktop and phone side by side and captions.
  6. The architecture as a clean SVG or HTML diagram (boxes and arrows) in the site palette, legible at 390 px.
  7. The key decisions as cards: decision → why → trade-off.
  8. A "Next project →" card that also morphs.
- **Mobile (390 px):**
  - single column, no horizontal scroll
  - the title wraps nicely and the table of contents collapses
  - tap targets ≥ 44 px
  - images well cropped
- **Motion:**
  - subtle GSAP section reveals, 200–500 ms, using the site's easing
  - all disabled under reduced motion (`gsap.matchMedia`)
  - no scroll-jacking on these pages

## 4. The card-to-hero morph

- **Approach:** implement it the view-transition way the installed Next.js version documents: React `<ViewTransition>` with a shared `name` per slug on the card image and the case-study hero image. Morph the title as well, if that looks good.
- **Version check:** check the local docs for required flags. If the installed version doesn't support this cleanly, upgrade `next`, `react`, `react-dom` and `eslint-config-next` to the latest 16.x, then re-run lint and build and re-test the whole site.
- **Behaviour:**
  - Use `next/link` so pages prefetch; the transition needs it.
  - Going back morphs back into the card.
- **Tuning:**
  - 350–550 ms, with the site's easing
  - no cream or white flash, text stays crisp
  - the fixed Menu and the cursor don't jump
- **Edge cases:**
  - Add `::view-transition` rules so reduced motion gets an instant switch.
  - Pointer events must not be blocked during the transition.
  - Unsupported browsers get plain navigation with no errors.

## 5. Site-wide integration

- **`app/sitemap.js`:** home plus every case study, with a fixed `lastModified` taken from content (not `new Date()`).
- **`app/robots.js`.**
- **`app/layout.js`:** set `metadataBase: new URL('https://mitarth.vercel.app')`, and fix `openGraph.url`, which currently points at a dead domain.
- **A styled 404** for unknown slugs.
- **Images:** serve every case-study screenshot through `next/image` (AVIF or WebP), and keep each case study's image weight under ~1.5 MB at 1440 px.

## 6. QA loop: repeat until clean

Run this after every major step, and again at the end.

1. **Lint and build.** `npm run lint` and `npm run build` must both exit 0 with no new warnings.
2. **Screenshots.** Start the app and use the Playwright MCP to screenshot `/` and every `/work/*` page.
   - Sizes: 390×844, 768×1024, 1280×800 and 1440×900.
   - For each page, capture the top, middle and bottom, plus one frame taken mid-morph.
   - Save them to `.agent-work/qa/<step>/`.
3. **Review every screenshot** against this rubric and log the findings in `.agent-work/qa/QA-LOG.md`:
   - **Layout and type:** alignment to the grid and guide lines, consistent spacing, clear type hierarchy, sensible line length, no one-word last lines in headings.
   - **Contrast:** ≥ 4.5:1 for text and ≥ 3:1 for large text and UI. No light grey on yellow.
   - **Nothing broken:** nothing covered by the fixed Menu pill, no horizontal scroll, no clipped or overlapping text, images crisp and well cropped.
   - **States:** hover, focus-visible, active and loading are all designed, and a focus ring is visible on every interactive element.
   - **Consistency:** it feels like the same site as the home page.
4. **Keyboard-only pass.** Tab through `/` and one case study. Every link and button must be reachable with visible focus and a logical order. The menu opens and closes by keyboard, and Esc works.
5. **Reduced-motion pass.** Emulate `prefers-reduced-motion: reduce`. There should be no intro, no morph animation and no reveals, and everything must still be visible.
6. **Fix and repeat.** Fix everything you found, then re-shoot. Before the final pass, give a subagent that has no other context the final screenshots and the rubric, and have it act as a strict senior product designer and list every issue. Fix everything it finds.

## 7. Definition of Done

- [ ] Real content for all 4 projects in `content/projects.js`, with no invented facts; open questions are in `QUESTIONS-FOR-MITARTH.md`
- [ ] Intro: first home visit per session only, skippable, content visible at first paint, never on `/work/*`, off under reduced motion
- [ ] Menu: a real button and real links that work from every page, keyboard and Esc support, friendly contact copy, no phone number
- [ ] Cards: accessible links, a summary and stack chips, Live and Code links, the system cursor never hidden, no guide line crossing text
- [ ] Headings: a single `h1` with name and role (role visible on mobile), `h2#projects-title`, `h3` card titles
- [ ] `/work/[slug]` for all 4 projects: server-rendered and static, with metadata, an OG image, JSON-LD, all sections, the gallery, the diagram and a next-project card
- [ ] Card-to-hero morph: works forward and back, tuned, safe under reduced motion, with a graceful fallback
- [ ] Sitemap, robots, `metadataBase`, a fixed `og:url` and a styled 404
- [ ] The fixed Menu pill never covers content on any page at 390 px
- [ ] `npm run lint` and `npm run build` exit 0
- [ ] Final QA (4 viewports, keyboard, reduced motion, independent reviewer) shows zero open issues in `QA-LOG.md`
- [ ] All commits are on `feat/case-studies`; nothing was pushed to `main`
- [ ] `.agent-work/SUMMARY-case-studies.md` covers what changed (file by file), how to review, the key screenshots and the open questions

When everything is checked, print the full checklist, the last lint and build output, and the QA summary.
