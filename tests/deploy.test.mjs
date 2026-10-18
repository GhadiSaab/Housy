import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const script = resolve('scripts/deploy.mjs');
const oldImage = `ghcr.io/ghadisaab/housy@sha256:${'a'.repeat(64)}`;
const newImage = `ghcr.io/ghadisaab/housy@sha256:${'b'.repeat(64)}`;
const manifest = `# production\ncontainers:\n  - name: website\n    image: ${oldImage}\n    ports: [8080]\n`;
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'housy-deploy-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source');
  const remote = join(root, 'remote.git');
  const worker = join(root, 'worker');
  const other = join(root, 'other');
  mkdirSync(source);
  git(source, 'init', '-b', 'main');
  const identity = (cwd) => {
    git(cwd, 'config', 'user.email', 'test@example.com');
    git(cwd, 'config', 'user.name', 'Deployment test');
  };
  identity(source);
  writeFileSync(join(source, 'content'), 'published website');
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'Publish content');
  const sha = git(source, 'rev-parse', 'HEAD');
  git(root, 'init', '--bare', '-b', 'main', remote);
  git(root, 'clone', remote, worker);
  identity(worker);
  mkdirSync(join(worker, 'portfolio'));
  writeFileSync(join(worker, 'portfolio/deployment.yaml'), manifest);
  git(worker, 'add', '.');
  git(worker, 'commit', '-m', 'Initial deployment');
  git(worker, 'push', 'origin', 'main');
  git(root, 'clone', remote, other);
  identity(other);
  const run = (overrides = {}) => spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, GITOPS_DIR: worker, DEPLOY_IMAGE: newImage, SOURCE_SHA: sha, SOURCE_REPOSITORY: source, ...overrides },
  });
  const deployed = () => git(root, '--git-dir', remote, 'show', 'main:portfolio/deployment.yaml');
  return { root, source, remote, worker, other, sha, run, deployed };
}

test('publishes only the immutable image change and is idempotent', (t) => {
  const f = fixture(t);
  let result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.deployed(), manifest.replace(oldImage, newImage).trim());
  const revision = git(f.root, '--git-dir', f.remote, 'rev-parse', 'main');
  assert.match(git(f.worker, 'log', '-1', '--format=%B'), new RegExp(f.sha));
  result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(f.root, '--git-dir', f.remote, 'rev-parse', 'main'), revision);
});

test('skips an old build when source main has moved', (t) => {
  const f = fixture(t);
  git(f.source, 'commit', '--allow-empty', '-m', 'Newer website');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skipping/);
  assert.equal(f.deployed(), manifest.trim());
});

test('skips a build superseded while preparing its deployment commit', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.worker, '.git/hooks/post-commit'), `#!/bin/sh\ngit -C ${quote(f.source)} commit --allow-empty -qm 'Newer website'\n`, { mode: 0o755 });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Skipping/);
  assert.equal(f.deployed(), manifest.trim());
});

test('rejects invalid images and ambiguous manifests without changing production', (t) => {
  const f = fixture(t);
  const invalid = f.run({ DEPLOY_IMAGE: 'ghcr.io/ghadisaab/housy:latest' });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /immutable Housy image/);
  const file = join(f.worker, 'portfolio/deployment.yaml');
  writeFileSync(file, manifest + `other:\n  image: ${oldImage}\n`);
  git(f.worker, 'add', '.');
  git(f.worker, 'commit', '-m', 'Ambiguous manifest');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exactly one Housy image/);
  assert.equal(f.deployed(), manifest.trim());
  assert.equal(readFileSync(file, 'utf8'), manifest + `other:\n  image: ${oldImage}\n`);
});

test('retries a non-fast-forward push and preserves a concurrent infrastructure commit', (t) => {
  const f = fixture(t);
  // A real Git hook advances the remote immediately before the first push.
  writeFileSync(join(f.worker, '.git/hooks/pre-push'), `#!/bin/sh\nrm "$0"\nprintf 'infra change\\n' > ${quote(join(f.other, 'unrelated.yaml'))}\ngit -C ${quote(f.other)} add .\ngit -C ${quote(f.other)} commit -qm 'Concurrent infrastructure change'\ngit -C ${quote(f.other)} push -q origin main\n`, { mode: 0o755 });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.deployed(), manifest.replace(oldImage, newImage).trim());
  assert.equal(git(f.root, '--git-dir', f.remote, 'show', 'main:unrelated.yaml'), 'infra change');
});
