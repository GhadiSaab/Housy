import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { GITOPS_DIR: directory, DEPLOY_IMAGE: image, SOURCE_SHA: sourceSha, SOURCE_REPOSITORY: sourceRepository } = process.env;
if (!directory || !sourceRepository || !/^[a-f0-9]{40}$/.test(sourceSha ?? '') ||
    !/^ghcr\.io\/ghadisaab\/housy@sha256:[a-f0-9]{64}$/.test(image ?? '')) {
  throw new Error('Provide a GitOps checkout, source repository, full source SHA, and immutable Housy image.');
}
const git = (...args) => execFileSync('git', args, {
  cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000,
}).trim();
const currentBuild = () => git('ls-remote', sourceRepository, 'refs/heads/main').split(/\s/)[0] === sourceSha;
const manifestPath = 'portfolio/deployment.yaml';
const file = join(directory, manifestPath);

if (git('status', '--porcelain')) throw new Error('Deployment requires a clean GitOps checkout.');
let committed = false;
for (let attempt = 1; attempt <= 3; attempt++) {
  if (!currentBuild()) {
    console.log('Skipping deployment: source main has moved to a newer commit.');
    break;
  }
  git('fetch', 'origin', 'main');
  // Preserve concurrent infrastructure commits; conflicts fail safely without a force push.
  git('rebase', 'origin/main');
  const manifest = readFileSync(file, 'utf8');
  const imageLine = /^(\s*image: )ghcr\.io\/ghadisaab\/housy(?:@sha256:[a-f0-9]{64}|:[^\s]+)[ \t]*$/gm;
  if ([...manifest.matchAll(imageLine)].length !== 1) {
    throw new Error('Expected exactly one Housy image in the production deployment.');
  }
  const updated = manifest.replace(imageLine, (_, prefix) => `${prefix}${image}`);
  if (updated !== manifest) {
    writeFileSync(file, updated);
    git('add', '--', manifestPath);
    git('commit', '-m', `deploy(portfolio): Housy ${sourceSha.slice(0, 12)}`, '-m', `Source: https://github.com/GhadiSaab/Housy/commit/${sourceSha}\nImage: ${image}`);
    committed = true;
  }
  if (!committed) {
    console.log('Production already references this image.');
    break;
  }
  if (!currentBuild()) {
    console.log('Skipping deployment: source main has moved to a newer commit.');
    break;
  }
  const push = spawnSync('git', ['push', 'origin', 'HEAD:refs/heads/main'], {
    cwd: directory, encoding: 'utf8', timeout: 60_000,
  });
  if (push.status === 0) {
    console.log(`Updated GitOps main to ${image} (source ${sourceSha}).`);
    break;
  }
  if (attempt === 3) throw new Error(`GitOps push failed after three attempts: ${push.stderr || push.error}`);
  console.log('GitOps push failed; fetching and rebasing before retrying.');
}
