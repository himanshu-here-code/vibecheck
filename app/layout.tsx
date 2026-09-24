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

const SITE_URL = 'https://vibecheck-one-swart.vercel.app';
const DEFAULT_TITLE = 'VibeCheck — Is your app vibecoded?';
const DEFAULT_DESCRIPTION =
  'Scan any GitHub repo to strip out lazy AI UI and robotic copy.';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ repo?: string; d?: string }>;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : undefined;
  const repo = params?.repo;
  const encoded = params?.d;

  if (repo) {
    const ogParams = new URLSearchParams({ repo });
    if (encoded) ogParams.set('d', encoded);

    const ogUrl = `${SITE_URL}/api/og?${ogParams.toString()}`;

    return {
      metadataBase: new URL(SITE_URL),
      title: `${repo} — VibeCheck`,
      description: `Scan results for ${repo}`,
      openGraph: {
        title: `${repo} — VibeCheck`,
        description: `Scan results for ${repo}`,
        url: `${SITE_URL}/?repo=${encodeURIComponent(repo)}${encoded ? `&d=${encoded}` : ''}`,
        siteName: 'VibeCheck',
        type: 'website',
        images: [
          {
            url: ogUrl,
            width: 1200,
            height: 630,
            alt: `VibeCheck scan for ${repo}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${repo} — VibeCheck`,
        description: `Scan results for ${repo}`,
        images: [ogUrl],
      },
    };
  }

  const defaultOgUrl = `${SITE_URL}/api/og?repo=vercel/chatbot`;
  return {
    metadataBase: new URL(SITE_URL),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      url: SITE_URL,
      siteName: 'VibeCheck',
      type: 'website',
      images: [
        { url: defaultOgUrl, width: 1200, height: 630, alt: 'VibeCheck' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      images: [defaultOgUrl],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}