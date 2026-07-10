import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engine = require('../../assets/js/recommendation-engine.js');

export const {
  total,
  budgetStatus,
  readiness,
  evidenceConfidence,
  compareDefault,
  applyVariant,
} = engine;
