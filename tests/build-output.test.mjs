import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dist = resolve('dist');
const read = path => readFileSync(join(dist, path), 'utf8');
const textFiles = () => readdirSync(dist, { recursive: true }).filter(path =>
  /\.(html|xml|txt|json|css|js)$/.test(path) && statSync(join(dist, path)).isFile(),
);

test('all public pages have built routes and the production canonical origin', () => {
  for (const path of ['index.html', 'about/index.html', 'projects/index.html', 'projects/homelab/index.html', 'projects/this-website/index.html', 'writing/index.html']) {
    assert.ok(existsSync(join(dist, path)), `Missing public page: ${path}`);
    assert.match(read(path), /rel="canonical" href="https:\/\/gsaab\.dev\//);
  }
});

test('unpublished content never escapes into production output', () => {
  assert.equal(existsSync(join(dist, 'writing/first-field-note/index.html')), false);
  for (const path of textFiles()) {
    assert.ok(!read(path).includes('HOUSY_PRIVATE_DRAFT_EXAMPLE'), `Draft body leaked into ${path}`);
    assert.ok(!read(path).includes('/writing/first-field-note/'), `Draft link leaked into ${path}`);
  }
});

test('empty writing collection remains discoverable through RSS and sitemap', () => {
  assert.ok(existsSync(join(dist, 'rss.xml')), 'RSS endpoint is missing');
  const rss = read('rss.xml');
  assert.match(rss, /<rss\b/);
  assert.match(rss, /<channel>/);
  assert.match(rss, /https:\/\/gsaab\.dev/);
  assert.ok(existsSync(join(dist, 'sitemap-index.xml')), 'Sitemap index is missing');
  assert.match(read('sitemap-index.xml'), /https:\/\/gsaab\.dev\/sitemap-0\.xml/);
  assert.match(read('sitemap-0.xml'), /https:\/\/gsaab\.dev\/writing\//);
  assert.doesNotMatch(read('sitemap-0.xml'), /404/);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/gsaab\.dev\/sitemap-index\.xml/);
});

test('every local page or asset link resolves to a generated file', () => {
  for (const page of textFiles().filter(path => path.endsWith('.html'))) {
    for (const [, href] of read(page).matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      if (href.startsWith('//')) continue;
      const target = href.endsWith('/') ? `${href}index.html` : href;
      assert.ok(existsSync(join(dist, decodeURI(target))), `Broken local link ${href} in ${page}`);
    }
  }
});
