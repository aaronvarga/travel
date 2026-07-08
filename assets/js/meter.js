/* meter.js — Feature 4: section-completeness meter + gated Recommended badge.
 * Adds a visual completeness meter to every shortlist card (from the manifest's
 * completeness field, sourced from the section linter). Gates the Recommended
 * treatment: a recommended trip keeps its .top styling + "★ Recommended" badge
 * only when every required section is present; otherwise it drops to a muted
 * "pending N sections" state. Coordinates with tools/lint-sections.mjs, which
 * also fails the build if a recommended trip is incomplete. */
(function () {
  'use strict';
  document.addEventListener('board:ready', function (e) {
    const B = e.detail;
    Object.keys(B.cards).forEach(function (slug) {
      const card = B.cards[slug];
      const t = B.bySlug[slug];
      if (!t || !t.completeness) return;
      const c = t.completeness.complete;
      const total = t.completeness.total;
      const done = c >= total;
      const body = card.querySelector('.sl-body');
      if (!body) return;

      // gated Recommended badge (top of card body)
      if (t.recommended) {
        if (!done) card.classList.remove('top');
        const badge = document.createElement('div');
        badge.className = 'sl-rec-badge' + (done ? '' : ' pending');
        const missing = total - c;
        badge.textContent = done
          ? '★ Recommended'
          : 'Recommended · ' + missing + ' section' + (missing === 1 ? '' : 's') + ' pending';
        body.insertBefore(badge, body.firstChild);
      }

      // completeness meter (all cards)
      const meter = document.createElement('div');
      meter.className = 'sl-meter' + (done ? ' done' : '');
      const label = document.createElement('span');
      label.className = 'sl-meter-label';
      label.textContent = (done ? '✓ ' : '') + c + '/' + total + ' planning sections';
      const bar = document.createElement('div');
      bar.className = 'sl-meter-bar';
      const fill = document.createElement('span');
      fill.className = 'sl-meter-fill';
      fill.style.width = Math.round((c / total) * 100) + '%';
      bar.appendChild(fill);
      meter.append(label, bar);
      body.appendChild(meter);
    });
  });
})();
