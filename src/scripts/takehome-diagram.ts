// Full-screen diagram viewer: fit to screen, zoom (wheel, pinch, buttons, keys), drag to pan.
// Without JS the figure link simply opens the diagram file.
const MAX_ZOOM = 8;

export function initDiagramViewer() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-diagram]')];
  if (!links.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'th-viewer';
  dialog.setAttribute('aria-label', 'Diagram viewer');
  dialog.innerHTML = `
    <div class="th-viewer-bar">
      <p class="th-viewer-title"></p>
      <div class="th-viewer-tools" role="toolbar" aria-label="Zoom">
        <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
        <button type="button" data-zoom="fit" class="th-viewer-level" aria-label="Fit to screen">100%</button>
        <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
        <a class="th-viewer-raw" target="_blank" rel="noopener">Open file <span aria-hidden="true">↗</span></a>
        <button type="button" data-close class="th-viewer-close" aria-label="Close">Close <kbd>Esc</kbd></button>
      </div>
    </div>
    <div class="th-viewer-stage"><img alt="" draggable="false"></div>
    <p class="th-viewer-help">Scroll or pinch to zoom · drag to move · double-click to zoom in · <kbd>0</kbd> fits</p>`;
  document.body.appendChild(dialog);

  const stage = dialog.querySelector<HTMLElement>('.th-viewer-stage')!;
  const img = stage.querySelector('img')!;
  const title = dialog.querySelector('.th-viewer-title')!;
  const level = dialog.querySelector<HTMLButtonElement>('.th-viewer-level')!;
  const raw = dialog.querySelector<HTMLAnchorElement>('.th-viewer-raw')!;

  let scale = 1, fitScale = 1, x = 0, y = 0;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStart: { distance: number; scale: number } | null = null;

  const render = () => {
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    level.textContent = `${Math.round((scale / fitScale) * 100)}%`;
  };

  function fit() {
    const w = img.naturalWidth || 1600, h = img.naturalHeight || 1200;
    const rect = stage.getBoundingClientRect();
    fitScale = Math.min(rect.width / w, rect.height / h) * 0.96;
    scale = fitScale;
    x = (rect.width - w * scale) / 2;
    y = (rect.height - h * scale) / 2;
    render();
  }

  // Zoom keeping the point (px, py) of the stage fixed under the cursor.
  function zoomAt(factor: number, px?: number, py?: number) {
    const rect = stage.getBoundingClientRect();
    px ??= rect.width / 2; py ??= rect.height / 2;
    const next = Math.min(Math.max(scale * factor, fitScale * 0.5), fitScale * MAX_ZOOM);
    x = px - ((px - x) * next) / scale;
    y = py - ((py - y) * next) / scale;
    scale = next;
    render();
  }

  function open(link: HTMLAnchorElement) {
    const source = link.querySelector('img');
    img.alt = source?.alt ?? '';
    title.textContent = source?.alt ?? 'Diagram';
    raw.href = link.href;
    dialog.showModal();
    document.documentElement.classList.add('th-viewer-open');
    if (img.getAttribute('src') !== link.getAttribute('href')) {
      img.onload = fit;
      img.src = link.href;
    }
    if (img.complete && img.naturalWidth) fit();
  }

  links.forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // keep "open in new tab"
    event.preventDefault();
    open(link);
  }));

  dialog.addEventListener('close', () => document.documentElement.classList.remove('th-viewer-open'));
  dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-zoom="in"]')!.addEventListener('click', () => zoomAt(1.4));
  dialog.querySelector('[data-zoom="out"]')!.addEventListener('click', () => zoomAt(1 / 1.4));
  level.addEventListener('click', fit);
  addEventListener('resize', () => { if (dialog.open) fit(); });

  dialog.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') zoomAt(1.4);
    else if (event.key === '-') zoomAt(1 / 1.4);
    else if (event.key === '0') fit();
    else if (event.key.startsWith('Arrow')) {
      const step = 60;
      if (event.key === 'ArrowLeft') x += step;
      if (event.key === 'ArrowRight') x -= step;
      if (event.key === 'ArrowUp') y += step;
      if (event.key === 'ArrowDown') y -= step;
      render();
    } else return;
    event.preventDefault();
    event.stopPropagation();
  });

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = stage.getBoundingClientRect();
    zoomAt(Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015)), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });

  stage.addEventListener('dblclick', event => {
    const rect = stage.getBoundingClientRect();
    if (scale > fitScale * 2.5) fit();
    else zoomAt(2, event.clientX - rect.left, event.clientY - rect.top);
  });

  stage.addEventListener('pointerdown', event => {
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      pinchStart ??= { distance, scale };
      const rect = stage.getBoundingClientRect();
      zoomAt((pinchStart.scale * distance) / pinchStart.distance / scale, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
    } else {
      x += event.clientX - previous.x;
      y += event.clientY - previous.y;
      render();
    }
  });
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (!pointers.size) stage.classList.remove('is-dragging');
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
}
