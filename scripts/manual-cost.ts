import { parseClaudeCode } from '../src/data/providers/claude-code.js';
import { findPricing } from '../src/data/pricing.js';

async function main() {
  const records = await parseClaudeCode();

  // Group by model and calculate cost manually
  const models = new Map<string, { in: number; out: number; cW: number; cR: number; count: number }>();

  for (const r of records) {
    const key = r.model;
    const m = models.get(key) || { in: 0, out: 0, cW: 0, cR: 0, count: 0 };
    m.in += r.inputTokens;
    m.out += r.outputTokens;
    m.cW += r.cacheWriteTokens;
    m.cR += r.cacheReadTokens;
    m.count++;
    models.set(key, m);
  }

  let totalCost = 0;
  console.log('Manual cost calculation:');
  for (const [model, m] of models) {
    const p = findPricing(model);
    const cost = (m.in / 1e6) * p.input + (m.out / 1e6) * p.output +
      (m.cW / 1e6) * (p.cacheWrite || 0) + (m.cR / 1e6) * (p.cacheRead || 0);
    totalCost += cost;
    console.log(`  ${model}`);
    console.log(`    pricing: in=$${p.input} out=$${p.output} cW=$${p.cacheWrite} cR=$${p.cacheRead}`);
    console.log(`    tokens: in=${m.in.toLocaleString()} out=${m.out.toLocaleString()} cW=${m.cW.toLocaleString()} cR=${m.cR.toLocaleString()}`);
    console.log(`    cost: $${cost.toFixed(2)}`);
  }
  console.log(`\nTotal cost: $${totalCost.toFixed(2)}`);
  console.log('ccusage cost: $552.38');
  console.log('Delta: $' + (totalCost - 552.38).toFixed(2));

  // What if output_tokens are overcounted by 3x?
  // Try with ccusage's output total (1,716,013)
  let adjustedCost = 0;
  for (const [model, m] of models) {
    const p = findPricing(model);
    const ratio = 1716013 / 5216771; // ccusage output / our output
    const adjOut = m.out * ratio;
    const cost = (m.in / 1e6) * p.input + (adjOut / 1e6) * p.output +
      (m.cW / 1e6) * (p.cacheWrite || 0) + (m.cR / 1e6) * (p.cacheRead || 0);
    adjustedCost += cost;
  }
  console.log(`\nWith adjusted output (ratio ${(1716013/5216771).toFixed(3)}): $${adjustedCost.toFixed(2)}`);
}

main();
