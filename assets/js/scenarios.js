/* Scenario presets, preferred-budget control and additive trip variants. */
(function () {
  'use strict';
  const labels = {
    default: 'Balanced default', value: 'Value + resilience',
    'lowest-friction': 'Lowest friction', 'maximum-swim': 'Maximum swimming',
    'epic-scenery': 'Epic scenery',
  };

  document.addEventListener('board:ready', function (event) {
    const B = event.detail;
    const panel = document.getElementById('scenario-panel');
    if (!panel) return;
    fetch('assets/rank-analysis.json').then((response) => response.json()).then((analysis) => {
      render(panel, B, analysis);
    }).catch(() => render(panel, B, null));
  });

  function render(panel, B, analysis) {
    panel.replaceChildren();
    const head = el('div', 'hub-panel-head');
    head.appendChild(el('h3', null, 'Test another version of the decision'));
    head.appendChild(el('p', null, 'Presets change priorities; the budget control changes warnings, never visibility. Canonical itineraries remain intact.'));
    panel.appendChild(head);

    const presets = el('div', 'scenario-presets');
    const presetData = analysis?.presets || {};
    Object.entries(labels).forEach(([id, label]) => {
      const button = el('button', 'hub-btn scenario-preset', label);
      button.type = 'button'; button.dataset.scenario = id;
      button.addEventListener('click', () => {
        const weights = presetData[id] || Object.fromEntries(B.axesDefs.map((axis) => [axis.id, axis.weightDefault]));
        Store.set({ scenario: id, weights: Object.assign({}, weights) });
      });
      presets.appendChild(button);
    });
    panel.appendChild(presets);

    const budget = el('label', 'scenario-budget');
    const budgetText = el('span');
    const range = document.createElement('input');
    range.type = 'range'; range.min = '12000'; range.max = '22000'; range.step = '500';
    range.addEventListener('input', () => Store.set({ preferredMaxUsd: +range.value }));
    budget.append(budgetText, range);
    panel.appendChild(budget);

    if (analysis?.robustFinalists?.length) {
      const names = analysis.robustFinalists.map((slug) => B.bySlug[slug]?.displayName || slug).join(', ');
      panel.appendChild(el('p', 'scenario-robust', 'Weight sensitivity: the robust finalist set is ' + names + '. This is sensitivity analysis, not a certainty claim.'));
    }
    panel.hidden = false;

    function sync(state) {
      range.value = state.preferredMaxUsd || B.budgetTargets.preferredMaxUsd || 15000;
      budgetText.textContent = 'Strongly preferred maximum: $' + (+range.value).toLocaleString();
      panel.querySelectorAll('.scenario-preset').forEach((button) => button.classList.toggle('is-active', button.dataset.scenario === (state.scenario || 'default')));
    }
    Store.subscribe(sync); sync(Store.get());
  }

  function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
})();
