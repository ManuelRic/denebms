const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pageLoader = document.querySelector('[data-loader]');
const loaderLogo = document.querySelector('[data-loader-logo]');
const loadingStatus = document.querySelector('[data-loading-status]');
const loadingContent = pageLoader ? [...document.querySelectorAll('body > header, body > main, body > footer')] : [];
let loaderStartedAt = performance.now();
let loaderReleased = false;
let loaderPrepared = false;
let pageLoaded = document.readyState === 'complete';

loadingContent.forEach((element) => { element.inert = true; });
if (pageLoader) {
  document.querySelector('main')?.setAttribute('aria-busy', 'true');
  if (loadingStatus) loadingStatus.textContent = 'Cargando la página…';
}

function releaseLoader() {
  if (loaderReleased) return;
  loaderReleased = true;
  document.body.classList.remove('is-loading');
  loadingContent.forEach((element) => { element.inert = false; });
  document.querySelector('main')?.removeAttribute('aria-busy');
  if (loadingStatus) loadingStatus.textContent = '';
  pageLoader?.classList.add('is-leaving');
  window.setTimeout(() => pageLoader?.remove(), reduceMotion ? 180 : 650);
}

function scheduleLoaderRelease() {
  const minimumDuration = reduceMotion || !pageLoader ? 0 : 2050;
  const elapsed = performance.now() - loaderStartedAt;
  window.setTimeout(releaseLoader, Math.max(0, minimumDuration - elapsed));
}

function startLoaderAnimation(separated = false) {
  if (loaderPrepared || loaderReleased) return;
  loaderPrepared = true;
  loaderStartedAt = performance.now();
  loaderLogo?.classList.toggle('is-separated', separated);
  pageLoader?.classList.add('is-ready');
  if (pageLoaded) scheduleLoaderRelease();
}

function separateLoaderPieces() {
  if (!loaderLogo) {
    startLoaderAnimation();
    return;
  }

  const source = new Image();
  source.decoding = 'async';

  source.addEventListener('load', async () => {
    try {
      const size = 384;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas is unavailable');

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(source, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size);
      const total = size * size;
      const labels = new Int32Array(total);
      const queue = new Int32Array(total);
      const components = [null];
      const offsets = [-size - 1, -size, -size + 1, -1, 1, size - 1, size, size + 1];
      let componentId = 0;

      for (let index = 0; index < total; index += 1) {
        if (labels[index] || pixels.data[index * 4 + 3] <= 6) continue;

        componentId += 1;
        let head = 0;
        let tail = 0;
        let area = 0;
        let sumX = 0;
        let sumY = 0;
        queue[tail++] = index;
        labels[index] = componentId;

        while (head < tail) {
          const current = queue[head++];
          const x = current % size;
          const y = Math.floor(current / size);
          area += 1;
          sumX += x;
          sumY += y;

          offsets.forEach((offset) => {
            const next = current + offset;
            if (next < 0 || next >= total || labels[next] || pixels.data[next * 4 + 3] <= 6) return;
            const nextX = next % size;
            const nextY = Math.floor(next / size);
            if (Math.abs(nextX - x) > 1 || Math.abs(nextY - y) > 1) return;
            labels[next] = componentId;
            queue[tail++] = next;
          });
        }

        components.push({ area, x: sumX / area, y: sumY / area });
      }

      const componentGroups = new Int8Array(components.length);
      components.slice(1).forEach((component, index) => {
        const angle = Math.atan2(component.y - size / 2, component.x - size / 2) * 180 / Math.PI;
        componentGroups[index + 1] = angle >= -105 && angle < 15 ? 1 : angle >= 15 && angle < 135 ? 2 : 3;
      });

      const blades = [...loaderLogo.querySelectorAll('.loader-blade')];
      blades.forEach((blade, groupIndex) => {
        const pieceCanvas = document.createElement('canvas');
        pieceCanvas.width = size;
        pieceCanvas.height = size;
        const pieceContext = pieceCanvas.getContext('2d');
        const piecePixels = new ImageData(new Uint8ClampedArray(pixels.data), size, size);

        for (let pixel = 0; pixel < total; pixel += 1) {
          if (componentGroups[labels[pixel]] !== groupIndex + 1) piecePixels.data[pixel * 4 + 3] = 0;
        }

        pieceContext.putImageData(piecePixels, 0, 0);
        blade.src = pieceCanvas.toDataURL('image/png');
      });

      await Promise.all(blades.map((blade) => blade.decode?.().catch(() => undefined)));
      startLoaderAnimation(true);
    } catch {
      startLoaderAnimation();
    }
  }, { once: true });

  source.addEventListener('error', () => startLoaderAnimation(), { once: true });
  source.src = loaderLogo.querySelector('.loader-symbol').getAttribute('src');
}

separateLoaderPieces();

if (!pageLoaded) {
  window.addEventListener('load', () => {
    pageLoaded = true;
    if (loaderPrepared) scheduleLoaderRelease();
  }, { once: true });
}
window.setTimeout(releaseLoader, 4500);

document.querySelectorAll('[data-loading-image]').forEach((figure) => {
  const image = figure.querySelector('img');
  if (!image) return;

  const finishImageLoading = () => {
    figure.classList.remove('image-pending');
    figure.removeAttribute('aria-busy');
  };
  const revealImage = async () => {
    try { await image.decode(); } catch { /* Reveal the image or its alternative text. */ }
    finishImageLoading();
  };

  figure.setAttribute('aria-busy', 'true');
  image.addEventListener('load', revealImage, { once: true });
  image.addEventListener('error', finishImageLoading, { once: true });
  if (image.complete) {
    if (image.naturalWidth) revealImage();
    else finishImageLoading();
  }
});

const menuButton = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const header = document.querySelector('[data-header]');
const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

function stagger(selector, step = 70) {
  document.querySelectorAll(selector).forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * step}ms`);
  });
}

stagger('.credentials [data-reveal]', 80);
document.querySelectorAll('.service-grid, .maintenance-grid').forEach((grid) => {
  grid.querySelectorAll('[data-reveal]').forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${(index % 2) * 70}ms`);
  });
});
stagger('.contact [data-reveal]', 100);

const revealElements = document.querySelectorAll('[data-reveal]');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((element) => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealElements.forEach((element) => revealObserver.observe(element));
}

document.querySelector('[data-contact-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('nombre') || '').trim();
  const company = String(form.get('empresa') || '').trim();
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('mensaje') || '').trim();
  const subject = encodeURIComponent(`Consulta web${company ? ` · ${company}` : ''}`);
  const body = encodeURIComponent(`Nombre: ${name}\nEmpresa: ${company || '—'}\nCorreo: ${email}\n\n${message}`);
  window.location.href = `mailto:lorenzosoler@denebms.com?subject=${subject}&body=${body}`;
});
