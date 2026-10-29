import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gsaab.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: page => !/^\/(404|p\/)/.test(new URL(page).pathname) })],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
