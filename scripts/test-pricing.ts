import { findPricing } from '../src/data/pricing.js';

const models = ['claude-opus-4-6-20260218', 'claude-sonnet-4-6-20260218', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'];
for (const m of models) {
  const p = findPricing(m);
  console.log(m, '->', `in=$${p.input} out=$${p.output} cW=$${p.cacheWrite || '-'} cR=$${p.cacheRead || '-'}`);
}
