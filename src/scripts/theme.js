(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const isTheme = value => value === 'light' || value === 'dark';
  let preference;

  function readPreference() {
    try {
      const saved = window.localStorage.getItem('theme');
      preference = isTheme(saved) ? saved : undefined;
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }
  readPreference();

  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#181d19' : '#f8f6f0';
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      const action = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
    }
  }

  const currentTheme = () => preference || (system.matches ? 'dark' : 'light');
  apply(currentTheme());

  function bindToggle() {
    for (const button of document.querySelectorAll('[data-theme-toggle]')) {
      button.hidden = false;
      button.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
          window.localStorage.setItem('theme', preference);
        } catch {
          // Keep the choice in memory for this page even without storage.
        }
        apply(preference);
      });
    }
    apply(currentTheme());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggle, { once: true });
  } else {
    bindToggle();
  }

  system.addEventListener('change', () => {
    if (!preference) apply(currentTheme());
  });
  window.addEventListener('storage', event => {
    if (event.key !== 'theme' && event.key !== null) return;
    preference = isTheme(event.newValue) ? event.newValue : undefined;
    apply(currentTheme());
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      readPreference();
      apply(currentTheme());
    }
  });
})();
