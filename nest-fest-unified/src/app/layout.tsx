import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'NEST FEST 2025 - Student Entrepreneurship Competition',
    template: '%s | NEST FEST 2025'
  },
  description: 'Join the premier student entrepreneurship competition. Compete for over $200,000 in prizes across multiple categories including technology, sustainability, and social impact.',
  keywords: ['entrepreneurship', 'student competition', 'startup', 'innovation', 'technology', 'sustainability'],
  authors: [{ name: 'NEST FEST Team' }],
  creator: 'NEST FEST',
  publisher: 'NEST FEST',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nestfest.app',
    siteName: 'NEST FEST 2025',
    title: 'NEST FEST 2025 - Student Entrepreneurship Competition',
    description: 'Join the premier student entrepreneurship competition. Compete for over $200,000 in prizes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NEST FEST 2025',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEST FEST 2025',
    description: 'Premier student entrepreneurship competition',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`}
        suppressHydrationWarning
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}