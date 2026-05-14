import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// ── Viewport ──────────────────────────────────────────────────────────────────
// In Next.js 15+, viewport config must be a separate export (not inside metadata).

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Respect the notch / rounded corners on modern phones
  viewportFit: 'cover',
  // Matches light/dark OS theme
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  applicationName: 'HabitFlow',
  title: 'HabitFlow',
  description: 'Отслеживай привычки, строй свой поток',

  // Apple-specific PWA tags
  appleWebApp: {
    capable: true,              // <meta name="apple-mobile-web-app-capable" content="yes">
    title: 'HabitFlow',
    statusBarStyle: 'black-translucent', // blends into content area
  },

  // Disable auto-linking phone numbers on iOS
  formatDetection: { telephone: false },

  // Open Graph (nice share previews)
  openGraph: {
    title: 'HabitFlow',
    description: 'Отслеживай привычки, строй свой поток',
    type: 'website',
  },
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        {/* Register the service worker after the page is interactive.
            Required for Chrome (Android) PWA install prompt. */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js')
              })
            }
          `}
        </Script>
      </body>
    </html>
  )
}
