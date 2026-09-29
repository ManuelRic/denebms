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
stagger('.service-list [data-reveal]', 55);
stagger('.fieldwork-grid [data-reveal]', 90);
stagger('.contact [data-reveal]', 100);

const revealElements = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
