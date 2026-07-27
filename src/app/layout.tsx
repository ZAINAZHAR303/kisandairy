import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisan Dairy - Cow Farm Management",
  description: "Professional cow farm management system for tracking animals, insemination records, milk sales, expenses, and vaccinations.",
  keywords: ["dairy farm", "cow management", "insemination tracker", "farm management", "kisan dairy"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1a2f5e" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
