import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gsaab.dev',
  output: 'static',
  trailingSlash: 'always',
  markdown: { shikiConfig: { theme: 'github-light' } },
});
