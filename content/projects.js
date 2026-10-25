// Single source of truth for every project on the site: the home cards,
// the /work/[slug] case studies, the sitemap and the OG images all read
// from here. Every fact below was read from the project's own repository
// (README, manifests, source) — nothing is estimated or invented. Open
// questions live next to the field as `TODO(mitarth)` comments and are
// never rendered.

export const projects = [
  {
    slug: "swasthya-neeti",
    title: "Swasthya-Neeti",
    year: "2026",
    date: "April 2026",
    // Last commit in the repo; used for the sitemap's lastModified.
    updated: "2026-08-19",
    status: "Live",
    roleShort: "Solo build",
    mark: "S",
    variant: "solid",
    cardType: "AI Chatbot for Rural Healthcare Guidance",
    oneLiner: "A voice-first health assistant for rural families, in ten Indian languages.",
    summary:
      "An AI chat assistant that gives families plain-language health guidance, takes questions by voice, answers in ten Indian languages and urges medical care when danger signs appear.",
    problem:
      "Families in villages often have a health question long before they can reach a clinic, and most health apps assume English, fast data and confident typing. I wanted the first conversation to work in the user's own language, by voice, on a modest phone.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "in the user's own language, by voice",
    myRole:
      "I built it on my own: the React interface, the Express API, the Groq integration, voice transcription, sign-in, saved chats and the Vercel deployment.",
    // TODO(mitarth): Was this a hackathon or course project, and was anyone else involved?
    stack: ["React 19", "TypeScript", "Vite", "Express", "Groq", "MongoDB", "Vercel"],
    tags: ["ai", "web"],
    features: [
      "Chat with a health assistant in English, Hindi, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Punjabi or Malayalam.",
      "Speak instead of type: audio is recorded in the browser and transcribed on the server with Whisper large-v3-turbo on Groq.",
      "Three tappable suggested replies after every answer, so follow-ups need no typing.",
      "Accounts with saved conversations and a dashboard with personal health reminders.",
      "A health-updates panel that pulls public news from NIH, CDC and WHO sources.",
      "A separate low-resource chat view with a flatter, lighter interface.",
    ],
    ai: {
      approach:
        "Chat replies come from Groq's Compound Mini model (configurable by environment variable) with a short system prompt, the last eight messages as history and a 500-token cap. Voice notes go to Whisper large-v3-turbo, and the server drops known Whisper filler phrases such as “thank you for watching”.",
      data:
        "No custom training or fine-tuning. The model answers from its general knowledge plus the conversation. Interface text is translated per language by the model, with Google Translate as a fallback.",
      quality:
        "Checked by hand while building: the prompt forces short answers and suggested replies are validated as JSON with a rule-based fallback.",
      // TODO(mitarth): Was answer quality ever tested with real users, doctors or a test set?
      limits:
        "It gives general guidance only. It is not a diagnosis tool, it has no medical knowledge base behind it, and answers can be wrong.",
      safety:
        "The system prompt tells the model never to claim to be a doctor, never to prescribe dosages and to urge medical attention for danger signs like chest pain or trouble breathing. The chat shows a notice that it is not a substitute for professional advice, and the dashboard's terms state it is not for emergencies.",
    },
    architecture: {
      text:
        "A Vite + React client talks to an Express API. On Vercel the API runs as serverless functions under /api. Chat, transcription and translation go to Groq; users, chats and reminders are stored in MongoDB.",
      nodes: [
        { id: "client", label: "React client", note: "Vite · voice recorder" },
        { id: "api", label: "Express API", note: "Vercel functions" },
        { id: "groq", label: "Groq", note: "Chat + Whisper" },
        { id: "db", label: "MongoDB", note: "Users · chats · reminders" },
        { id: "news", label: "Public feeds", note: "NIH · CDC · WHO" },
      ],
      edges: [
        ["client", "api", "HTTPS / JSON"],
        ["api", "groq", "prompt · audio"],
        ["api", "db", "Mongoose"],
        ["api", "news", "fetch"],
      ],
    },
    decisions: [
      {
        decision: "Transcribe voice on the server with Whisper instead of the browser's speech API.",
        why: "The browser API behaves differently across phones and languages; one server model gives the same result everywhere.",
        tradeoff: "Every voice note is an upload and an API call, so it is slower on weak networks.",
      },
      {
        decision: "Translate the whole interface with the model, with Google Translate as a fallback.",
        why: "Ten languages without writing and maintaining ten sets of UI copy by hand.",
        tradeoff: "Machine translation can be awkward and nobody has proofread it.",
      },
      {
        decision: "Keep answers short and follow each one with three suggested replies.",
        why: "Long medical paragraphs are hard to read on a phone; tapping a reply is easier than typing.",
        tradeoff: "Short answers leave out detail that some users would want.",
      },
    ],
    results: [
      "Deployed and publicly available at swasthya-neeti.vercel.app.",
      "Ten interface and answer languages, with voice input.",
    ],
    // TODO(mitarth): Any usage numbers, feedback or recognition you can share?
    learnings: [
      "Safety in a health product is mostly about what the assistant refuses to do, and it has to be written down in the prompt and the UI.",
      "Speech-to-text models invent polite filler on silent audio, so the output needs cleaning before it reaches the chat.",
      "Running an Express app as Vercel functions needs care with routing and cold starts.",
    ],
    links: {
      live: "https://swasthya-neeti.vercel.app/",
      code: [{ label: "GitHub", href: "https://github.com/mitarthpathak/Swasthya-Neeti" }],
    },
    images: {
      hero: { src: "/work/swasthya-neeti/hero.webp", width: 1440, height: 900, alt: "Swasthya-Neeti landing page: “Listen. Diagnose. Heal.” next to a 3D medical kit." },
      gallery: [
        { src: "/work/swasthya-neeti/chat.webp", width: 1440, height: 760, alt: "The chat page intro with voice-first triage cards", caption: "The chat entry page, before sign-in." },
        { src: "/work/swasthya-neeti/phone.webp", width: 780, height: 1688, alt: "Swasthya-Neeti landing page on a phone", caption: "The same landing page at 390 px.", phone: true },
        { src: "/work/swasthya-neeti/features.webp", width: 1440, height: 900, alt: "Feature snapshot section with health worker mode and medicine nudges", caption: "Feature section of the landing page." },
      ],
    },
  },
  {
    slug: "run-neeti",
    title: "Run-Neeti",
    year: "2026",
    date: "May 2026",
    updated: "2026-07-01",
    status: "Live",
    roleShort: "Solo build",
    mark: "*",
    variant: "serif",
    cardType: "AI powered graph Synthesis",
    oneLiner: "Upload a PDF, get an interactive knowledge graph and a quiz.",
    summary:
      "A study tool that reads a PDF, asks an LLM for a hierarchical mind-map of its concepts, and draws it as an interactive force-directed graph with a summary and quiz.",
    problem:
      "Long PDFs are hard to hold in your head: the relationships between ideas are spread across pages. I wanted a tool that turns a document into a map you can explore, then checks what you remember.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "a map you can explore",
    myRole:
      "I built it on my own: the React and D3 front end, the Express upload pipeline, the prompts and the MongoDB cache.",
    // TODO(mitarth): Was this a hackathon or course project, and was anyone else involved?
    stack: ["React 19", "TypeScript", "D3-force", "Express", "Groq", "MongoDB", "Vercel"],
    tags: ["ai", "web"],
    features: [
      "Drop a PDF and the server extracts its text with pdf-parse.",
      "An LLM returns a hierarchy: one core concept, three headers, two sub-topics each and 1–3 leaf concepts per sub-topic.",
      "The graph is drawn with D3-force, sized and placed by node type and importance.",
      "A generated summary with a difficulty score and a study roadmap.",
      "A quiz built from the graph's own nodes.",
      "Signed-in users can reopen their past graphs.",
    ],
    ai: {
      approach:
        "Groq's llama-3.1-8b-instant in JSON mode. The text is split into up to five overlapping 10,000-character chunks; each chunk becomes a partial graph, and the server merges nodes and edges.",
      data:
        "Only the uploaded PDF. Results are cached in MongoDB under a SHA-256 hash of the text, so the same document is never analysed twice.",
      quality:
        "Checked by hand on sample PDFs. The prompt fixes the tree shape so the output stays readable.",
      // TODO(mitarth): Did you measure graph quality or test with other students?
      limits:
        "Only about the first 50,000 characters are analysed. If the model fails after retries, a word-frequency fallback builds a much simpler graph titled “Content Analysis”.",
    },
    architecture: {
      text:
        "The React client uploads a PDF to an Express API (wrapped as a Vercel function). The API extracts text, checks the MongoDB cache, queues chunked requests to Groq one at a time, merges the partial graphs and stores the result.",
      nodes: [
        { id: "client", label: "React + D3", note: "Upload · graph · quiz" },
        { id: "api", label: "Express API", note: "pdf-parse · p-queue" },
        { id: "groq", label: "Groq", note: "llama-3.1-8b-instant" },
        { id: "db", label: "MongoDB", note: "Cache by SHA-256" },
      ],
      edges: [
        ["client", "api", "PDF upload"],
        ["api", "db", "cache lookup"],
        ["api", "groq", "chunks → JSON"],
      ],
    },
    decisions: [
      {
        decision: "Split the PDF into overlapping chunks and merge the graphs.",
        why: "A whole document does not fit one prompt; a 1,000-character overlap keeps ideas that span a chunk boundary.",
        tradeoff: "Merging can duplicate or loosely connect concepts, and it caps coverage at five chunks.",
      },
      {
        decision: "Send one request every five seconds through a queue, with long back-off on 429s.",
        why: "It was built on a free-tier key with strict rate limits.",
        tradeoff: "Large documents take noticeably longer to process.",
      },
      {
        decision: "Fall back to a word-frequency graph when the model fails.",
        why: "The user always gets something back instead of an error screen.",
        tradeoff: "The fallback graph is shallow and clearly less useful.",
      },
    ],
    results: [
      "Deployed and publicly available at run-neeti.vercel.app.",
      "Repeat uploads of the same document are served from the cache without calling the model.",
    ],
    // TODO(mitarth): Any usage numbers or feedback you can share?
    learnings: [
      "Asking an LLM for a fixed JSON shape is only half the job; you still need to parse defensively and merge carefully.",
      "Caching by content hash is the cheapest way to cut model calls.",
      "Rate limits shape the architecture as much as the features do.",
    ],
    links: {
      live: "https://run-neeti.vercel.app/",
      code: [{ label: "GitHub", href: "https://github.com/mitarthpathak/Run-Neeti" }],
    },
    images: {
      hero: { src: "/work/run-neeti/hero.webp", width: 1440, height: 900, alt: "Run-Neeti landing page: “Uncover the Hidden Links”." },
      gallery: [
        { src: "/work/run-neeti/phone.webp", width: 780, height: 1688, alt: "Run-Neeti landing page on a phone", caption: "Landing page at 390 px, with the bottom navigation.", phone: true },
      ],
    },
  },
  {
    slug: "devtask",
    title: "DevTask",
    year: "2026",
    date: "July 2026",
    updated: "2026-09-25",
    status: "Code only",
    roleShort: "Solo build",
    mark: "D",
    variant: "solid",
    cardType: "JWT-secured Task Management REST API",
    oneLiner: "A Spring Boot REST API where every user manages their own tasks behind JWT auth.",
    summary:
      "A Spring Boot REST API with user registration, JWT login and task CRUD, backed by PostgreSQL through Spring Data JPA.",
    problem:
      "I wanted to learn how a real Java backend handles authentication end to end: hashing passwords, issuing tokens, protecting routes and tying data to the user who owns it.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "authentication end to end",
    myRole:
      "I wrote it on my own: the entities, repositories, services, controllers, the JWT filter and the security configuration.",
    stack: ["Java 17", "Spring Boot 3.3", "Spring Security", "JPA", "PostgreSQL", "JWT", "Maven"],
    tags: ["backend"],
    features: [
      "POST /register creates a user; passwords are hashed with BCrypt (strength 12).",
      "POST /login returns a signed JWT that expires after 30 minutes.",
      "Every other route requires `Authorization: Bearer <token>`.",
      "Task CRUD: title, description, status and due date.",
      "Tasks belong to users through a many-to-one relation, and GET /tasks returns only the caller's tasks.",
      "A global exception handler returns JSON errors with status, message and timestamp.",
    ],
    endpoints: [
      { method: "POST", path: "/register", auth: false, note: "Create a user" },
      { method: "POST", path: "/login", auth: false, note: "Returns a JWT" },
      { method: "GET", path: "/tasks", auth: true, note: "Your tasks" },
      { method: "GET", path: "/tasks/{id}", auth: true, note: "One task" },
      { method: "POST", path: "/tasks", auth: true, note: "Create a task" },
      { method: "POST", path: "/tasks/{id}", auth: true, note: "Update a task" },
      { method: "DELETE", path: "/tasks/{id}", auth: true, note: "Delete a task" },
    ],
    example: {
      request: `POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Write README",
  "description": "Document the endpoints",
  "status": "OPEN",
  "dueDate": "2026-08-01"
}`,
      response: `200 OK

{
  "id": 1,
  "username": "mitarth",
  "title": "Write README",
  "description": "Document the endpoints",
  "status": "OPEN",
  "dueDate": "2026-08-01"
}`,
    },
    architecture: {
      text:
        "A classic layered Spring Boot app. A JWT filter runs before Spring Security's username/password filter, then requests flow controller → service → repository → PostgreSQL. Sessions are stateless.",
      nodes: [
        { id: "client", label: "Client", note: "curl · Postman" },
        { id: "filter", label: "JwtFilter", note: "Bearer token" },
        { id: "controller", label: "Controllers", note: "Auth · Tasks" },
        { id: "service", label: "Services", note: "Task · User · JWT" },
        { id: "db", label: "PostgreSQL", note: "JPA repositories" },
      ],
      edges: [
        ["client", "filter", "HTTP"],
        ["filter", "controller", "authenticated"],
        ["controller", "service", "DTOs"],
        ["service", "db", "JPA"],
      ],
    },
    decisions: [
      {
        decision: "Stateless JWT authentication instead of server sessions.",
        why: "Any client can call the API with a header, and the server keeps no session state.",
        tradeoff: "A token stays valid until it expires; there is no logout or revocation.",
      },
      {
        decision: "Separate request and response DTOs from the JPA entities.",
        why: "The API never exposes internal fields, and the response carries the owner's username rather than the whole user object.",
        tradeoff: "More mapping code in the service layer.",
      },
      {
        decision: "Tie each task to its owner with a many-to-one relation.",
        why: "The task list can be filtered by the authenticated username in one repository query.",
        tradeoff: "Single-task routes need their own ownership check, which is still on my list.",
      },
    ],
    results: [
      "Source code is public on GitHub with setup steps and an endpoint table.",
    ],
    learnings: [
      "How Spring Security's filter chain works, and where a custom JWT filter belongs in it.",
      "Filtering the list by owner is not the same as authorising every route: get, update and delete by id should also check ownership. That is the next fix.",
      "Secrets belong in environment variables, not in application.properties.",
    ],
    links: {
      live: null,
      code: [{ label: "GitHub", href: "https://github.com/mitarthpathak/DevTask" }],
    },
    images: {
      // No UI exists, so this is a visual built from the real endpoints — never a fake screenshot.
      hero: { src: "/work/devtask/hero.webp", width: 1440, height: 900, alt: "DevTask endpoint overview: register and login, then Bearer-protected task routes.", generated: true },
      gallery: [],
    },
  },
  {
    slug: "yap-render",
    title: "Yap-Render",
    year: "2026",
    date: "August 2026",
    updated: "2026-09-17",
    status: "Live",
    roleShort: "Team of five",
    mark: "Y",
    variant: "script",
    cardType: "Speech/Text to Indian Sign Language Translator",
    oneLiner: "Speech or text in, Indian Sign Language out, signed by a 3D avatar.",
    summary:
      "A speech-to-Indian-Sign-Language translator for Smart India Hackathon 2026: a Next.js web app, a native Android app and a Chrome extension, all driving the same 3D signing avatar.",
    problem:
      "Most conversations and online content are audio or text first, which shuts out people who rely on Indian Sign Language. The goal was to turn everyday speech into ISL signing, live, without needing an interpreter.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "without needing an interpreter",
    myRole:
      "One of a five-person team (Mitarth Pathak, Navneet Singh, Gaurav Soni, Deep Panchal, Nooren Qureshi) building for SIH 2026. The web app, the Android app and the extension all live under my GitHub account.",
    // TODO(mitarth): Exactly which parts did you build, and how did the team split the work? What happened at SIH?
    stack: ["Next.js 16", "React 19", "TypeScript", "Three.js / R3F", "Gemini 2.5 Flash", "Kotlin", "Jetpack Compose", "Chrome MV3"],
    tags: ["ai", "web", "mobile"],
    products: [
      {
        name: "Web app",
        text: "Live speech through the Web Speech API or typed text, translated to ISL gloss and signed by a Three.js avatar in the browser.",
      },
      {
        name: "Android app",
        text: "A Kotlin and Jetpack Compose app using Android's SpeechRecognizer, the avatar inside a WebView, and saved projects in Room.",
      },
      {
        name: "Browser extension",
        text: "A Manifest V3 extension that signs speech from the mic or from a tab's audio in an always-on-top Picture-in-Picture window, with on-device Whisper for tab audio.",
      },
    ],
    features: [
      "Speech or typed English/Hindi is converted into ISL gloss: time words first, subject–object–verb order, negation and question words at the end.",
      "The avatar can play 164 gloss tokens; unknown words and names are fingerspelled letter by letter.",
      "An offline rule-based gloss engine works with no API key and takes over if the online call fails.",
      "The extension transcribes tab audio on the device with Whisper through transformers.js, so it needs no server.",
      "Hotkeys in the extension to toggle, pause and mute signing.",
    ],
    ai: {
      approach:
        "The web app sends text to Gemini 2.5 Flash with a system prompt that encodes ISL grammar and the exact list of signs the avatar knows, at temperature 0, with thinking disabled for speed and a JSON array response schema.",
      data:
        "No training data. The model can only output tokens from the fixed 164-sign vocabulary, and the server drops anything else.",
      quality:
        "Output is validated against the vocabulary; empty or malformed replies return an error and the client falls back to the rule-based engine.",
      // TODO(mitarth): Was the signing checked with ISL users or interpreters?
      limits:
        "The vocabulary is small, so many words are fingerspelled, and gloss order is an approximation of real ISL grammar. Facial expression, a core part of ISL, is not modelled.",
    },
    architecture: {
      text:
        "Three clients share one pipeline: speech to text, text to ISL gloss (Gemini online or a rule-based engine offline), then gloss to sign animations on a 3D avatar rig.",
      nodes: [
        { id: "input", label: "Speech / text", note: "Web · Android · tab audio" },
        { id: "stt", label: "Speech-to-text", note: "Web Speech · SpeechRecognizer · Whisper" },
        { id: "gloss", label: "ISL gloss", note: "Gemini 2.5 Flash · rule engine" },
        { id: "avatar", label: "3D avatar", note: "Three.js sign animations" },
      ],
      edges: [
        ["input", "stt", "audio"],
        ["stt", "gloss", "text"],
        ["gloss", "avatar", "tokens"],
      ],
    },
    decisions: [
      {
        decision: "Constrain the model to the avatar's exact sign vocabulary.",
        why: "The avatar can only play signs that were animated; any other token would be a dead end.",
        tradeoff: "Out-of-vocabulary words have to be fingerspelled, which is slow to watch.",
      },
      {
        decision: "Keep a deterministic offline gloss engine alongside the model.",
        why: "It works with no key, no network and no rate limit, and it covers model failures.",
        tradeoff: "Two code paths to keep in step, and the rules are less flexible than the model.",
      },
      {
        decision: "Run Whisper on the device for the extension's tab audio.",
        why: "No server, no key and no audio leaves the machine.",
        tradeoff: "A model download of about 50 MB on first use, and captions lag a few seconds.",
      },
    ],
    results: [
      "The web app is deployed and publicly available at yap-render.vercel.app.",
      "One signing pipeline shipped on three platforms: web, Android and a Chrome/Edge extension.",
    ],
    // TODO(mitarth): Any SIH result or user feedback you can share?
    learnings: [
      "Sign languages have their own grammar; translating word by word does not work.",
      "Sharing one core (gloss engine, dictionary, avatar) across three platforms saved the most time.",
      "Browser extensions have hard limits, like CSP blocking import maps, that shape the build.",
    ],
    links: {
      live: "https://yap-render.vercel.app/",
      code: [
        { label: "Web", href: "https://github.com/mitarthpathak/yap-render" },
        { label: "Android", href: "https://github.com/mitarthpathak/yap-render-APP" },
        { label: "Extension", href: "https://github.com/mitarthpathak/yap-render-extension" },
      ],
    },
    images: {
      hero: { src: "/work/yap-render/hero.webp", width: 1440, height: 900, alt: "Yap & Render web app: “Say it. See it. Share it.” with the 3D signing avatar." },
      gallery: [
        { src: "/work/yap-render/phone.webp", width: 780, height: 1688, alt: "Yap & Render on a phone", caption: "The web app at 390 px.", phone: true },
        { src: "/work/yap-render/features.webp", width: 1440, height: 900, alt: "“One conversation. Two ways to be heard.” feature section", caption: "Feature section of the web app." },
        { src: "/work/yap-render/extension.webp", width: 580, height: 1040, alt: "Yap & Render browser extension popup with audio source and avatar settings", caption: "The extension's popup: mic or tab audio, sign speed, avatar.", phone: true },
      ],
    },
  },
  {
    slug: "citysync",
    title: "CitySync",
    year: "2026",
    date: "September 2026",
    updated: "2026-09-25",
    status: "Code only",
    // TODO(mitarth): Is CitySync deployed anywhere? Add the URL to links.live and set status to "Live".
    roleShort: "Team of four",
    mark: "C",
    variant: "serif",
    cardType: "Live Civic Data on a 3D Globe",
    oneLiner: "Live civic data feeds fused into one stream, on a 3D globe and a local map of Jaipur.",
    summary:
      "A civic dashboard that pulls earthquakes, weather, air quality, official alerts, news and climate data from public feeds into one normalized event stream, shown on a 3D globe for the world and a Leaflet map for a chosen spot in Jaipur.",
    problem:
      "City information is scattered across dozens of feeds: weather here, air quality there, disaster alerts somewhere else. We wanted one place that turns all of it into a single, honest picture of what is happening around you right now.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "a single, honest picture",
    myRole:
      "One of a four-person team (Mitarth Pathak, Deep Panchal, Navneet Singh, Jayant Katariya). The team page credits me with engineering, UI and 3D, and I wrote most of the commits, including the Tier 1 data sources, the worldwide WMO and GDACS alerts, the local map and the landing page animations.",
    // TODO(mitarth): Was this built for a hackathon? It was built over two days (24–25 Sep 2026).
    stack: ["React 19", "Express 5", "react-globe.gl", "Leaflet", "Three.js", "Tailwind CSS", "Vite"],
    tags: ["web", "backend"],
    features: [
      "A 3D globe (react-globe.gl) with events coloured and sized by severity, plus pulsing rings for the most severe ones.",
      "A local view for Amer or Achrol in Jaipur: an area pulse, key readings, a Leaflet map with clustered pins and a live feed.",
      "26 source adapters, among them USGS earthquakes, Open-Meteo weather and air quality, NDMA SACHET alerts, WMO and GDACS warnings, GDELT news and NASA POWER climate data.",
      "A one-line “now, next, what to do” brief for any point, built from cached events and an hourly forecast.",
      "Every event carries a tag: real live, real static, media reported, estimated or simulated. Simulated data is always labelled.",
      "An offline demo mode that serves a mock file and makes no network calls.",
    ],
    architecture: {
      text:
        "An Express backend runs every source as an independent adapter on its own timer and keeps the results in an in-memory cache. No request ever triggers an upstream call. The Vite + React front end polls the API and draws the events on the globe or the local map.",
      nodes: [
        { id: "feeds", label: "Public feeds", note: "USGS · Open-Meteo · SACHET · GDELT" },
        { id: "adapters", label: "Source adapters", note: "One timer each" },
        { id: "cache", label: "Express API", note: "Cache · /events · /health" },
        { id: "client", label: "React client", note: "Globe · Leaflet map" },
      ],
      edges: [
        ["feeds", "adapters", "fetch"],
        ["adapters", "cache", "normalized events"],
        ["cache", "client", "polling"],
      ],
    },
    decisions: [
      {
        decision: "Refresh every source in the background and answer requests only from the cache.",
        why: "A slow or rate-limited feed can never make the page slow, and visitors never multiply upstream calls.",
        tradeoff: "Data is only as fresh as each source's refresh interval, from one minute to a day.",
      },
      {
        decision: "Tag every event with where it came from, and always mark mock data as simulated.",
        why: "A civic dashboard is only useful if people can trust it, so guessed or fake data must never look real.",
        tradeoff: "More labels on screen, and news without a named place is dropped rather than guessed.",
      },
      {
        decision: "Keep the globe mounted and paused while the local view is open.",
        why: "Starting three.js again is expensive; the Leaflet map is cheap to mount and unmount.",
        tradeoff: "The globe's memory stays in use while it is hidden.",
      },
    ],
    results: [
      "Source code is public on GitHub, with the full API, event schema and source list in the README.",
      "Works offline in demo mode, and a failing source never takes the others down.",
    ],
    learnings: [
      "Every public feed fails in its own way, so each one needs its own timer, timeout and fallback.",
      "Honesty about data has to be built into the schema, not added to the UI later.",
      "Rate limits like GDELT's decide how a pipeline is scheduled.",
    ],
    links: {
      live: null,
      code: [{ label: "GitHub", href: "https://github.com/mitarthpathak/CitySync" }],
    },
    images: {
      hero: { src: "/work/citysync/hero.webp", width: 1440, height: 900, alt: "CitySync global view: “The world, in pulse.” with a 3D globe and the list of data layers." },
      gallery: [
        { src: "/work/citysync/local.webp", width: 1440, height: 900, alt: "CitySync local view for Amer, Jaipur with the area pulse and five key readings", caption: "The local view for Amer, Jaipur, in offline demo mode." },
        { src: "/work/citysync/phone.webp", width: 780, height: 1688, alt: "CitySync local view on a phone", caption: "The local view at 390 px.", phone: true },
        { src: "/work/citysync/landing.webp", width: 1440, height: 900, alt: "CitySync landing page: “Know your city. In a heartbeat.”", caption: "The landing page." },
      ],
    },
  },
  {
    slug: "doxentra",
    title: "Doxentra",
    year: "2026",
    date: "October 2026",
    updated: "2026-10-15",
    status: "Live",
    roleShort: "Lead developer",
    mark: "D",
    variant: "script",
    cardType: "AI Document Intelligence for Indian Documents",
    oneLiner: "Upload invoices, IDs and marksheets; get checked fields, flagged problems and a knowledge graph.",
    summary:
      "A document intelligence app that reads PDFs, scans and photos, classifies them, extracts fields with confidence scores and source references, flags missing or inconsistent details, and builds a knowledge graph, roadmap and quiz from the content.",
    problem:
      "Schools and offices still check piles of certificates, invoices and IDs by hand, and the mistakes hide in the details: a wrong total, an expired certificate, an Aadhaar number with a bad check digit. I wanted a tool that reads the documents and points a reviewer straight at what needs a second look.",
    // Phrase inside `problem` that gets the yellow highlight
    highlight: "what needs a second look",
    myRole:
      "I built it as the lead developer: the Gemini pipeline, the OCR cross-check, the Express API, the validation rules, the review workflows and the React interface. Shruti added the app-wide dark mode. Doxentra grew out of Glyph, my earlier version of the same engine.",
    // TODO(mitarth): Was this a hackathon or course project, and who else was on the team?
    stack: ["React 19", "TypeScript", "Express 5", "Gemini", "Tesseract.js", "PaddleOCR", "MongoDB", "Supabase"],
    tags: ["ai", "web", "backend"],
    features: [
      "Upload PDFs, scans or photos up to 50 MB; large files go straight to Supabase Storage.",
      "Classifies each document and extracts its fields, each with a confidence score and the page and quote it came from.",
      "Rule checks for Indian documents: the Verhoeff checksum for Aadhaar, formats for PAN and GSTIN, totals and dates.",
      "Document Twin: upload two versions of an invoice and see exactly which fields changed, then approve or flag them.",
      "Packets: build a checklist from a circular, add a student's documents and get missing proof, mismatches and expired certificates in priority order.",
      "Ask questions about your documents and get answers with verified citations, plus a D3 knowledge graph, roadmap and quiz.",
    ],
    ai: {
      approach:
        "A three-stage Gemini pipeline: page OCR with Gemini vision (three pages at a time, skipped when the PDF already has clean text), then text-only reasoning for classification and fields, then a targeted vision re-check of low-confidence fields. Requests are spread across two API keys with failover on rate limits.",
      data:
        "No training. The model works only from the uploaded documents. Tesseract and PaddleOCR read the same pages locally as an independent cross-check.",
      quality:
        "A benchmark against hand-labelled samples: on a digital invoice, a scanned student ID and a bilingual Hindi–English notice, the Gemini pipeline got 84.4% of fields right and classified all three correctly, against 65.6% and two of three for the older pipeline. About 40 server test files cover the API, OCR, validation and workflows.",
      limits:
        "The benchmark is three documents, one run each, so it is a sanity check, not proof. OCR agreement is evidence, not correctness, and unclear fields are left for a human instead of being guessed.",
      safety:
        "Aadhaar numbers, PAN, emails and phone numbers are masked by default on exports and on screen. Fields that fail a checksum or where the OCR engines disagree are withheld and sent to review, and every human correction is written to an audit trail.",
    },
    architecture: {
      text:
        "The React client uploads files to Supabase Storage and starts a job on the Express API. A background queue runs the Gemini pipeline and the local OCR cross-check, then validation, and stores the results in MongoDB, which the client polls.",
      nodes: [
        { id: "client", label: "React client", note: "Upload · review · graph" },
        { id: "api", label: "Express API", note: "Job queue · validation" },
        { id: "gemini", label: "Gemini", note: "OCR · reasoning" },
        { id: "ocr", label: "Local OCR", note: "Tesseract · PaddleOCR" },
        { id: "db", label: "MongoDB", note: "Jobs · extractions" },
      ],
      edges: [
        ["client", "api", "jobs · polling"],
        ["api", "gemini", "pages · text"],
        ["api", "ocr", "cross-check"],
        ["api", "db", "Mongoose"],
      ],
    },
    decisions: [
      {
        decision: "Upload files straight to Supabase Storage instead of through the API.",
        why: "Vercel functions cap request bodies at 4.5 MB, and real scans are often bigger.",
        tradeoff: "One more service to configure and keep in sync with the database.",
      },
      {
        decision: "Cross-check fields with two local OCR engines and withhold anything they disagree on.",
        why: "A wrong amount or ID number is worse than an empty field that a person fills in.",
        tradeoff: "Fewer fields are filled in automatically, so reviewers do more work.",
      },
      {
        decision: "Run long documents as background jobs with page-level checkpoints.",
        why: "Multi-page PDFs and rate limits can outlast a single request, and a retry should not start from page one.",
        tradeoff: "The client has to poll for results, and the queue adds moving parts.",
      },
    ],
    results: [
      "Deployed on Vercel at doxentra.vercel.app.",
      "84.4% field accuracy and 3 of 3 correct classifications on the live benchmark samples.",
    ],
    // TODO(mitarth): Any usage numbers or feedback you can share?
    learnings: [
      "Measuring field accuracy against ground truth showed which pipeline changes actually helped.",
      "Serverless limits, like body size and bundling native OCR models, shape the architecture.",
      "Admitting uncertainty and handing a field to a person is a feature, not a failure.",
    ],
    links: {
      // TODO(mitarth): Confirm this is the live URL; it is the deployment named in the repo's docs.
      live: "https://doxentra.vercel.app/",
      code: [
        { label: "Doxentra", href: "https://github.com/mitarthpathak/Doxentra" },
        { label: "Glyph", href: "https://github.com/mitarthpathak/Glyph" },
      ],
    },
    images: {
      hero: { src: "/work/doxentra/hero.webp", width: 1440, height: 900, alt: "Doxentra landing page: “Uncover the Hidden Links”." },
      gallery: [
        { src: "/work/doxentra/upload.webp", width: 1440, height: 900, alt: "Doxentra upload screen with the processing mode toggle and a drop zone for PDFs and images", caption: "The upload screen: PDFs, scans or photos up to 50 MB." },
        { src: "/work/doxentra/phone.webp", width: 780, height: 1688, alt: "Doxentra landing page on a phone", caption: "Landing page at 390 px, with the bottom navigation.", phone: true },
      ],
    },
  },
];

export const sectionOrder = [
  { id: "problem", label: "Problem" },
  { id: "role", label: "My role" },
  { id: "built", label: "What I built" },
  { id: "architecture", label: "Architecture" },
  { id: "decisions", label: "Key decisions" },
  { id: "results", label: "Results" },
  { id: "learned", label: "What I learned" },
];

export function getProject(slug) {
  return projects.find((p) => p.slug === slug) ?? null;
}

export function getNextProject(slug) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
