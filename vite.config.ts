// Import defineConfig from vitest/config (a superset of vite's) so the `test`
// block below is type-checked.
import { defineConfig, defaultExclude } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { playwright } from '@vitest/browser-playwright';

// For now this is a plain Vite app that serves the demo gallery (index.html -> src/main.ts).
// Later we'll add a second, library build config here that emits:
//   1. ESM components for use inside other Svelte apps, and
//   2. a bundled custom-elements file for plain HTML / Max's jweb object.
// Both reuse the exact same component source in src/lib — no rewrite needed.
export default defineConfig({
  // svelteTesting() makes Vitest use Svelte's *browser* build and unmounts
  // every rendered component after each test — without it, Svelte 5 components
  // don't render correctly under jsdom.
  plugins: [svelte(), svelteTesting()],
  test: {
    restoreMocks: true, // auto-reset vi.fn() spies between tests
    // Two test projects share this one Vite config:
    projects: [
      {
        // 1. "unit" — runs in jsdom (a fake DOM in Node). Fast; good for logic,
        //    props, ARIA and keyboard. This is where *.test.ts files live.
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./vitest-setup.ts'],
          include: ['src/**/*.test.ts'],
          // browser tests have their own project below
          exclude: [...defaultExclude, '**/*.browser.test.ts'],
          restoreMocks: true,
        },
      },
      {
        // 2. "browser" — runs in real headless Chromium via Playwright. Use it
        //    for things jsdom can't do: real PointerEvents + setPointerCapture
        //    (the drag gesture), layout, and CSS. These files end in
        //    *.browser.test.ts and render via `vitest-browser-svelte`.
        extends: true,
        // Browser mode doesn't include the `browser` export condition by
        // default, so Svelte resolves to its *server* build and mount() throws
        // "lifecycle_function_unavailable". Force `browser` here so the client
        // build is used. (svelteTesting()'s resolveBrowser only kicks in when a
        // `node` condition is already present, which it isn't in browser mode.)
        resolve: { conditions: ['browser'] },
        test: {
          name: 'browser',
          setupFiles: ['./vitest-setup.ts'],
          include: ['src/**/*.browser.test.ts'],
          restoreMocks: true,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
