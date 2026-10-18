// Re-inlines the generated diagram SVGs into the blog post, replacing each
// existing <svg ...>...</svg> block (matched by viewBox, since each diagram
// has a distinct one) with the freshly generated file's contents. Run this
// after regenerating any diagram so the post stays in sync.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const postPath = path.join(root, '../../src/content/posts/renting-a-brain-in-the-cloud.md');
const imgDir = path.join(root, '../../public/images/posts/renting-a-brain-in-the-cloud');

let post = readFileSync(postPath, 'utf8');

// Matched by each diagram's title text (stable across redesigns) rather
// than viewBox dimensions, which change whenever a diagram is reworked.
const diagrams = [
  { file: 'big-picture.svg', title: 'Renting a brain by the hour' },
  { file: 'speculative-decoding.svg', title: 'Why speculative decoding is faster' },
  { file: 'bigger-notebook.svg', title: 'Making room for a longer conversation' },
];

for (const d of diagrams) {
  const svg = readFileSync(path.join(imgDir, d.file), 'utf8').trim();
  const titleMarker = `>${d.title}</text>`;
  const titleIdx = post.indexOf(titleMarker);
  if (titleIdx === -1) throw new Error(`could not find existing block for ${d.file} (title "${d.title}")`);
  const start = post.lastIndexOf('<svg ', titleIdx);
  if (start === -1) throw new Error(`found title for ${d.file} but no preceding <svg`);
  const end = post.indexOf('</svg>', titleIdx) + '</svg>'.length;
  post = post.slice(0, start) + svg + post.slice(end);
  console.log(`replaced ${d.file}`);
}

writeFileSync(postPath, post);
console.log('done');
