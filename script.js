/* =========================
   Local preview: when a page is opened straight from disk (file://),
   folder links like "product-portfolio/" show a directory listing, and
   root-absolute links like "/" or "/#experience" resolve against the
   filesystem root instead of the site root. Rewrite both to work from
   disk. No effect on GitHub Pages.
   ========================= */
if (location.protocol === 'file:') {
  const atRoot = !/\/(product-portfolio|global-recognition|thought-leadership|testimonials)\/(index\.html)?$/.test(location.pathname);
  const rootPrefix = atRoot ? './' : '../';
  document.querySelectorAll('a[href]').forEach(a => {
    const raw = a.getAttribute('href');
    if (/^[a-z]+:|^\/\//i.test(raw) || raw.startsWith('#')) return;
    let [path, hash] = raw.split('#');
    if (path.startsWith('/') && !path.startsWith('//')) path = rootPrefix + path.slice(1);
    if (/\/$/.test(path)) path += 'index.html';
    a.setAttribute('href', path + (hash ? '#' + hash : ''));
  });
}

/* =========================
   Navigation: active link + mobile menu
   ========================= */
(function () {
  // Highlight the current page (nav + footer-nav markup stays identical on every page).
  // Covers the brand link, the main nav links and the footer nav links in one pass.
  const norm = p => p.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const here = norm(location.pathname);
  document.querySelectorAll('.site-nav a[href], .footer-nav a[href]').forEach(a => {
    if (norm(new URL(a.href, location.href).pathname) === here) a.setAttribute('aria-current', 'page');
  });

  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const toggle = nav.querySelector('.nav-toggle');
  const links = nav.querySelector('.nav-links');
  if (!toggle || !links) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
  }

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) setOpen(false); });
  window.matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
})();

/* =========================
   Subtle fade-in on scroll
   ========================= */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
})();

/* =========================
   Gallery lightbox (Thought Leadership)
   ========================= */
(function () {
  const dialog = document.getElementById('lightbox');
  const buttons = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!dialog || !buttons.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  let index = 0;

  function show(i) {
    index = (i + buttons.length) % buttons.length;
    const thumb = buttons[index].querySelector('img');
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    caption.textContent = buttons[index].closest('figure').querySelector('figcaption').textContent;
  }

  buttons.forEach((btn, i) => btn.addEventListener('click', () => { show(i); dialog.showModal(); }));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.lightbox-nav--prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lightbox-nav--next').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  // Click on the backdrop closes
  dialog.addEventListener('click', e => { if (e.target === dialog || e.target.classList.contains('lightbox-inner')) dialog.close(); });
  dialog.addEventListener('close', () => buttons[index].focus());
})();
