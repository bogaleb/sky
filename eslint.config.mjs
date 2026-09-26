import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'public/sw.js'],
  },
  {
    // React Compiler rules (new in eslint-plugin-react-hooks 6). The existing
    // kid components predate them and have ~30 findings (mostly setState in
    // effects for timers/animation). They are warnings until each component
    // is refactored and visually re-tested — new code should not add more.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    // Tests parse arbitrary seed JSON; loose typing there is intentional.
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];

export default config;
