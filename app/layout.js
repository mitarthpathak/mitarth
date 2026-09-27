import "./globals.css";
import Menu from "./components/Menu";
import { SpeedInsights } from '@vercel/speed-insights/next';

const SITE_URL = "https://mitarth.vercel.app";
const TITLE = "Mitarth Pathak — AI & Full-Stack Developer";
const DESCRIPTION =
  "Portfolio of Mitarth Pathak, an AI and full-stack developer based in Jaipur. Case studies of Swasthya-Neeti, Run-Neeti, DevTask and Yap-Render.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Mitarth Pathak",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport = {
  viewportFit: "cover",
  themeColor: "#F7F1ED",
};

// Runs before first paint. Decides whether the signature intro plays: only
// on a full load of "/" that is the first home visit of this browser session,
// and never under reduced motion (anything unexpected, like blocked storage,
// skips it). While it plays, Esc, a click/tap anywhere, the Skip button or
// 1.2 s all end it — handled here so it works even before hydration.
const INTRO_SCRIPT = `(function(){var d=document.documentElement,v="skip";try{if(location.pathname==="/"&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("mp:intro")){sessionStorage.setItem("mp:intro","1");v="play"}}catch(e){}d.setAttribute("data-intro",v);if(v!=="play")return;function done(){if(d.getAttribute("data-intro")==="play")d.setAttribute("data-intro","done");removeEventListener("keydown",key,true);removeEventListener("pointerdown",done,true);removeEventListener("click",click,true)}function key(e){if(e.key==="Escape")done()}function click(e){var t=e.target;if(t&&t.closest&&t.closest(".sig-skip"))done()}addEventListener("keydown",key,true);addEventListener("pointerdown",done,true);addEventListener("click",click,true);setTimeout(done,1200)})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-intro="skip" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col overscroll-none overflow-x-clip">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}

        {/* Global Morphing Menu */}
        <Menu />
        <SpeedInsights />
      </body>
    </html>
  );
}
