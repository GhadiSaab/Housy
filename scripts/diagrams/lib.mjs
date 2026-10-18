import { INK, GREEN, MUTED, PAPER } from './sketch.mjs';

// Generates a CSS @keyframes block where an element pops in at `appearSec`,
// holds visible until `holdEndSec`, then fades out, all expressed as
// percentages of one shared `cycleSec` infinite loop so unrelated elements
// with different timings still reset in sync at the end of every cycle.
export function popAt(name, cycleSec, appearSec, holdEndSec) {
  const pct = s => (s / cycleSec) * 100;
  const a = pct(appearSec);
  const h = pct(holdEndSec);
  const eps = 1.1;
  return `@keyframes ${name} {
  0% { opacity: 0; }
  ${a.toFixed(2)}% { opacity: 0; }
  ${(a + eps).toFixed(2)}% { opacity: 1; }
  ${h.toFixed(2)}% { opacity: 1; }
  ${(h + eps).toFixed(2)}% { opacity: 0; }
  100% { opacity: 0; }
}
.${name} { animation: ${name} ${cycleSec}s ease-out infinite; }`;
}

// A bar that grows from nothing to full height (anchored at its bottom),
// holds, then shrinks back so the loop can replay.
export function growAt(name, cycleSec, startSec, growEndSec, holdEndSec) {
  const pct = s => (s / cycleSec) * 100;
  const s = pct(startSec), g = pct(growEndSec), h = pct(holdEndSec);
  return `@keyframes ${name} {
  0% { transform: scaleY(0); opacity: 0; }
  ${s.toFixed(2)}% { transform: scaleY(0); opacity: 0; }
  ${(s + 0.5).toFixed(2)}% { opacity: 1; }
  ${g.toFixed(2)}% { transform: scaleY(1); opacity: 1; }
  ${h.toFixed(2)}% { transform: scaleY(1); opacity: 1; }
  100% { transform: scaleY(0); opacity: 0; }
}
.${name} { transform-box: fill-box; transform-origin: bottom; animation: ${name} ${cycleSec}s cubic-bezier(.22,.8,.3,1) infinite; }`;
}

export function group(cls, inner) {
  return `<g class="${cls}">${inner}</g>`;
}

// A one-shot staged reveal: each stage fades/rises in once, in sequence,
// when the diagram scrolls into view. Unlike an infinite loop this can
// never be caught "half faded" in a screenshot, it just plays once and
// settles. Give each stage group a distinct name and increasing delay.
export const STAGE_POP_STYLE = `@keyframes popOnce { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`;

export function stageRule(name, delaySec) {
  return `.${name} { opacity: 0; }
.sketch-diagram.in-view .${name} { animation: popOnce 0.5s ease-out ${delaySec}s forwards; }`;
}

// A one-shot "draws itself in" effect for a connector path. Gated behind
// the .in-view class (toggled by the IntersectionObserver script included
// once per post, see IN_VIEW_SCRIPT) rather than a fixed page-load delay,
// so it actually plays when a reader scrolls the diagram into view instead
// of finishing silently off-screen before they get there. Uses a generous
// fixed dash length rather than each path's exact length, which is good
// enough for this effect and needs no live DOM measurement.
export const DRAW_IN_STYLE = `@keyframes drawIn { from { stroke-dashoffset: 900; } to { stroke-dashoffset: 0; } }
.draw-in { stroke-dasharray: 900; stroke-dashoffset: 900; }
.sketch-diagram.in-view .draw-in { animation: drawIn 1.1s ease-out 0.15s forwards; }`;

// Include this once per post (not per diagram) right after the frontmatter.
// Plain IntersectionObserver, no external library: toggles .in-view on each
// .sketch-diagram the moment it's about 30% visible, which is what the
// gated keyframes above (and any .in-view-prefixed rule) key off of.
export const IN_VIEW_SCRIPT = `<script type="module">
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.3 });
  document.querySelectorAll('.sketch-diagram').forEach(function(el){ io.observe(el); });
</script>`;
