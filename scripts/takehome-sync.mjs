// Pulls the private take-home (a separate private repo) into the build.
// Source: $TAKEHOME_DIR (default ./.takehome), a checkout of GhadiSaab/revolut-takehome.
// Outputs are gitignored: src/content/takehome/ (answers + data) and public/p/<slug>/ (images).
// With no source, outputs are cleared and the site builds without the take-home.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const LANGS = { '.py': 'python', '.rego': 'text', '.md': 'markdown', '.txt': 'text', '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml' };
const SKIP = new Set(['__pycache__', '.pytest_cache']);
const PARTS = { part1: 'Part I · Concepts', part2: 'Part II · Scenarios', part3: 'Part III · Improvements' };

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (SKIP.has(entry.name)) return [];
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});

export const codeAnchor = path => path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

// Questions in task.md are separated by blank lines, in answer order.
export function parseQuestions(taskText) {
  return taskText.split(/\n\s*\n/).map(block => block.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A diagram becomes a figure that opens the full-screen viewer (or the raw file without JS).
// Prefer the SVG export when one exists: it stays sharp at any zoom.
// Hand-drawn site sketches (class="sketch-diagram") are inlined instead: they use the
// page's CSS variables, so they follow the theme and are sized to read at column width.
export function diagramFigure(alt, file, base, svgs = new Set(), inline = new Map()) {
  if (inline.has(file)) {
    // No caption: the sketch draws its own title and carries an aria-label.
    return `<figure class="th-diagram th-diagram-inline">${inline.get(file)}</figure>`;
  }
  const svg = file.replace(/\.png$/, '.svg');
  const src = `${base}/diagrams/${svgs.has(svg) ? svg : file}`;
  const label = escapeHtml(alt);
  return `<figure class="th-diagram"><a class="th-diagram-open" href="${src}" data-diagram aria-label="Open diagram full screen: ${label}">`
    + `<img src="${src}" alt="${label}" loading="lazy" decoding="async"><span class="th-diagram-hint" aria-hidden="true">Open full screen</span></a>`
    + `<figcaption>${label}</figcaption></figure>`;
}

export function transformAnswer(markdown, base, svgs = new Set(), inline = new Map()) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const heading = lines.findIndex(line => /^##\s+/.test(line));
  const match = lines[heading]?.match(/^##\s+([A-Z]\d+)\s+[—-]\s+(.+)$/);
  if (!match) throw new Error('Answer must start with "## Q1 — Title"');
  const tldrIndex = lines.findIndex(line => line.startsWith('**TL;DR:**'));
  const tldr = tldrIndex >= 0 ? lines[tldrIndex].replace('**TL;DR:**', '').trim() : '';
  let body = lines.filter((_, i) => i !== heading && i !== tldrIndex).join('\n').trim();
  body = body
    // Diagrams: served from the private asset folder, opened in the viewer.
    .replace(/!\[([^\]]*)\]\(\.\.\/\.\.\/diagrams\/([^)]+)\)/g, (_, alt, file) => diagramFigure(alt, file, base, svgs, inline))
    // Code links: point at the rendered code page.
    .replace(/\]\(\.\.\/\.\.\/code\/([^)]*)\)/g, (_, path) => `](${base}/code/#${codeAnchor(path.replace(/\/$/, ''))})`);
  return { id: match[1].toLowerCase(), label: match[1], title: match[2].trim(), tldr, body };
}

export function sync({ source = process.env.TAKEHOME_DIR || '.takehome', root = '.' } = {}) {
  const contentDir = join(root, 'src/content/takehome');
  const publicDir = join(root, 'public/p');
  rmSync(contentDir, { recursive: true, force: true });
  rmSync(publicDir, { recursive: true, force: true });
  mkdirSync(contentDir, { recursive: true });
  if (!existsSync(join(source, 'site.json'))) {
    console.log('Take-home: no private source found, skipping.');
    return null;
  }

  const site = JSON.parse(readFileSync(join(source, 'site.json'), 'utf8'));
  if (!/^[a-z0-9-]{12,}$/.test(site.slug)) throw new Error('site.json slug must be 12+ chars of [a-z0-9-]');
  const base = `/p/${site.slug}`;
  const questions = parseQuestions(readFileSync(join(source, 'task.md'), 'utf8'));

  const diagrams = join(source, 'diagrams');
  const svgs = new Set(existsSync(diagrams) ? readdirSync(diagrams).filter(file => file.endsWith('.svg')) : []);
  const inline = new Map([...svgs]
    .map(file => [file, readFileSync(join(diagrams, file), 'utf8').trim()])
    .filter(([, content]) => content.startsWith('<svg') && content.includes('class="sketch-diagram"') && !content.includes('\n')));
  const answers = walk(join(source, 'answers')).filter(path => path.endsWith('.md')).sort();
  answers.forEach((path, order) => {
    const part = basename(join(path, '..'));
    const answer = transformAnswer(readFileSync(path, 'utf8'), base, svgs, inline);
    const frontmatter = {
      label: answer.label, title: answer.title, tldr: answer.tldr,
      part, partLabel: PARTS[part] ?? part, order, question: questions[order] ?? '',
    };
    const yaml = Object.entries(frontmatter).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
    writeFileSync(join(contentDir, `${answer.id}.md`), `---\n${yaml}\n---\n\n${answer.body}\n`);
  });

  const codeRoot = join(source, 'code');
  const code = existsSync(codeRoot) ? walk(codeRoot).sort().map(path => {
    const rel = relative(codeRoot, path);
    return { path: rel, dir: rel.split('/')[0], anchor: codeAnchor(rel), lang: LANGS[extname(path)] ?? 'text', content: readFileSync(path, 'utf8') };
  }) : [];

  if (existsSync(diagrams)) {
    mkdirSync(join(publicDir, site.slug, 'diagrams'), { recursive: true });
    for (const file of readdirSync(diagrams)) {
      if (/\.(png|svg)$/.test(file) && statSync(join(diagrams, file)).isFile()) {
        copyFileSync(join(diagrams, file), join(publicDir, site.slug, 'diagrams', file));
      }
    }
  }

  writeFileSync(join(contentDir, 'data.json'), JSON.stringify({ site, code }, null, 2));
  console.log(`Take-home: synced ${answers.length} answers and ${code.length} code files to ${base}/`);
  return { site, answers: answers.length, code: code.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) sync();
