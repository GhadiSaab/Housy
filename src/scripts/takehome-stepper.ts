// Turns a rendered answer into steps: one section (h3) at a time.
// Without JS the whole answer stays readable as a normal article.
const MODE_KEY = 'takehome-read-all';

function readAllPreference(): boolean {
  try { return localStorage.getItem(MODE_KEY) === '1'; } catch { return false; }
}
function saveReadAll(value: boolean) {
  try { localStorage.setItem(MODE_KEY, value ? '1' : '0'); } catch { /* storage blocked: keep default */ }
}

export function initStepper() {
  // On small screens the question list is a horizontal strip: show the current one.
  const currentQuestion = document.querySelector<HTMLElement>('.th-rail ol a[aria-current="page"]');
  const strip = currentQuestion?.closest('ol');
  if (currentQuestion && strip && strip.scrollWidth > strip.clientWidth) {
    strip.scrollLeft = currentQuestion.offsetLeft - strip.offsetLeft - 16;
  }

  const root = document.querySelector<HTMLElement>('[data-answer]');
  const prose = root?.querySelector<HTMLElement>('[data-prose]');
  if (!root || !prose) return;

  // Group the prose into sections: content before the first h3 becomes "Overview".
  const sections: { title: string; el: HTMLElement }[] = [];
  let current: HTMLElement | null = null;
  for (const node of [...prose.childNodes]) {
    const isHeading = node instanceof HTMLHeadingElement && node.tagName === 'H3';
    if (isHeading || !current) {
      current = document.createElement('section');
      current.className = 'th-step';
      const title = isHeading ? (node.textContent ?? '').replace(/^\s*\d+\.\s*/, '').trim() : 'Overview';
      sections.push({ title, el: current });
      prose.appendChild(current);
    }
    current.appendChild(node);
  }
  // Drop an empty leading "Overview" (whitespace only).
  if (sections.length > 1 && sections[0].title === 'Overview' && !sections[0].el.textContent?.trim() && !sections[0].el.querySelector('img')) {
    sections.shift()!.el.remove();
  }
  if (sections.length < 2) return;

  const steps = root.querySelector<HTMLElement>('[data-steps]')!;
  const pager = root.querySelector<HTMLElement>('[data-pager]')!;
  const prevBtn = pager.querySelector<HTMLButtonElement>('[data-prev]')!;
  const nextBtn = pager.querySelector<HTMLButtonElement>('[data-next]')!;
  const prevLabel = pager.querySelector('[data-prev-label]')!;
  const nextLabel = pager.querySelector('[data-next-label]')!;
  const count = pager.querySelector('[data-count]')!;
  const readAll = root.querySelector<HTMLInputElement>('[data-read-all]')!;
  const nextQuestion = root.querySelector<HTMLAnchorElement>('[data-next-question]');

  const buttons = sections.map((section, i) => {
    // No element id matches #section-N, so the browser doesn't jump; we scroll ourselves.
    section.el.dataset.section = String(i + 1);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'th-step-chip';
    button.innerHTML = `<span class="th-step-n">${String(i + 1).padStart(2, '0')}</span><span class="th-step-t"></span>`;
    button.querySelector('.th-step-t')!.textContent = section.title;
    button.addEventListener('click', () => go(i, true));
    steps.appendChild(button);
    return button;
  });

  let index = 0;
  const seen = new Set<number>();

  function go(i: number, focus = false) {
    index = Math.max(0, Math.min(sections.length - 1, i));
    seen.add(index);
    sections.forEach((s, j) => { s.el.hidden = !readAll.checked && j !== index; });
    buttons.forEach((b, j) => {
      if (j === index) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('is-seen', seen.has(j));
    });
    count.textContent = `${index + 1} / ${sections.length}`;
    prevBtn.disabled = index === 0;
    prevLabel.textContent = index > 0 ? sections[index - 1].title : 'Previous';
    const last = index === sections.length - 1;
    nextLabel.textContent = last ? (nextQuestion?.textContent?.replace('→', '').trim() || 'Done') : sections[index + 1].title;
    nextBtn.classList.toggle('is-next-question', last);
    if (focus) {
      // Only on reader navigation: setting the hash during load makes the browser jump to it.
      history.replaceState(null, '', `#section-${index + 1}`);
      buttons[index].scrollIntoView({ block: 'nearest', inline: 'center' });
      const top = steps.getBoundingClientRect().top + window.scrollY - 16;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function applyMode() {
    root!.classList.toggle('is-read-all', readAll.checked);
    steps.hidden = readAll.checked;
    pager.hidden = readAll.checked;
    go(index);
  }

  prevBtn.addEventListener('click', () => go(index - 1, true));
  nextBtn.addEventListener('click', () => {
    if (index < sections.length - 1) go(index + 1, true);
    else if (nextQuestion) location.href = nextQuestion.href;
  });
  readAll.addEventListener('change', () => { saveReadAll(readAll.checked); applyMode(); });
  document.addEventListener('keydown', event => {
    if (readAll.checked || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
    if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1, true); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1, true); }
  });

  const fromHash = Number(location.hash.match(/^#section-(\d+)$/)?.[1] ?? 1) - 1;
  index = Number.isFinite(fromHash) ? fromHash : 0;
  readAll.checked = readAllPreference();
  root.classList.add('is-stepped');
  applyMode();
  if (index > 0 && !readAll.checked) steps.scrollIntoView({ block: 'start' });
}
