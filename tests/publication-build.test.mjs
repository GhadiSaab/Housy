import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const fixture = 'src/content/posts/housy-publication-probe.md';
const read = path => readFileSync(`dist/${path}`, 'utf8');
const build = () => execFileSync('npm', ['run', 'build'], { encoding: 'utf8', stdio: 'pipe' });
const surfaces = ['index.html', 'writing/index.html', 'rss.xml', 'sitemap-0.xml'];
const route = '/writing/housy-publication-probe/';

test('publishing and unpublishing a real Markdown post changes every public surface', { timeout: 120000 }, () => {
  assert.equal(existsSync(fixture), false, 'Refusing to overwrite an existing content file');
  const markdown = draft => `---\ntitle: A publication lifecycle probe\ndescription: Verify publication boundaries with a real content entry.\npublishedAt: 2026-10-18\ntags: [testing]\ndraft: ${draft}\n---\n\nPUBLICATION_LIFECYCLE_BODY\n\n## A heading\n\nA paragraph and some code.\n\n\`\`\`sh\ncurl --fail https://example.com/this-is-a-deliberately-long-line-for-checking-technical-article-code-block-overflow\n\`\`\`\n`;
  try {
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
    build();
  }
});
