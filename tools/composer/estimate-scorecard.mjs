import manifest from '../scorecard.manifest.json' with { type: 'json' };

function thresholdScore(value, rubric) {
  const keys = Object.keys(rubric).filter((key) => /^\d+$/.test(key)).map(Number).sort((a, b) => a - b);
  const exactOrLower = keys.filter((key) => value <= key).at(0);
  return exactOrLower == null ? 1 : rubric[String(exactOrLower)];
}

export function nightsScore(nights) {
  if (nights >= 12) return 5;
  return manifest.nightsRubric[String(Math.max(8, nights))] ?? 1;
}

export function ptoDays(departDate, returnDate) {
  const start = new Date(`${departDate}T12:00:00Z`);
  const end = new Date(`${returnDate}T12:00:00Z`);
  let days = 0;
  for (const date = new Date(start.getTime() + 86400000); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const weekday = date.getUTCDay();
    const iso = date.toISOString().slice(0, 10);
    if (weekday >= 1 && weekday <= 5 && iso !== '2027-06-18') days += 1;
  }
  return days;
}

export function ptoScore(days) {
  if (days <= 6) return 5;
  return thresholdScore(days, manifest.ptoRubric);
}

export function budgetScore({ floorUsd, ceilUsd }) {
  if (ceilUsd <= 12000) return 5;
  if (ceilUsd <= 13500) return 4;
  if (floorUsd <= 12000 && ceilUsd <= 15000) return 3;
  if (ceilUsd <= 15500) return 2;
  return 1;
}

export function estimateScorecard({ legA, legB, edge, totalNights, budget, departDate, returnDate }) {
  const variety = new Set([...(legA.scoreHints.varietyTags ?? []), ...(legB.scoreHints.varietyTags ?? [])]).size;
  const pto = ptoDays(departDate, returnDate);
  const axes = {
    budget: budgetScore(budget),
    weather: Math.min(legA.scoreHints.weather, legB.scoreHints.weather),
    swim: Math.max(legA.scoreHints.swim, legB.scoreHints.swim),
    variety: variety >= 6 ? 5 : variety >= 4 ? 4 : 3,
    ease: Math.max(1, 6 - edge.complexity),
    food: Math.min(legA.scoreHints.food, legB.scoreHints.food),
    risk: Math.max(1, 6 - edge.risk),
    nights: nightsScore(totalNights),
    novelty: Math.min(legA.scoreHints.novelty, legB.scoreHints.novelty),
    pto: ptoScore(pto),
  };
  const totalBaked = axes.budget * 2 + ['weather', 'swim', 'variety', 'ease', 'food', 'risk', 'nights', 'novelty'].reduce((sum, key) => sum + axes[key], 0);
  return { axes, pto: { days: pto, nights: totalNights }, totalBaked, estimated: true, audited: false };
}
