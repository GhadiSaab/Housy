import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const contentDate = z.union([
  z.date(),
  z.iso.date().transform(value => new Date(`${value}T00:00:00.000Z`)),
]);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: contentDate,
    updatedAt: contentDate.optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false),
    // Social preview card (1200x627 PNG under public/), from scripts/og/make-og.mjs.
    image: z.string().startsWith('/').optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    technologies: z.array(z.string().trim().min(1)).default([]),
    featured: z.boolean().default(false),
    source: z.url().optional(),
    live: z.url().optional(),
  }),
});

// Private take-home answers, synced at build time by scripts/takehome-sync.mjs (gitignored).
const takehome = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/takehome' }),
  schema: z.object({
    label: z.string(),
    title: z.string(),
    tldr: z.string(),
    part: z.string(),
    partLabel: z.string(),
    order: z.number(),
    question: z.string(),
  }),
});

export const collections = { posts, projects, takehome };
