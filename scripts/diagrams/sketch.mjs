// Hand-drawn diagram helper for Housy blog posts, built on rough.js
// (https://github.com/rough-stuff/rough) for authentic sketchy shapes,
// generated server-side with no canvas/DOM, plus small CSS keyframe
// animations so the SVGs are embedded inline and move on the page.
//
// Palette copied from src/styles/global.css — keep in sync by eye.
import rough from 'roughjs';

// CSS custom properties, not hex literals: these diagrams are embedded
// inline (not <img src>), so they participate in the page's cascade and
// pick up the site's dark-mode palette automatically. Comment above each
// stays in sync with src/styles/global.css by eye.
export const INK = 'var(--ink)'; // light #232821 / dark #e7e9df
export const GREEN = 'var(--green)'; // light #295c46 / dark #a7c8a3
export const MUTED = 'var(--muted)'; // light #62685f / dark #a7afa3
export const RULE = 'var(--rule)'; // light #d5d8cd / dark #394338
export const PAPER = 'var(--paper)'; // light #f8f6f0 / dark #181d19
export const RED = 'var(--red)'; // light #b3432b / dark #e5a08a

export const FONT_SANS = 'Inter, ui-sans-serif, system-ui, sans-serif';
export const FONT_MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
// Single quotes inside: these values land in double-quoted SVG attributes.
// Family names must match what global.css loads (fontsource: "Source Serif 4 Variable").
export const FONT_SERIF = "'Source Serif 4 Variable', 'Source Serif 4', Georgia, serif";

const gen = rough.generator();

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// A hand-drawn rectangle. Returns { shapeSvg, labelSvg } so callers can
// stagger the box stroke and its text into separate animation groups.
export function roughRect(x, y, w, h, { stroke = INK, fill = null, roughness = 1.6, seed = 1 } = {}) {
  const opts = { stroke, strokeWidth: 1.8, roughness, seed };
  if (fill) Object.assign(opts, { fill, fillStyle: 'hachure', fillWeight: 1 });
  const shape = gen.rectangle(x, y, w, h, opts);
  return shape.sets.map(set => {
    const path = gen.opsToPath(set);
    const isFill = set.type === 'fillSketch';
    return `<path d="${path}" stroke="${isFill ? 'none' : stroke}" fill="${isFill ? fill : 'none'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />`;
  }).join('\n');
}

export function roughLine(x1, y1, x2, y2, { stroke = INK, roughness = 1.4, seed = 1, id = null } = {}) {
  const shape = gen.line(x1, y1, x2, y2, { stroke, strokeWidth: 2, roughness, seed });
  const idAttr = id ? ` id="${id}"` : '';
  return shape.sets.map(set => {
    const path = gen.opsToPath(set);
    return `<path${idAttr} d="${path}" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" />`;
  }).join('\n');
}

export function roughEllipse(cx, cy, w, h, { stroke = INK, fill = null, roughness = 1.5, seed = 1 } = {}) {
  const opts = { stroke, strokeWidth: 1.8, roughness, seed };
  if (fill) Object.assign(opts, { fill, fillStyle: 'hachure' });
  const shape = gen.ellipse(cx, cy, w, h, opts);
  return shape.sets.map(set => {
    const path = gen.opsToPath(set);
    const isFill = set.type === 'fillSketch';
    return `<path d="${path}" stroke="${isFill ? 'none' : stroke}" fill="${isFill ? fill : 'none'}" stroke-width="1.8" stroke-linecap="round" />`;
  }).join('\n');
}

export function arrowHead(x, y, angleDeg, { stroke = INK, size = 9 } = {}) {
  const a = (angleDeg * Math.PI) / 180;
  const back = size;
  const spread = 0.45;
  const bx = x - back * Math.cos(a);
  const by = y - back * Math.sin(a);
  const x1 = bx - back * spread * Math.sin(a);
  const y1 = by + back * spread * Math.cos(a);
  const x2 = bx + back * spread * Math.sin(a);
  const y2 = by - back * spread * Math.cos(a);
  return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
}

export function text(x, y, content, { size = 14, anchor = 'start', fill = INK, family = FONT_SANS, weight = '400' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${esc(family)}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(content)}</text>`;
}

export function svgDoc({ width, height, title, body, style = '' }) {
  const titleSvg = title
    ? text(width / 2, 32, title, { size: 19, anchor: 'middle', family: FONT_SERIF, weight: '600' })
    : '';
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" class="sketch-diagram">
<style>${style}</style>
<rect x="0" y="0" width="${width}" height="${height}" fill="${PAPER}" />
${titleSvg}
${body}
</svg>`;
}
