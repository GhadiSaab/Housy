import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('CSP authorizes exact inline scripts across pages without allowing arbitrary inline scripts', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'housy-csp-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dist = join(root, 'dist');
  mkdirSync(join(dist, 'writing'), { recursive: true });
  const theme = '\nwindow.theme = "dark";\n';
  const article = 'console.log("diagram animation");';
  writeFileSync(join(dist, 'index.html'), `<script>${theme}</script><script src="/app.js"></script>`);
  writeFileSync(join(dist, 'writing/index.html'), `<script>${theme}</script><script type="module">${article}</script>`);
  const output = join(root, 'headers.conf');
  const run = () => spawnSync(process.execPath, [resolve('scripts/security-headers.mjs'), dist, output], { encoding: 'utf8' });
  let result = run();
  assert.equal(result.status, 0, result.stderr);
  const headers = readFileSync(output, 'utf8');
  const scriptPolicy = headers.match(/script-src ([^;]+);/)[1];
  for (const code of [theme, article]) {
    const hash = createHash('sha256').update(code).digest('base64');
    assert.equal(scriptPolicy.split(`'sha256-${hash}'`).length - 1, 1);
  }
  assert.doesNotMatch(scriptPolicy, /unsafe-inline|unsafe-eval/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /Strict-Transport-Security/);
  writeFileSync(join(dist, 'writing/index.html'), '<script>newPost();</script>');
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.ok(readFileSync(output, 'utf8').includes(createHash('sha256').update('newPost();').digest('base64')));
  assert.ok(!readFileSync(output, 'utf8').includes(createHash('sha256').update(article).digest('base64')));
});
