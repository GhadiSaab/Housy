import assert from 'node:assert/strict';
import test from 'node:test';

const origin = process.env.SITE_TEST_URL || 'http://127.0.0.1:8080';

test('static server serves real routes and health checks', async () => {
  for (const path of ['/', '/healthz', '/projects/homelab/', '/writing/']) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
  }
});

test('missing pages and drafts return the custom page with a real 404', async () => {
  for (const path of ['/a-page-that-does-not-exist/', '/writing/first-field-note/']) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 404, path);
    assert.match(await response.text(), /Off the beaten path/);
  }
});

test('HTML revalidates while versioned assets are cached and served locally', async () => {
  const response = await fetch(origin);
  assert.match(response.headers.get('cache-control'), /no-cache/);
  const html = await response.text();
  const css = html.match(/href="(\/_astro\/[^" ]+\.css)"/);
  assert.ok(css, 'Expected a local stylesheet');
  const stylesheet = await fetch(`${origin}${css[1]}`);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get('cache-control'), /immutable/);
  assert.match(stylesheet.headers.get('content-type'), /text\/css/);
  const font = (await stylesheet.text()).match(/url\((?:["'])?(\/[^)"']+\.woff2)(?:["'])?\)/);
  assert.ok(font, 'Expected self-hosted fonts');
  const fontResponse = await fetch(`${origin}${font[1]}`);
  assert.equal(fontResponse.status, 200);
  assert.match(fontResponse.headers.get('content-type'), /font\/woff2/);
});
