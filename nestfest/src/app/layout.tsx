import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | NestFest',
    default: 'NestFest - Competition Platform'
  },
  description: "A comprehensive online competition platform for student submissions, reviews, and live voting events",
  keywords: ['competition', 'student', 'voting', 'shark tank', 'submissions', 'nestfest', 'austin community college'],
  authors: [{ name: 'NestFest Team' }],
  creator: 'NestFest Team',
  publisher: 'Austin Community College',
  metadataBase: new URL('https://nestfest.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'NestFest',
    title: 'NestFest - Competition Platform',
    description: 'A comprehensive online competition platform for student submissions, reviews, and live voting events',
    url: 'https://nestfest.app',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NestFest Competition Platform'
      }
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nestfest',
    creator: '@nestfest',
    title: 'NestFest - Competition Platform',
    description: 'A comprehensive online competition platform for student submissions, reviews, and live voting events',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
