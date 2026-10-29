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
  for (const path of ['index.html', 'about/index.html', 'open-source/index.html', 'projects/index.html', 'projects/homelab/index.html', 'projects/this-website/index.html', 'projects/barenetes/index.html', 'projects/paastech/index.html', 'projects/ctx-memory/index.html', 'writing/index.html']) {
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

test('every page has a social preview image that exists, and articles get their own', () => {
  for (const page of textFiles().filter(path => path.endsWith('.html'))) {
    const html = read(page);
    if (html.includes('name="robots" content="noindex')) continue;
    const match = html.match(/<meta property="og:image" content="https:\/\/gsaab\.dev(\/[^"]+)"/);
    assert.ok(match, `Missing og:image in ${page}`);
    assert.ok(existsSync(join(dist, match[1])), `og:image ${match[1]} in ${page} does not exist`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/, `Small preview card in ${page}`);
  }
  const article = read('writing/renting-a-brain-in-the-cloud/index.html');
  assert.match(article, /<meta property="og:type" content="article"/);
  assert.match(article, /og:image" content="https:\/\/gsaab\.dev\/og\/renting-a-brain-in-the-cloud\.png"/);
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

test('private take-home pages stay out of the sitemap and are never indexable', () => {
  for (const path of textFiles().filter(path => /^sitemap-\d+\.xml$/.test(path))) {
    assert.doesNotMatch(read(path), /gsaab\.dev\/p\//, `Private page listed in ${path}`);
  }
  const privatePages = textFiles().filter(path => path.startsWith('p/') && path.endsWith('.html'));
  for (const page of privatePages) {
    assert.match(read(page), /<meta name="robots" content="noindex/, `Missing noindex in ${page}`);
  }
  for (const page of textFiles().filter(path => path.endsWith('.html') && !path.startsWith('p/'))) {
    assert.doesNotMatch(read(page), /href="\/p\//, `Public page links to a private page: ${page}`);
  }
});
