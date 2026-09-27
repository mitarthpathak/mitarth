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

// Runs before first paint. Decides whether Mitarth's signature intro plays:
// on every full load of "/" (the original ~6 s draw), never under reduced
// motion. The Skip button or Esc end it early; otherwise it ends at 6 s.
// Handled here so it works even before hydration.
const INTRO_SCRIPT = `(function(){var d=document.documentElement,v="skip";try{if(location.pathname==="/"&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){v="play"}}catch(e){}d.setAttribute("data-intro",v);if(v!=="play")return;function done(){if(d.getAttribute("data-intro")==="play")d.setAttribute("data-intro","done");removeEventListener("keydown",key,true);removeEventListener("click",click,true)}function key(e){if(e.key==="Escape")done()}function click(e){var t=e.target;if(t&&t.closest&&t.closest(".sig-skip"))done()}addEventListener("keydown",key,true);addEventListener("click",click,true);setTimeout(done,6000)})();`;

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
