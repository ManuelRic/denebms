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
