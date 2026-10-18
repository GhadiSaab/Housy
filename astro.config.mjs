import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gsaab.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: page => !new URL(page).pathname.startsWith('/404') })],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
