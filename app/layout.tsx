import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sky — Learn through adventure',
  description:
    'Sky is a learning adventure for children ages 3–8: reading, math, science, music and more, guided by characters who feel alive. Parents get proof of learning.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
