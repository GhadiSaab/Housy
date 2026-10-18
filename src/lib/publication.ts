export function isPublished(entry: { data: { draft?: boolean } }): boolean {
  return entry.data.draft !== true;
}

export function newestFirst(
  a: { data: { publishedAt: Date } },
  b: { data: { publishedAt: Date } },
): number {
  return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
}
