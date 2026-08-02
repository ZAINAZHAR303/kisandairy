import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kisan Dairy — Cow Farm Management System for Pakistani Farmers',
  description: 'Free online dairy farm management system for Pakistani farmers. Track milk sales, vaccinations, insemination records and expenses for your cows and buffaloes.',
  keywords: 'dairy farm management pakistan, cow farm app, kisan dairy, milk tracking app pakistan, cattle management system, buffalo farm record keeping',
  openGraph: {
    title: 'Kisan Dairy — Cow Farm Management System',
    description: 'Manage your dairy farm easily. Track milk sales, vaccinations, insemination and expenses. Free for Pakistani farmers.',
    url: 'https://kisandairy.tech',
    siteName: 'Kisan Dairy',
    images: [
      {
        url: 'https://kisandairy.tech/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kisan Dairy — Cow Farm Management System',
      },
    ],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kisan Dairy — Cow Farm Management System',
    description: 'Free dairy farm management for Pakistani farmers. Track milk, vaccines, insemination and expenses.',
    images: ['https://kisandairy.tech/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://kisandairy.tech',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#1a2f5e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kisan Dairy" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  )
}
