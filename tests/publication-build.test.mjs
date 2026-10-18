import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

const fixture = 'src/content/posts/housy-publication-probe.md';
const read = path => readFileSync(`dist/${path}`, 'utf8');
const build = () => execFileSync('npm', ['run', 'build'], { encoding: 'utf8', stdio: 'pipe' });
const surfaces = ['index.html', 'writing/index.html', 'rss.xml', 'sitemap-0.xml'];
const route = '/writing/housy-publication-probe/';

test('publishing and unpublishing a real Markdown post changes every public surface', { timeout: 120000 }, () => {
  assert.equal(existsSync(fixture), false, 'Refusing to overwrite an existing content file');
  const seeds = [1, 2, 3].map(i => `src/content/posts/housy-publication-seed-${i}.md`);
  for (const path of seeds) assert.equal(existsSync(path), false, 'Refusing to overwrite existing content');
  let probeDate;
  const markdown = draft => `---\ntitle: A publication lifecycle probe\ndescription: Verify publication boundaries with a real content entry.\npublishedAt: ${probeDate}\ntags: [testing]\ndraft: ${draft}\n---\n\nPUBLICATION_LIFECYCLE_BODY\n\n## A heading\n\nA paragraph and some code.\n\n\`\`\`sh\ncurl --fail https://example.com/this-is-a-deliberately-long-line-for-checking-technical-article-code-block-overflow\n\`\`\`\n`;
  try {
    seeds.forEach((path, i) => writeFileSync(path, `---\ntitle: Later article ${i + 1}\ndescription: A temporary regression fixture.\npublishedAt: 2027-01-0${i + 1}\ndraft: false\n---\n\nTemporary article.\n`));
    build();
    const dates = [...read('rss.xml').matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map(([, date]) => Date.parse(date));
    probeDate = new Date(Math.max(Date.now(), ...dates) + 86400000).toISOString().slice(0, 10);
    writeFileSync(fixture, markdown(false));
    build();
    for (const path of surfaces) assert.ok(read(path).includes(route), `Published post missing from ${path}`);
    assert.match(read('writing/housy-publication-probe/index.html'), /PUBLICATION_LIFECYCLE_BODY/);
    assert.match(read('writing/housy-publication-probe/index.html'), /<pre/);

    writeFileSync(fixture, markdown(true));
    build();
    for (const path of surfaces) assert.ok(!read(path).includes(route), `Unpublished post leaked into ${path}`);
    assert.equal(existsSync('dist/writing/housy-publication-probe/index.html'), false);
  } finally {
    if (existsSync(fixture)) unlinkSync(fixture);
    for (const path of seeds) if (existsSync(path)) unlinkSync(path);
    build();
  }
});

test('blank dates and non-date metadata are rejected instead of becoming epoch dates', { timeout: 120000 }, () => {
  assert.equal(existsSync(fixture), false, 'Refusing to overwrite an existing content file');
  try {
    for (const fields of ['publishedAt:', 'publishedAt: false', 'publishedAt: 0', 'publishedAt: 2026-10-18\nupdatedAt:']) {
      writeFileSync(fixture, `---\ntitle: Date validation probe\ndescription: A temporary schema fixture.\n${fields}\ndraft: true\n---\n`);
      const result = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
      assert.notEqual(result.status, 0, `Invalid date was accepted: ${fields}`);
      assert.match(result.stdout + result.stderr, /does not match collection schema/);
    }
  } finally {
    if (existsSync(fixture)) unlinkSync(fixture);
    build();
  }
});
