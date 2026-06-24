import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // vitePreprocess lets us write <script lang="ts"> and modern CSS in .svelte files.
  preprocess: vitePreprocess(),
};
