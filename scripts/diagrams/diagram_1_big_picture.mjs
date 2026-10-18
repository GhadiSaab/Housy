import { roughRect, text, svgDoc, INK, GREEN, MUTED, PAPER, FONT_MONO } from './sketch.mjs';
import { DRAW_IN_STYLE } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const W = 780, H = 320;
const body = [];

const laptopX = 40, laptopY = 110, laptopW = 160, laptopH = 90;
body.push(roughRect(laptopX, laptopY, laptopW, laptopH, { stroke: INK, seed: 1 }));
body.push(text(laptopX + laptopW / 2, laptopY + 40, 'Your laptop', { size: 15, anchor: 'middle', fill: INK, weight: '600' }));
body.push(text(laptopX + laptopW / 2, laptopY + 60, 'OpenCode / Codex', { size: 11.5, anchor: 'middle', fill: MUTED, family: FONT_MONO }));
body.push(text(laptopX + laptopW / 2, laptopY + laptopH + 25, 'you, at your desk', { size: 12, anchor: 'middle', fill: MUTED }));

const cloudX = 330, cloudY = 70, cloudW = 410, cloudH = 170;
body.push(roughRect(cloudX, cloudY, cloudW, cloudH, { stroke: MUTED, roughness: 2.2, seed: 2 }));
body.push(text(cloudX + 20, cloudY + 25, 'a rented computer, somewhere else', { size: 12.5, fill: MUTED }));
body.push(text(cloudX + 20, cloudY + cloudH - 20, "a stranger's spare GPU, by the hour", { size: 11.5, fill: MUTED }));

const brainX = 500, brainY = 120, brainW = 200, brainH = 70;
body.push(roughRect(brainX, brainY, brainW, brainH, { stroke: GREEN, seed: 3 }));
body.push(text(brainX + brainW / 2, brainY + 29, 'The AI model', { size: 15, anchor: 'middle', fill: GREEN, weight: '600' }));
body.push(text(brainX + brainW / 2, brainY + 49, '27 billion settings', { size: 11.5, anchor: 'middle', fill: MUTED, family: FONT_MONO }));

const qY = laptopY + laptopH / 2 - 18;
const aY = laptopY + laptopH / 2 + 18;
body.push(`<path class="draw-in" d="M ${laptopX + laptopW + 6} ${qY} Q ${(laptopX + brainX) / 2} ${qY - 18} ${brainX - 6} ${qY}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" />`);
body.push(`<path d="M ${brainX - 16} ${qY - 7} L ${brainX - 6} ${qY} L ${brainX - 16} ${qY + 7}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`);
body.push(`<rect x="${(laptopX + brainX) / 2 - 62}" y="${qY - 29}" width="124" height="18" fill="${PAPER}" />`);
body.push(text((laptopX + brainX) / 2, qY - 16, '"explain this bug"', { size: 11.5, anchor: 'middle', fill: MUTED, family: FONT_MONO }));

body.push(`<path class="draw-in" d="M ${brainX - 6} ${aY} Q ${(laptopX + brainX) / 2} ${aY + 18} ${laptopX + laptopW + 6} ${aY}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" />`);
body.push(`<path d="M ${laptopX + laptopW + 16} ${aY - 7} L ${laptopX + laptopW + 6} ${aY} L ${laptopX + laptopW + 16} ${aY + 7}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`);
body.push(`<rect x="${(laptopX + brainX) / 2 - 36}" y="${aY + 11}" width="72" height="18" fill="${PAPER}" />`);
body.push(text((laptopX + brainX) / 2, aY + 24, 'the answer', { size: 11.5, anchor: 'middle', fill: MUTED, family: FONT_MONO }));

const svg = svgDoc({ width: W, height: H, title: 'Renting a brain by the hour', body: body.join('\n'), style: DRAW_IN_STYLE });

const outDir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(outDir, '../../public/images/posts/renting-a-brain-in-the-cloud/big-picture.svg');
writeFileSync(outPath, svg);
console.log('wrote', outPath);
