// Renders the Open Graph preview images (the card LinkedIn, Slack etc. show
// for a shared link) to public/og/*.png. Social sites don't accept SVG
// previews, so each card is laid out as HTML with the site's own fonts,
// palette and sketches, then screenshotted by headless Chromium.
//
// Usage: node scripts/og/make-og.mjs   (CHROMIUM=/path/to/chromium to override)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'public/og');
const W = 1200, H = 627; // LinkedIn's recommended share image size
const chromium = process.env.CHROMIUM || 'chromium';

const font = rel => pathToFileURL(path.join(root, 'node_modules', rel)).href;
const fonts = `
@font-face { font-family: Serif; font-weight: 200 900; src: url(${font('@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2')}); }
@font-face { font-family: Serif; font-style: italic; font-weight: 200 900; src: url(${font('@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2')}); }
@font-face { font-family: Sans; font-weight: 400; src: url(${font('@fontsource/inter/files/inter-latin-400-normal.woff2')}); }
@font-face { font-family: Sans; font-weight: 600; src: url(${font('@fontsource/inter/files/inter-latin-600-normal.woff2')}); }
@font-face { font-family: Mono; src: url(${font('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')}); }`;

const base = `${fonts}
:root { --paper: #f8f6f0; --ink: #232821; --green: #295c46; --muted: #62685f; --rule: #d5d8cd; --red: #b3432b; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { background: var(--paper); color: var(--ink); font-family: Sans, sans-serif; padding: 56px 76px; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 22px; border-bottom: 1.5px solid var(--rule); }
.wordmark { font-family: Serif; font-size: 44px; letter-spacing: -1.6px; }
.wordmark span, .dot { color: var(--green); }
.where { font-family: Mono; font-size: 17px; letter-spacing: 1.5px; color: var(--muted); }
.eyebrow { font-family: Mono; font-size: 16px; letter-spacing: 2px; color: var(--green); }
.lede { font-size: 25px; line-height: 1.5; color: var(--muted); }
/* Diagrams are reused from the post; show them fully drawn, not mid-animation. */
.draw-in { stroke-dashoffset: 0 !important; stroke-dasharray: none !important; }
.sketch-guides { opacity: .35; }
.sketch-labels { font-family: Mono; font-size: 10px; letter-spacing: .6px; }
.sketch-caption { font-family: Mono; font-size: 8px; letter-spacing: .4px; opacity: .6; }`;

const sketch = readFileSync(path.join(root, 'src/components/InfrastructureSketch.astro'), 'utf8')
  .match(/<svg[\s\S]*<\/svg>/)[0];
const bigPicture = readFileSync(path.join(root, 'public/images/posts/renting-a-brain-in-the-cloud/big-picture.svg'), 'utf8');

const cards = {
  default: `<style>${base}
  .main { flex: 1; display: grid; grid-template-columns: 1fr 360px; gap: 30px; align-items: center; }
  h1 { font-family: Serif; font-weight: 400; font-size: 74px; line-height: 1.08; letter-spacing: -2px; margin: 20px 0 24px; white-space: nowrap; }
  h1 em { color: var(--green); }
  .sketch { color: var(--green); transform: rotate(-1deg); }
  </style>
  <div class="top"><div class="wordmark">ghadi<span>.</span></div><div class="where">gsaab.dev</div></div>
  <div class="main">
    <div><p class="eyebrow">✳ SOFTWARE ENGINEER / SRE &amp; INFRASTRUCTURE</p>
      <h1>Software. Systems.<br><em>Reliability.</em></h1>
      <p class="lede">I build software and the infrastructure<br>that keeps it running.</p></div>
    <div class="sketch">${sketch}</div>
  </div>`,

  'renting-a-brain-in-the-cloud': `<style>${base}
  .main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  h1 { font-family: Serif; font-weight: 400; font-size: 78px; line-height: 1.05; letter-spacing: -2.5px; margin: 16px 0 18px; }
  .row { display: grid; grid-template-columns: 1fr 520px; gap: 34px; align-items: center; }
  .diagram svg { width: 520px; height: auto; display: block; }
  .diagram svg > text:first-of-type { display: none; }
  </style>
  <div class="top"><div class="wordmark">ghadi<span>.</span></div><div class="where">FIELD NOTES / gsaab.dev</div></div>
  <div class="main">
    <h1>Renting a brain<br>by the hour<span class="dot">.</span></h1>
    <div class="row">
      <p class="lede">A 27B model on a rented V100: speculative decoding, a quantized KV cache, and a tuning trick that didn’t travel.</p>
      <div class="diagram">${bigPicture}</div>
    </div>
  </div>`,
};

mkdirSync(out, { recursive: true });
const work = mkdtempSync(path.join(tmpdir(), 'housy-og-'));
for (const [name, body] of Object.entries(cards)) {
  const html = path.join(work, `${name}.html`);
  writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`);
  const png = path.join(out, `${name}.png`);
  execFileSync(chromium, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--allow-file-access-from-files', '--force-device-scale-factor=1',
    `--window-size=${W},${H}`, '--virtual-time-budget=3000', `--screenshot=${png}`,
    pathToFileURL(html).href,
  ], { stdio: 'ignore' });
  console.log('wrote', path.relative(root, png));
}
