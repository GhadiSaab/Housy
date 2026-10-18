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

test('security headers protect HTML, assets and error responses, while social previews remain readable', async () => {
  const home = await fetch(origin, { headers: { 'User-Agent': 'LinkedInBot/1.0' } });
  assert.equal(home.status, 200);
  const html = await home.text();
  const stylesheet = html.match(/href="(\/_astro\/[^" ]+\.css)"/)[1];
  for (const path of ['/', stylesheet, '/does-not-exist/', '/og/default.png']) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(response.headers.get('x-frame-options'), 'DENY', path);
    assert.match(response.headers.get('strict-transport-security') ?? '', /max-age=31536000/);
    assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  }
});

test('write methods and hidden files are rejected', async () => {
  const redirect = await fetch(`${origin}/writing/?page=1`, { headers: { 'X-Forwarded-Proto': 'http' }, redirect: 'manual' });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get('location'), 'https://gsaab.dev/writing/?page=1');
  const slash = await fetch(`${origin}/projects`, { headers: { 'Host': 'gsaab.dev', 'X-Forwarded-Proto': 'https' }, redirect: 'manual' });
  assert.equal(slash.status, 301);
  assert.equal(slash.headers.get('location'), '/projects/');
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const response = await fetch(origin, { method });
    assert.equal(response.status, 405, method);
  }
  for (const path of ['/.git/config', '/.env', '/images/.private']) {
    assert.equal((await fetch(`${origin}${path}`)).status, 404, path);
  }
});

test('bounded bursts return 429, spoofed forwarding headers do not evade the limit, and health stays available', async () => {
  // Run only against the disposable local container, never the public website.
  assert.ok(new URL(origin).hostname === '127.0.0.1' || new URL(origin).hostname === 'localhost');
  const responses = await Promise.all(Array.from({ length: 90 }, (_, i) => fetch(origin, {
    headers: { 'CF-Connecting-IP': `203.0.113.${i + 1}`, 'X-Forwarded-For': `203.0.113.${i + 1}` },
  })));
  assert.ok(responses.some(response => response.status === 200));
  assert.ok(responses.some(response => response.status === 429), 'Expected rate limiting');
  assert.ok(responses.every(response => [200, 429].includes(response.status)));
  assert.equal((await fetch(`${origin}/healthz`)).status, 200);
});
