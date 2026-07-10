export function freshnessIssues(fact, now = new Date()) {
  const issues = [];
  const verified = parseDate(fact.verifiedAt);
  const expires = fact.expiresAt == null ? null : parseDate(fact.expiresAt);
  if (!verified) issues.push('verifiedAt must be an ISO date');
  if (fact.expiresAt != null && !expires) issues.push('expiresAt must be an ISO date');
  if (verified && expires && expires < verified) issues.push('expiresAt must be on or after verifiedAt');
  if (expires && expires < startOfDay(now)) issues.push(`evidence expired on ${fact.expiresAt}`);
  return issues;
}

export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
