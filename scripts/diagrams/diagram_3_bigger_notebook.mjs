import { roughRect, text, svgDoc, INK, GREEN, MUTED, FONT_MONO } from './sketch.mjs';
import { DRAW_IN_STYLE } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const W = 780, H = 420;

const body = [];
const keyframes = [];

// Both rows share the same bar geometry: same total width (the fixed VRAM
// budget), same model-weights segment (fixed cost), same cache-segment
// width (because total memory used barely changes). The only thing that
// changes between rows is how many cells the cache segment is sliced into,
// which is the actual mechanism, not just two differently sized boxes.
const barX = 90, barW = 600, cellH = 50;
const modelW = 430, cacheW = barW - modelW;

function row(y, cells, cellLabel, tokensLabel, usedLabel, stroke, seed) {
  const g = [];
  g.push(roughRect(barX, y, modelW, cellH, { stroke, seed }));
  g.push(text(barX + modelW / 2, y + cellH / 2 + 5, 'model weights, fixed', { size: 12, anchor: 'middle', fill: stroke, family: FONT_MONO }));
  const cellW = cacheW / cells;
  for (let i = 0; i < cells; i++) {
    g.push(roughRect(barX + modelW + i * cellW, y, cellW, cellH, { stroke, seed: seed + 10 + i }));
  }
  g.push(text(barX + modelW + cacheW / 2, y - 12, cellLabel, { size: 12, anchor: 'middle', fill: stroke, weight: '600' }));
  g.push(text(barX + barW / 2, y + cellH + 26, tokensLabel, { size: 13, anchor: 'middle', fill: INK, weight: '600' }));
  g.push(text(barX + barW / 2, y + cellH + 46, usedLabel, { size: 11.5, anchor: 'middle', fill: MUTED, family: FONT_MONO }));
  return g.join('\n');
}

body.push(text(barX + barW / 2, 84, 'the GPU has one fixed memory budget, about 30 GB, every time', { size: 13, anchor: 'middle', fill: MUTED }));

body.push(`<g class="cellsBefore">`);
body.push(row(120, 5, '16-bit cache', '163,840 tokens fit', '30,178 MiB used', MUTED, 1));
body.push(`</g>`);

body.push(`<g class="cellsAfter">`);
// 5 -> 8 cells: 1.6x, matching the measured 163,840 -> 262,144 tokens.
body.push(row(270, 8, '8-bit cache', '262,144 tokens fit', '30,176 MiB used', GREEN, 100));
body.push(`</g>`);

keyframes.push(`@keyframes settleIn { from { opacity: 0; } to { opacity: 1; } }
.cellsAfter { opacity: 0; }
.sketch-diagram.in-view .cellsAfter { animation: settleIn 0.8s ease-out 0.3s forwards; }`);

// Left margin, clear of the centered token-count labels (which sit at the
// bar's horizontal midpoint, directly below where this arrow used to be).
body.push(`<path class="draw-in" d="M 50 135 L 50 285" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" />`);
body.push(`<path d="M 43 275 L 50 285 L 57 275" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`);

body.push(text(barX + barW / 2, 400, 'same budget, same model, smaller cells, 60% more room for conversation', { size: 12.5, anchor: 'middle', fill: MUTED, weight: '600' }));

const style = keyframes.join('\n') + '\n' + DRAW_IN_STYLE;
const svg = svgDoc({ width: W, height: H, title: 'Making room for a longer conversation', body: body.join('\n'), style });

const outDir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(outDir, '../../public/images/posts/renting-a-brain-in-the-cloud/bigger-notebook.svg');
writeFileSync(outPath, svg);
console.log('wrote', outPath);
