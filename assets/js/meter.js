/* meter.js — Feature 4: section-completeness meter + card rating.
 * Adds a visual completeness meter to every shortlist card (from the manifest's
 * completeness field, sourced from the section linter), then places the card's
 * rating beside the section count. */
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

      // completeness meter (all cards)
      const meter = document.createElement('div');
      meter.className = 'sl-meter' + (done ? ' done' : '');
      const head = document.createElement('div');
      head.className = 'sl-meter-head';
      const label = document.createElement('span');
      label.className = 'sl-meter-label';
      label.textContent = (done ? '✓ ' : '') + c + '/' + total + ' planning sections';
      head.appendChild(label);
      const score = body.querySelector('.sl-score');
      if (score) head.appendChild(score);
      const bar = document.createElement('div');
      bar.className = 'sl-meter-bar';
      const fill = document.createElement('span');
      fill.className = 'sl-meter-fill';
      fill.style.width = Math.round((c / total) * 100) + '%';
      bar.appendChild(fill);
      meter.append(head, bar);
      const freshness = document.createElement('small');
      freshness.className = 'sl-evidence-freshness';
      freshness.textContent = t.evidence
        ? `${t.evidence.overallConfidence} evidence · reviewed ${t.evidence.reviewedAt}`
        : 'evidence not yet structured';
      meter.appendChild(freshness);
      body.appendChild(meter);
    });
  });
})();
