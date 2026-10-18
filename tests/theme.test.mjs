import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/scripts/theme.js', import.meta.url), 'utf8');

function page({ saved = null, darkSystem = false, blockedStorage = false } = {}) {
  const events = new Map();
  const windowEvents = new Map();
  const buttonEvents = new Map();
  const attributes = new Map();
  const root = { dataset: {}, style: {} };
  const meta = { content: '#f8f6f0' };
  const button = { hidden: true, setAttribute: (key, value) => attributes.set(key, value), addEventListener: (type, fn) => buttonEvents.set(type, fn) };
  const media = { matches: darkSystem, addEventListener: (type, fn) => events.set(type, fn) };
  const storage = new Map(saved === null ? [] : [['theme', saved]]);
  const document = {
    documentElement: root,
    readyState: 'loading',
    querySelector: () => meta,
    querySelectorAll: () => [button],
    addEventListener: (type, fn) => events.set(type, fn),
  };
  const window = {
    matchMedia: () => media,
    addEventListener: (type, fn) => windowEvents.set(type, fn),
    localStorage: {
      getItem: key => { if (blockedStorage) throw new Error('Storage unavailable'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blockedStorage) throw new Error('Storage unavailable'); storage.set(key, value); },
    },
  };
  runInNewContext(source, { document, window });
  return {
    root, meta, button, attributes, storage,
    ready: () => events.get('DOMContentLoaded')(),
    click: () => buttonEvents.get('click')(),
    system: dark => { media.matches = dark; events.get('change')({ matches: dark }); },
    otherTab: value => windowEvents.get('storage')({ key: 'theme', newValue: value }),
    restore: value => {
      if (value === null) storage.delete('theme'); else storage.set('theme', value);
      windowEvents.get('pageshow')?.({ persisted: true });
    },
  };
}

test('saved choice wins over the system preference before page content loads', () => {
  for (const [saved, system] of [['light', true], ['dark', false]]) {
    const view = page({ saved, darkSystem: system });
    assert.equal(view.root.dataset.theme, saved);
    assert.equal(view.button.hidden, true);
  }
});

test('new visitors follow system changes until they choose a theme', () => {
  const view = page({ darkSystem: true });
  assert.equal(view.root.dataset.theme, 'dark');
  view.ready();
  view.system(false);
  assert.equal(view.root.dataset.theme, 'light');
  view.click();
  assert.equal(view.root.dataset.theme, 'dark');
  view.system(false);
  assert.equal(view.root.dataset.theme, 'dark');
});

test('toggle saves the choice and updates its accessible action and browser color', () => {
  const view = page();
  view.ready();
  assert.equal(view.button.hidden, false);
  assert.equal(view.attributes.get('aria-label'), 'Switch to dark mode');
  view.click();
  assert.equal(view.root.dataset.theme, 'dark');
  assert.equal(view.storage.get('theme'), 'dark');
  assert.equal(view.attributes.get('aria-label'), 'Switch to light mode');
  assert.equal(view.attributes.get('title'), 'Switch to light mode');
  assert.equal(view.meta.content, '#181d19');
  const nextPage = page({ saved: view.storage.get('theme') });
  assert.equal(nextPage.root.dataset.theme, 'dark');
});

test('blocked browser storage does not prevent changing themes', () => {
  const view = page({ blockedStorage: true });
  view.ready();
  view.click();
  assert.equal(view.root.dataset.theme, 'dark');
  view.system(false);
  assert.equal(view.root.dataset.theme, 'dark');
});

test('invalid saved values fall back to the system and cross-tab changes synchronize', () => {
  const view = page({ saved: 'invalid', darkSystem: true });
  view.ready();
  assert.equal(view.root.dataset.theme, 'dark');
  view.otherTab('light');
  assert.equal(view.root.dataset.theme, 'light');
  view.otherTab(null);
  assert.equal(view.root.dataset.theme, 'dark');
});

test('restoring a page from browser history refreshes the saved preference', () => {
  const view = page({ saved: 'light' });
  view.ready();
  view.restore('dark');
  assert.equal(view.root.dataset.theme, 'dark');
  assert.equal(view.attributes.get('aria-label'), 'Switch to light mode');
});
