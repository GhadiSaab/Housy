import { getCollection } from 'astro:content';

interface TakehomeData {
  site: { slug: string; title: string; author: string };
  code: { path: string; dir: string; anchor: string; lang: string; content: string }[];
}

// data.json only exists when scripts/takehome-sync.mjs found the private source.
const files = import.meta.glob<TakehomeData>('../content/takehome/data.json', { eager: true, import: 'default' });
export const takehome: TakehomeData | null = Object.values(files)[0] ?? null;

export const takehomeBase = () => `/p/${takehome!.site.slug}`;

export async function getAnswers() {
  if (!takehome) return [];
  return (await getCollection('takehome')).sort((a, b) => a.data.order - b.data.order);
}

// TL;DRs come from frontmatter as plain strings: render **bold**, *italic* and `code` safely.
export function inlineMarkdown(text: string) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
