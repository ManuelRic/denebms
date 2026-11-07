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
  // Three sequential impacts, the existing spin, then a brief hold.
  const minimumDuration = reduceMotion || !pageLoader ? 0 : 3200;
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
window.setTimeout(releaseLoader, 6500);

const menuButton = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) menuButton.querySelector('.sr-only').textContent = 'Abrir menú';
  nav?.classList.remove('open');
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
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

const services = {
  vibraciones: { image: 'analisis-vibraciones.jpg', alt: 'Sensor de vibración instalado sobre maquinaria industrial', category: 'Detectar el origen', title: 'Escuchar lo que la máquina te dice.', description: 'Identificamos fallos mecánicos mediante mediciones de vibración y seguimiento de tendencias, para orientar la intervención con datos.' },
  alineacion: { image: 'alineacion-laser-original.jpeg', alt: 'Instrumentos láser instalados en un acoplamiento de maquinaria', category: 'Corregir con precisión', title: 'Cada eje, en su posición.', description: 'Corregimos la alineación de equipos horizontales, verticales y acoplamientos especiales mediante tecnología láser.' },
  equilibrado: { image: 'equilibrado-dinamico.jpeg', alt: 'Rotor instrumentado para equilibrado dinámico en taller', category: 'Recuperar el equilibrio', title: 'El movimiento empieza en el equilibrio.', description: 'Corregimos el desequilibrio de rotores en uno o dos planos, con intervención en planta o en taller.' },
  cardan: { image: 'alineacion-cardan-original.jpg', alt: 'Instrumentos láser colocados en los extremos de un eje cardan', category: 'Ajustar la transmisión', title: 'Alinear sin desmontar el eje.', description: 'Ajustamos transmisiones cardan sin desmontar el eje ni realizar maniobras complejas, mediante medición y alineación especializada.' },
  concentricidad: { image: 'concentricidad-laser-original.jpg', alt: 'Medición de concentricidad sobre un conjunto mecánico industrial', category: 'Comprobar la geometría', title: 'Un mismo centro. Un giro preciso.', description: 'Comprobamos los centros y los ejes de rotación de conjuntos mecánicos mediante medición de concentricidad láser.' },
  geometria: { image: 'mediciones-geometricas-original.jpg', alt: 'Láser tracker realizando mediciones en una instalación industrial', category: 'Medir en el espacio', title: 'La geometría también cuenta.', description: 'Controlamos la planitud, la nivelación y el posicionamiento de equipos mediante tecnología láser tracker.' },
  ruido: { image: 'medicion-ruido-original.jpg', alt: 'Sonómetro midiendo el ruido de un motor industrial en servicio', category: 'Evaluar el entorno', title: 'Medir el ruido. Entender el entorno.', description: 'Evaluamos el ruido ambiental de las instalaciones mediante sonómetro y mediciones realizadas en el entorno de trabajo.' }
};
const serviceTabs = [...document.querySelectorAll('[data-service]')];
const servicePanel = document.getElementById('service-panel');
function selectService(tab, moveFocus = false) {
  const service = services[tab.dataset.service];
  if (!service || !servicePanel) return;
  serviceTabs.forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  servicePanel.setAttribute('aria-labelledby', tab.id);
  const image = servicePanel.querySelector('[data-service-image]');
  image.src = `assets/${service.image}`;
  image.alt = service.alt;
  servicePanel.querySelector('[data-service-category]').textContent = service.category;
  servicePanel.querySelector('[data-service-title]').textContent = service.title;
  servicePanel.querySelector('[data-service-description]').textContent = service.description;
  servicePanel.querySelector('[data-service-link]').setAttribute('aria-label', `Consultar sobre ${tab.querySelector('span:nth-child(2)').textContent.toLowerCase()}`);
  if (moveFocus) tab.focus();
}
serviceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    selectService(tab);
    if (window.matchMedia('(max-width: 560px)').matches) {
      servicePanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
  });
  tab.addEventListener('keydown', (event) => {
    let nextIndex;
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % serviceTabs.length;
    else if (event.key === 'ArrowUp') nextIndex = (index - 1 + serviceTabs.length) % serviceTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = serviceTabs.length - 1;
    else return;
    event.preventDefault();
    selectService(serviceTabs[nextIndex], true);
  });
});
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

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
