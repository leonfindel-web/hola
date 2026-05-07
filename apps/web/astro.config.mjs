import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://leonfindel.cl',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  integrations: [svelte(), sitemap()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  vite: {
    resolve: {
      alias: {
        '@shared': new URL('../../shared', import.meta.url).pathname,
      },
    },
  },
});
