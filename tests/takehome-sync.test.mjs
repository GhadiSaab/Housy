import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sync, transformAnswer, parseQuestions, codeAnchor } from '../scripts/takehome-sync.mjs';

const ANSWER = `## Q2 — SMTP and email auth
**TL;DR:** Mail trusts everyone.

![Diagram](../../diagrams/q2.png)

### 1. Story
See [the code](../../code/email-auth/) and [ADR](../../code/adr-example/0001-x.md).
`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'takehome-'));
  const source = join(root, 'source');
  mkdirSync(join(source, 'answers/part1'), { recursive: true });
  mkdirSync(join(source, 'diagrams'), { recursive: true });
  mkdirSync(join(source, 'code/email-auth/__pycache__'), { recursive: true });
  writeFileSync(join(source, 'site.json'), JSON.stringify({ slug: 'revolut-abc123def456', title: 'T', author: 'A' }));
  writeFileSync(join(source, 'task.md'), 'First question?\n\nSecond\nquestion?\n');
  writeFileSync(join(source, 'answers/part1/q1-a.md'), '## Q1 — First\n**TL;DR:** one.\n\n### A\nx\n');
  writeFileSync(join(source, 'answers/part1/q2-b.md'), ANSWER);
  writeFileSync(join(source, 'diagrams/q2.png'), 'png');
  writeFileSync(join(source, 'diagrams/q2.excalidraw'), '{}');
  writeFileSync(join(source, 'code/email-auth/README.md'), '# hi');
  writeFileSync(join(source, 'code/email-auth/__pycache__/x.pyc'), 'bin');
  return { root, source };
}

test('answer heading and TL;DR move to frontmatter; links point at private assets', () => {
  const out = transformAnswer(ANSWER, '/p/s');
  assert.equal(out.id, 'q2');
  assert.equal(out.title, 'SMTP and email auth');
  assert.equal(out.tldr, 'Mail trusts everyone.');
  assert.doesNotMatch(out.body, /^## /m);
  assert.match(out.body, /<figure class="th-diagram"><a class="th-diagram-open" href="\/p\/s\/diagrams\/q2\.png" data-diagram/);
  assert.match(out.body, /<img src="\/p\/s\/diagrams\/q2\.png" alt="Diagram"/);
  assert.match(out.body, /\]\(\/p\/s\/code\/#email-auth\)/);
  assert.match(out.body, /\]\(\/p\/s\/code\/#adr-example-0001-x-md\)/);
});

test('diagrams prefer the SVG export and escape their caption', () => {
  const out = transformAnswer('## Q1 — T\n![A <b> & "c"](../../diagrams/q1.png)\n', '/p/s', new Set(['q1.svg']));
  assert.match(out.body, /href="\/p\/s\/diagrams\/q1\.svg"/);
  assert.match(out.body, /alt="A &lt;b&gt; &amp; &quot;c&quot;"/);
});

test('site sketches are inlined so they follow the theme', () => {
  const sketch = '<svg viewBox="0 0 10 10" class="sketch-diagram"><rect fill="var(--paper)"/></svg>';
  const out = transformAnswer('## S2 — T\n![Triage](../../diagrams/t.svg)\n', '/p/s', new Set(['t.svg']), new Map([['t.svg', sketch]]));
  assert.match(out.body, /<figure class="th-diagram th-diagram-inline"><svg viewBox="0 0 10 10" class="sketch-diagram">/);
  assert.doesNotMatch(out.body, /data-diagram/);
});

test('questions are split on blank lines and whitespace is normalised', () => {
  assert.deepEqual(parseQuestions('A one?\n\nB\ntwo?\n\n'), ['A one?', 'B two?']);
  assert.equal(codeAnchor('adr-example/0001-x.md'), 'adr-example-0001-x-md');
});

test('sync writes answers, data and images, and skips caches and sources', () => {
  const { root, source } = fixture();
  const result = sync({ source, root });
  assert.deepEqual(result && [result.answers, result.code], [2, 1]);
  const q2 = readFileSync(join(root, 'src/content/takehome/q2.md'), 'utf8');
  assert.match(q2, /^---\nlabel: "Q2"/);
  assert.match(q2, /question: "Second question\?"/);
  const data = JSON.parse(readFileSync(join(root, 'src/content/takehome/data.json'), 'utf8'));
  assert.deepEqual(data.code.map(f => f.path), ['email-auth/README.md']);
  assert.ok(existsSync(join(root, 'public/p/revolut-abc123def456/diagrams/q2.png')));
  assert.ok(!existsSync(join(root, 'public/p/revolut-abc123def456/diagrams/q2.excalidraw')));
});

test('without a private source, previous output is removed and the build continues', () => {
  const { root, source } = fixture();
  sync({ source, root });
  assert.equal(sync({ source: join(root, 'missing'), root }), null);
  assert.ok(!existsSync(join(root, 'public/p')));
  assert.ok(!existsSync(join(root, 'src/content/takehome/data.json')));
});

test('a short or unsafe slug is rejected', () => {
  const { root, source } = fixture();
  writeFileSync(join(source, 'site.json'), JSON.stringify({ slug: 'revolut' }));
  assert.throws(() => sync({ source, root }), /slug/);
});
