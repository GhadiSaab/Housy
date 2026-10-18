import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublished, newestFirst } from '../src/lib/publication.ts';

test('draft articles never qualify for public publication', () => {
  assert.equal(isPublished({ data: { draft: true } }), false);
});

test('articles with false or omitted draft metadata can be published', () => {
  assert.equal(isPublished({ data: { draft: false } }), true);
  assert.equal(isPublished({ data: {} }), true);
});

test('latest articles appear before earlier articles regardless of source order', () => {
  const entries = [
    { id: 'older', data: { publishedAt: new Date('2025-01-01') } },
    { id: 'newer', data: { publishedAt: new Date('2026-09-01') } },
  ];
  assert.deepEqual(entries.sort(newestFirst).map(({ id }) => id), ['newer', 'older']);
});
