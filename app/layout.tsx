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
      <body>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#7CC4F2" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined'||!('serviceWorker' in navigator))return;window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){/* offline-capable anyway */});});})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
