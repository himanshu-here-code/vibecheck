import type { Metadata } from 'next';
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VibeCheck — Is your app vibecoded?',
  description:
    'Paste a GitHub repo. Get an honest report on what makes your app look unfinished.',
  metadataBase: new URL('https://your-deploy-url.vercel.app'),
  openGraph: {
    title: 'VibeCheck — Is your app vibecoded?',
    description:
      'Paste a GitHub repo. Get an honest report on what makes your app look unfinished.',
    url: 'https://your-deploy-url.vercel.app',
    siteName: 'VibeCheck',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeCheck — Is your app vibecoded?',
    description:
      'Paste a GitHub repo. Get an honest report on what makes your app look unfinished.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}