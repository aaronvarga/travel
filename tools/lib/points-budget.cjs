// Gross cash prices remain intact; the comparison budget spends this balance
// independently for each alternative, never cumulatively across trips.
function fixedValuePlan(gross, eligibleTravelUsd, balance = 200000) {
  if (![gross.floorUsd, gross.ceilUsd, eligibleTravelUsd, balance].every(n => Number.isFinite(n) && n >= 0) || gross.ceilUsd < gross.floorUsd) throw new RangeError('Invalid cash budget or miles balance');
  const savingsUsd = Math.min(balance / 100, eligibleTravelUsd, gross.floorUsd);
  return {
    grossFloorUsd: gross.floorUsd,
    grossCeilUsd: gross.ceilUsd,
    floorUsd: gross.floorUsd - savingsUsd,
    ceilUsd: gross.ceilUsd - savingsUsd,
    pointsSavingsUsd: savingsUsd,
    milesRequired: Math.ceil(savingsUsd * 100),
    centsPerMile: 1,
    basis: 'fixed-value-travel',
  };
}

function budgetScore(budget, confidence) {
  if (budget.ceilUsd <= 12000) return 5;
  if (budget.ceilUsd <= 13500) return 4;
  if (budget.ceilUsd > 15000) return 1;
  if (budget.floorUsd <= 12000 && confidence === 'high') return 3;
  return 2;
}

module.exports = { fixedValuePlan, budgetScore };
