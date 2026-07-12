(() => {
  const cards = [...document.querySelectorAll('.builder-card')];
  const chips = [...document.querySelectorAll('.builder-chip')];
  const status = document.querySelector('.builder-status');
  const data = JSON.parse(document.getElementById('builder-data')?.textContent || '[]');

  function select(start) {
    let visible = 0;
    const partners = new Set();
    for (const card of cards) {
      const show = start === 'all' || card.dataset.start === start;
      card.hidden = !show;
      if (show) {
        visible += 1;
        partners.add(card.dataset.partner);
      }
    }
    for (const chip of chips) chip.setAttribute('aria-pressed', String(chip.dataset.start === start));
    const label = chips.find((chip) => chip.dataset.start === start)?.textContent.trim() || 'All';
    status.textContent = start === 'all'
      ? `Showing all ${visible} composed drafts.`
      : `${label}: ${visible} compatible ${visible === 1 ? 'partner' : 'partners'} (${partners.size} destinations).`;
  }

  for (const chip of chips) chip.addEventListener('click', () => select(chip.dataset.start));
  if (data.length !== cards.length) status.textContent = 'Trip data could not be reconciled; all server-rendered cards remain available.';
})();
