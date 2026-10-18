import { roughRect, roughLine, text, svgDoc, INK, GREEN, MUTED, FONT_MONO } from './sketch.mjs';
import { DRAW_IN_STYLE, STAGE_POP_STYLE, stageRule, group } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RED = '#b3432b';
const W = 780, H = 500;
const body = [];
const stageStyles = [STAGE_POP_STYLE];

function drawIn(d, delay, duration = 0.4) {
  return `<path class="draw-in" style="animation-delay:${delay}s;animation-duration:${duration}s" d="${d}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" />`;
}

// ---- Stage 1: draft (t=0.0s) ----
const slotW = 70, slotH = 50, gap = 15, n = 4;
const draftTotalW = n * slotW + (n - 1) * gap;
const draftX0 = (W - draftTotalW) / 2;
const draftY = 95;

let draftBody = text(W / 2, 68, 'the model drafts 4 words ahead, cheaply', { size: 13.5, anchor: 'middle', fill: INK, weight: '600' });
for (let i = 0; i < n; i++) {
  const x = draftX0 + i * (slotW + gap);
  draftBody += roughRect(x, draftY, slotW, slotH, { stroke: MUTED, seed: 1 + i });
  draftBody += text(x + slotW / 2, draftY + slotH / 2 + 5, `g${i + 1}`, { size: 15, anchor: 'middle', fill: MUTED, weight: '600', family: FONT_MONO });
}
stageStyles.push(stageRule('stageDraft', 0.0));
body.push(group('stageDraft', draftBody));

// arrow: draft -> verify (t=0.5s)
const verifyY = 210, verifyH = 60, verifyW = 420, verifyX = (W - verifyW) / 2;
body.push(drawIn(`M ${W / 2} ${draftY + slotH + 8} L ${W / 2} ${verifyY - 8}`, 0.5));
stageStyles.push(stageRule('arrow1head', 0.8));
body.push(group('arrow1head', `<path d="M ${W / 2 - 7} ${verifyY - 16} L ${W / 2} ${verifyY - 8} L ${W / 2 + 7} ${verifyY - 16}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`));

// ---- Stage 2: verify (t=0.9s) ----
let verifyBody = roughRect(verifyX, verifyY, verifyW, verifyH, { stroke: GREEN, seed: 50 });
verifyBody += text(W / 2, verifyY + verifyH / 2 - 3, 'the real model checks all 4 at once', { size: 14.5, anchor: 'middle', fill: GREEN, weight: '600' });
verifyBody += text(W / 2, verifyY + verifyH / 2 + 17, 'one pass, not four', { size: 11, anchor: 'middle', fill: MUTED, family: FONT_MONO });
stageStyles.push(stageRule('stageVerify', 0.9));
body.push(group('stageVerify', verifyBody));

// arrows: verify -> two outcomes (t=1.3s)
const leftCX = W * 0.27, rightCX = W * 0.73;
const outcomeY = 340;
body.push(drawIn(`M ${verifyX + 40} ${verifyY + verifyH + 6} L ${leftCX} ${outcomeY - 40}`, 1.3));
body.push(drawIn(`M ${verifyX + verifyW - 40} ${verifyY + verifyH + 6} L ${rightCX} ${outcomeY - 40}`, 1.3));
stageStyles.push(stageRule('arrow2heads', 1.6));
body.push(group('arrow2heads',
  `<path d="M ${leftCX - 10} ${outcomeY - 44} L ${leftCX} ${outcomeY - 40} L ${leftCX - 3} ${outcomeY - 30}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />` +
  `<path d="M ${rightCX + 10} ${outcomeY - 44} L ${rightCX} ${outcomeY - 40} L ${rightCX + 3} ${outcomeY - 30}" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
));

function outcomeColumn(cx, heading, headingColor, results, caption, seedBase) {
  const g = [];
  g.push(text(cx, outcomeY - 10, heading, { size: 13, anchor: 'middle', fill: headingColor, weight: '600' }));
  const x0 = cx - draftTotalW / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (slotW + gap);
    const state = results[i];
    const stroke = state === 'ok' ? GREEN : state === 'bad' ? RED : MUTED;
    g.push(roughRect(x, outcomeY, slotW, slotH, { stroke, seed: seedBase + i }));
    if (state === 'discard') {
      g.push(`<line x1="${x + 8}" y1="${outcomeY + 8}" x2="${x + slotW - 8}" y2="${outcomeY + slotH - 8}" stroke="${MUTED}" stroke-width="1.5" opacity="0.5" />`);
      g.push(`<line x1="${x + slotW - 8}" y1="${outcomeY + 8}" x2="${x + 8}" y2="${outcomeY + slotH - 8}" stroke="${MUTED}" stroke-width="1.5" opacity="0.5" />`);
    } else {
      const cx2 = x + slotW / 2, cy2 = outcomeY + slotH / 2;
      if (state === 'ok') {
        g.push(roughLine(cx2 - 11, cy2, cx2 - 3, cy2 + 9, { stroke: GREEN, seed: seedBase + 10 + i }));
        g.push(roughLine(cx2 - 3, cy2 + 9, cx2 + 12, cy2 - 10, { stroke: GREEN, seed: seedBase + 20 + i }));
      } else {
        g.push(roughLine(cx2 - 10, cy2 - 10, cx2 + 10, cy2 + 10, { stroke: RED, seed: seedBase + 30 + i }));
        g.push(roughLine(cx2 + 10, cy2 - 10, cx2 - 10, cy2 + 10, { stroke: RED, seed: seedBase + 40 + i }));
      }
    }
  }
  g.push(text(cx, outcomeY + slotH + 34, caption, { size: 12, anchor: 'middle', fill: MUTED }));
  return g.join('\n');
}

// ---- Stage 3: outcomes (t=1.7s, then t=1.9s) ----
stageStyles.push(stageRule('stageLeft', 1.7));
body.push(group('stageLeft', outcomeColumn(leftCX, 'best case: all 4 land', GREEN, ['ok', 'ok', 'ok', 'ok'], '4 words kept, 1 check instead of 4', 200)));
stageStyles.push(stageRule('stageRight', 1.9));
body.push(group('stageRight', outcomeColumn(rightCX, 'typical case: one misses', RED, ['ok', 'ok', 'bad', 'discard'], '2 words kept, redo from the miss', 400)));

// ---- Stage 4: takeaway (t=2.3s) ----
stageStyles.push(stageRule('stageCaption', 2.3));
body.push(group('stageCaption',
  text(W / 2, 450, 'either way: never slower than checking one word at a time', { size: 13, anchor: 'middle', fill: INK, weight: '600' }) +
  text(W / 2, 472, 'a wrong guess costs a small redo, never a wrong answer', { size: 11.5, anchor: 'middle', fill: MUTED })
));

const style = DRAW_IN_STYLE + '\n' + stageStyles.join('\n');
const svg = svgDoc({ width: W, height: H, title: 'Why speculative decoding is faster', body: body.join('\n'), style });

const outDir = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(outDir, '../../public/images/posts/renting-a-brain-in-the-cloud/speculative-decoding.svg');
writeFileSync(outPath, svg);
console.log('wrote', outPath);
