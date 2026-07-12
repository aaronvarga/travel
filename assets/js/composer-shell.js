(() => {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const track = carousel.querySelector('.track');
    const current = carousel.querySelector('.cur');
    const dots = [...carousel.querySelectorAll('.dot')];
    const count = Number(carousel.dataset.n || 0);
    const index = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const sync = () => { const active = index(); if (current) current.textContent = active + 1; dots.forEach((dot, i) => dot.classList.toggle('on', i === active)); };
    const go = (value) => track.scrollTo({ left: Math.max(0, Math.min(count - 1, value)) * track.clientWidth, behavior: 'smooth' });
    carousel.querySelector('.prev')?.addEventListener('click', () => go(index() - 1));
    carousel.querySelector('.next')?.addEventListener('click', () => go(index() + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => go(Number(dot.dataset.i))));
    let timer; track.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(sync, 80); }); sync();
  });

  const menu = document.querySelector('.site-nav-menu');
  const desktop = window.matchMedia('(min-width:960px)');
  const syncMenu = () => { if (menu) menu.open = desktop.matches; };
  syncMenu(); desktop.addEventListener?.('change', syncMenu);
  document.querySelectorAll('.site-nav-links a[href^="#"]').forEach((link) => link.addEventListener('click', () => { if (menu && !desktop.matches) menu.open = false; }));

  const points = window.__COMPOSER_MAP_POINTS__ || [];
  const mapElement = document.getElementById('tripmap');
  if (mapElement && window.L && points.length) {
    const map = L.map(mapElement, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const bounds = [];
    points.forEach((point) => { L.marker([point.lat, point.lng]).addTo(map).bindPopup(`<b>${String(point.n).replace(/[&<>]/g, '')}</b>`); bounds.push([point.lat, point.lng]); });
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
    setTimeout(() => map.invalidateSize(), 200);
  }
})();
