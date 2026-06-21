import "./globals.css";

export const metadata = {
  title: "Nithin M Warrier — Portfolio",
  description: "Visual designer portfolio — Brand, Web & Product Design",
  openGraph: {
    title: "Nithin M Warrier — Portfolio",
    description: "Visual designer portfolio",
    url: "https://nithinmwarrier.com",
    siteName: "Nithin M Warrier",
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
        {children}
      </body>
    </html>
  );
}
