const LEVEL = Object.freeze({ unknown: 0, low: 1, medium: 2, high: 3 });

export function weakestConfidence(values) {
  const normalized = [...values].map((value) => LEVEL[value] == null ? 'unknown' : value);
  if (!normalized.length) return 'unknown';
  return normalized.reduce((weakest, value) => LEVEL[value] < LEVEL[weakest] ? value : weakest, 'high');
}

export function deriveAxisConfidence(record, factsById) {
  if (!record || !Array.isArray(record.evidence) || !record.evidence.length) return 'unknown';
  return weakestConfidence(record.evidence.map((id) => factsById.get(id)?.confidence || 'unknown'));
}

export function deriveEvidenceConfidence(evidence, scoreManifest) {
  const factsById = new Map((evidence?.facts || []).map((fact) => [fact.id, fact]));
  const axes = Object.fromEntries(
    scoreManifest.axes.map(({ id }) => [id, deriveAxisConfidence(evidence?.axes?.[id], factsById)]),
  );
  const defaultAxes = scoreManifest.axes
    .filter(({ weightDefault }) => weightDefault > 0)
    .map(({ id }) => axes[id]);
  return { axes, overall: weakestConfidence(defaultAxes) };
}

export function highConfidenceFactIssue(fact, sources) {
  if (fact?.confidence !== 'high') return null;
  if (!Array.isArray(fact.sourceRefs) || !fact.sourceRefs.length) return 'high-confidence fact requires a source';
  if (fact.proxyStatus === 'unknown') return 'unknown fact cannot have high confidence';
  if (fact.proxyStatus === 'derived' || fact.proxyStatus === 'confirmed') return null;

  const qualifyingTiers = new Set(['official', 'operator', 'observed-quote', 'historical-dataset']);
  const hasQualifyingSource = fact.sourceRefs.some((id) => qualifyingTiers.has(sources[id]?.tier));
  return hasQualifyingSource
    ? null
    : 'high-confidence proxy or readiness claim requires an official, operator, observed-quote, or historical-dataset source';
}
