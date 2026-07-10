/* Evidence drawers and card-level trust/readiness badges. */
(function () {
  'use strict';
  document.addEventListener('board:ready', function (event) {
    const B = event.detail;
    const dialog = document.getElementById('evidence-dialog');
    if (!dialog) return;
    Object.entries(B.rows).forEach(([slug, row]) => {
      const button = el('button', 'evidence-open', 'Why these scores?');
      button.type = 'button'; button.addEventListener('click', () => open(B.currentBySlug[slug] || B.bySlug[slug]));
      row.querySelector('th')?.appendChild(button);
    });
    Object.entries(B.cards).forEach(([slug, card]) => {
      const trip = B.bySlug[slug];
      const tags = card.querySelector('.sl-tags') || card.querySelector('.sl-body');
      if (!trip || !tags) return;
      tags.appendChild(badge('readiness-badge ' + trip.readiness.tone, trip.readiness.label));
      tags.appendChild(badge('confidence-badge ' + (trip.evidence?.overallConfidence || 'unknown'), `${capitalize(trip.evidence?.overallConfidence || 'unknown')} evidence`));
      tags.appendChild(badge('scenario-budget-badge', ''));
      tags.querySelectorAll('span').forEach((tag) => {
        if (tag.classList.contains('scenario-budget-badge')) return;
        if (/(?:cross|above|exceed|break|near|within).*(?:\$15|preferred|budget)|(?:\$15|preferred).*(?:cross|above|exceed|break|near|within)/i.test(tag.textContent)) tag.hidden = true;
      });
    });
    document.addEventListener('board:render', refreshBudgetBadges);
    refreshBudgetBadges();
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

    function open(trip) {
      const content = dialog.querySelector('.evidence-dialog-content');
      content.replaceChildren();
      const head = el('div', 'evidence-dialog-head');
      const title = el('div');
      title.append(el('p', 'eyebrow', 'Evidence & rationale'), el('h2', null, trip.displayName));
      const close = el('button', 'evidence-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close evidence'); close.addEventListener('click', () => dialog.close());
      const body = el('div', 'evidence-dialog-body');
      head.append(title, close); content.append(head, body);
      const status = el('div', 'evidence-status');
      status.append(badge('readiness-badge ' + trip.readiness.tone, trip.readiness.label));
      const preferences = B.preferences();
      const budgetStatus = RecommendationEngine.budgetStatus(trip.budget, preferences);
      status.append(badge('budget-badge ' + budgetStatus, budgetLabel(budgetStatus, preferences)));
      status.append(badge('confidence-badge ' + trip.evidence.overallConfidence, `${capitalize(trip.evidence.overallConfidence)} confidence`));
      body.appendChild(status);
      body.appendChild(el('p', 'evidence-note', `Last evidence review: ${trip.evidence.reviewedAt}. Appeal score, booking readiness and confidence are separate; uncertainty does not silently lower the /50 score.`));

      const axes = el('div', 'evidence-axes');
      B.axesDefs.forEach((axis) => {
        const record = trip.evidence.axes[axis.id];
        const item = el('article', 'evidence-axis');
        const heading = el('h3'); heading.append(document.createTextNode(axis.label + ' '), badge('axis-score', record.score + '/5'));
        item.append(heading, el('p', null, record.rationale), el('small', null, `${capitalize(record.confidence)} confidence · evidence: ${record.evidence.join(', ')}`));
        axes.appendChild(item);
      });
      body.appendChild(axes);

      const facts = el('details', 'evidence-facts'); facts.open = false;
      facts.appendChild(el('summary', null, `Inspect ${trip.evidence.facts.length} supporting facts and sources`));
      trip.evidence.facts.forEach((fact) => {
        const item = el('div', 'evidence-fact');
        item.append(el('strong', null, fact.id.replaceAll('-', ' ')), el('span', null, `${fact.proxyStatus} · ${fact.confidence} confidence · verified ${fact.verifiedAt}${fact.expiresAt ? ' · recheck by ' + fact.expiresAt : ''}`));
        const links = el('span', 'evidence-links');
        (fact.sourceRefs || []).forEach((sourceId) => {
          const source = B.evidenceSources?.[sourceId];
          if (!source) return;
          if (source.url) { const link = el('a', null, source.label); link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer'; links.appendChild(link); }
          else links.appendChild(el('span', null, source.label));
        });
        (fact.sources || []).forEach((source) => {
          if (!source?.url) return;
          const link = el('a', null, source.label || source.url); link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer'; links.appendChild(link);
        });
        const locator = fact.sourceLocators ? Object.values(fact.sourceLocators).join(' · ') : '';
        if (locator) item.appendChild(el('small', 'evidence-locator', locator));
        item.appendChild(links); facts.appendChild(item);
      });
      body.appendChild(facts);
      dialog.showModal();
    }

    function refreshBudgetBadges() {
      const preferences = B.preferences();
      Object.entries(B.cards).forEach(([slug, card]) => {
        const trip = B.currentBySlug[slug] || B.bySlug[slug];
        const badgeNode = card.querySelector('.scenario-budget-badge');
        if (!trip || !badgeNode) return;
        const status = RecommendationEngine.budgetStatus(trip.budget, preferences);
        badgeNode.className = 'scenario-budget-badge budget-badge ' + status;
        badgeNode.textContent = budgetLabel(status, preferences);
      });
    }
  });

  function badge(cls, text) { return el('span', cls, text); }
  function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function budgetLabel(status, preferences) {
    const target = '$' + ((preferences?.targetUsd || 12000) / 1000).toLocaleString() + 'k';
    const preferred = '$' + ((preferences?.preferredMaxUsd || 15000) / 1000).toLocaleString() + 'k';
    return ({ 'target-fit': `At/below ${target} target`, 'within-preference': `Within ${preferred} preference`, 'crosses-preference': `Range crosses ${preferred}`, 'likely-over-preference': `Likely above ${preferred}` })[status] || 'Budget evidence needed';
  }
  function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
})();
