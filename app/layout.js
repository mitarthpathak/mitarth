import "./globals.css";
import Menu from "./components/Menu";
import SignatureAnimation from "./components/SignatureAnimation";

export const metadata = {
  title: "Mitarth The Great — Portfolio",
  description: "Visual designer portfolio — Brand, Web & Product Design",
  openGraph: {
    title: "Mitarth The Great — Portfolio",
    description: "Visual designer portfolio",
    url: "https://mitarththegreat.com",
    siteName: "Mitarth The Great",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col overscroll-none overflow-x-clip">
        {/* Signature intro animation — rendered above everything */}
        <SignatureAnimation />
        {children}
        
        {/* Global Morphing Menu */}
        <Menu />
      </body>
    </html>
  );
}
