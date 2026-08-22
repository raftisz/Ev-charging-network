// Lightweight UI enhancements: inject SVG icons, add ripple effect on buttons, favorite toggles, and small accessibility helpers
(function () {
  function injectSvgSprite() {
    if (document.getElementById('vg-icon-sprite')) return;
    const svg = `<svg id="vg-icon-sprite" style="display:none;" xmlns="http://www.w3.org/2000/svg">
      <symbol id="icon-menu" viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></symbol>
      <symbol id="icon-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12.1 21.35l-1.1-1.01C5.14 15.24 2 12.39 2 8.99 2 6.42 4.24 4.4 6.8 4.4c1.7 0 3.2.99 4 2.44.81-1.45 2.3-2.44 4-2.44 2.56 0 4.8 2.02 4.8 4.59 0 3.4-3.14 6.25-8.99 11.35l-1.1 1.01z"/></symbol>
      <symbol id="icon-bolt" viewBox="0 0 24 24"><path fill="currentColor" d="M13 2L3 14h7l-1 8 10-12h-7z"/></symbol>
      <symbol id="icon-star" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17.3L6.18 21 7.54 14.97 2.8 10.9l6.28-.54L12 4l2.92 6.36 6.28.54-4.74 4.07L17.82 21z"/></symbol>
      <symbol id="icon-location" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></symbol>
    </svg>`;
    document.body.insertAdjacentHTML('afterbegin', svg);
  }

  function replaceMenuIcons() {
    const btn = document.getElementById('menu-toggle');
    if (!btn) return;
    btn.setAttribute('aria-label', 'Open menu');
    btn.innerHTML = '<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-menu"></use></svg>';
  }

  function setupRipple() {
    document.addEventListener('pointerdown', function (e) {
      const el = e.target.closest('.btn');
      if (!el) return;
      // create ripple
      const rect = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.2;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(ripple);
      requestAnimationFrame(() => ripple.classList.add('ripple-anim'));
      setTimeout(() => { ripple.remove(); }, 600);
    });
  }

  function restoreFavsFromStorage() {
    document.querySelectorAll('.fav-btn').forEach((b) => {
      const id = b.dataset.id;
      if (!id) return;
      const key = 'vg:fav:' + id;
      if (localStorage.getItem(key) === '1') b.classList.add('fav-active');
    });
  }

  function setupFavToggles() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.fav-btn');
      if (!btn) return;
      e.preventDefault();
      const id = btn.dataset.id;
      if (!id) return;
      const key = 'vg:fav:' + id;
      const isActive = btn.classList.toggle('fav-active');
      try { localStorage.setItem(key, isActive ? '1' : '0'); } catch (err) {}
      // small visual feedback
      const label = isActive ? 'Added to favorites' : 'Removed from favorites';
      if (typeof showToast === 'function') showToast(label, false);
    });
  }

  function ensureButtonsAccessible() {
    document.querySelectorAll('.btn').forEach((b) => {
      if (!b.hasAttribute('role')) b.setAttribute('role', 'button');
      if (!b.hasAttribute('tabindex')) b.setAttribute('tabindex', '0');
    });
  }

  function init() {
    injectSvgSprite();
    replaceMenuIcons();
    setupRipple();
    setupFavToggles();
    ensureButtonsAccessible();
    // restore favs if station list already present
    restoreFavsFromStorage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
