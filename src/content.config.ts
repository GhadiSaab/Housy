import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false),
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

export const collections = { posts, projects };
