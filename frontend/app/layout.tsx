import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ApplyPilot — AI College Application Management',
    template: '%s | ApplyPilot',
  },
  description: 'AI-powered college application management platform for consulting agencies. Automate essays, deadlines, and student pipelines.',
  keywords: ['college consulting', 'application management', 'AI automation', 'college counseling', 'admissions'],
  authors: [{ name: 'ApplyPilot' }],
  openGraph: {
    title: 'ApplyPilot — AI College Application Management',
    description: 'AI-powered college application management platform for consulting agencies.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ApplyPilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyPilot — AI College Application Management',
    description: 'AI-powered college application management platform for consulting agencies.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:text-brand focus:px-4 focus:py-2 focus:rounded-[6px] focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand"
        >
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
