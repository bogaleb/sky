import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.sky.learn',
  appName: 'Sky',
  webDir: 'public',
  server: {
    // The native shell loads the deployed web app; all data/APIs stay server-side.
    url: 'https://sky-one-eta.vercel.app',
    cleartext: false,
  },
  android: {
    // Keep the WebView on the app; open external links in the system browser.
    allowMixedContent: false,
  },
};

export default config;
