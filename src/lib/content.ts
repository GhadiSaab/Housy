import { getCollection } from 'astro:content';
import { isPublished, newestFirst } from './publication';

export async function getPosts() {
  return (await getCollection('posts', isPublished)).sort(newestFirst);
}

export async function getProjects() {
  return (await getCollection('projects')).sort((a, b) =>
    Number(b.data.featured) - Number(a.data.featured) || a.data.title.localeCompare(b.data.title),
  );
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}
