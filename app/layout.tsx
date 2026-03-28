import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://studybuddy.cabreraai.com'),
  title: 'StudyBuddy - Homework Helper for Kids',
  description:
    'StudyBuddy is a friendly AI-powered homework assistant designed for children. Get step-by-step help with Maths, English, Science, History, Geography, Coding and more — all aligned to the UK curriculum.',
  keywords: [
    'homework helper',
    'children learning',
    'UK curriculum',
    'KS1',
    'KS2',
    'KS3',
    'KS4',
    'GCSE',
    'maths help',
    'english help',
    'science help',
    'study assistant',
  ],
  authors: [{ name: 'StudyBuddy' }],
  robots: 'index, follow',
  openGraph: {
    title: 'StudyBuddy - Homework Helper for Kids',
    description:
      'Friendly AI homework assistant for children, aligned to the UK curriculum.',
    type: 'website',
    locale: 'en_GB',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4A90D9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={nunito.variable}>
      <body
        className="font-nunito antialiased min-h-screen"
        style={{ backgroundColor: '#F8F9FF' }}
      >
        {children}
      </body>
    </html>
  );
}
