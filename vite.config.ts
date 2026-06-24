import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// For now this is a plain Vite app that serves the demo gallery (index.html -> src/main.ts).
// Later we'll add a second, library build config here that emits:
//   1. ESM components for use inside other Svelte apps, and
//   2. a bundled custom-elements file for plain HTML / Max's jweb object.
// Both reuse the exact same component source in src/lib — no rewrite needed.
export default defineConfig({
  plugins: [svelte()],
});
