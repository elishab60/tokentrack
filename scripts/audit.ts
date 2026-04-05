import { parseClaudeCode } from '../src/data/providers/claude-code.js';
import { findPricing } from '../src/data/pricing.js';

async function main() {
  const records = await parseClaudeCode();
  let input = 0, output = 0, cacheW = 0, cacheR = 0, cost = 0;
  const modelStats = new Map<string, { input: number; output: number; cacheW: number; cacheR: number; cost: number; count: number }>();

  for (const r of records) {
    input += r.inputTokens;
    output += r.outputTokens;
    cacheW += r.cacheWriteTokens;
    cacheR += r.cacheReadTokens;
    cost += r.costUSD;

    const m = r.modelDisplay;
    const s = modelStats.get(m) || { input: 0, output: 0, cacheW: 0, cacheR: 0, cost: 0, count: 0 };
    s.input += r.inputTokens;
    s.output += r.outputTokens;
    s.cacheW += r.cacheWriteTokens;
    s.cacheR += r.cacheReadTokens;
    s.cost += r.costUSD;
    s.count++;
    modelStats.set(m, s);
  }

  console.log('=== TokenTrack Claude Code ===');
  console.log('  records:', records.length);
  console.log('  input:', input.toLocaleString());
  console.log('  output:', output.toLocaleString());
  console.log('  cache_write:', cacheW.toLocaleString());
  console.log('  cache_read:', cacheR.toLocaleString());
  console.log('  total:', (input + output + cacheW + cacheR).toLocaleString());
  console.log('  cost: $' + cost.toFixed(2));

  console.log('\n=== ccusage reference ===');
  console.log('  input: 305,260');
  console.log('  output: 1,716,013');
  console.log('  cache_write: 40,893,282');
  console.log('  cache_read: ~813,060,000');
  console.log('  total: ~855,975,000');
  console.log('  cost: $552.38');

  console.log('\n=== DELTAS ===');
  console.log('  input:', input - 305260, `(${((input / 305260) * 100).toFixed(1)}% of reference)`);
  console.log('  output:', output - 1716013, `(${((output / 1716013) * 100).toFixed(1)}% of reference)`);
  console.log('  cost: $' + (cost - 552.38).toFixed(2), `(${((cost / 552.38) * 100).toFixed(1)}% of reference)`);

  console.log('\n=== Per-Model Breakdown ===');
  for (const [model, s] of modelStats) {
    const pricing = findPricing(model);
    console.log(`  ${model}: ${s.count} records, in=${s.input.toLocaleString()}, out=${s.output.toLocaleString()}, cW=${s.cacheW.toLocaleString()}, cR=${s.cacheR.toLocaleString()}, cost=$${s.cost.toFixed(2)}`);
    console.log(`    pricing: in=$${pricing.input}/M, out=$${pricing.output}/M, cW=$${pricing.cacheWrite || '-'}/M, cR=$${pricing.cacheRead || '-'}/M`);
  }

  // Check: manual cost calc for a single model to verify
  console.log('\n=== Manual Cost Verification (sonnet-4-6) ===');
  const sonnet = modelStats.get('sonnet-4-6');
  if (sonnet) {
    const p = findPricing('claude-sonnet-4-6');
    const manual = (sonnet.input / 1e6) * p.input + (sonnet.output / 1e6) * p.output +
      (sonnet.cacheW / 1e6) * (p.cacheWrite || 0) + (sonnet.cacheR / 1e6) * (p.cacheRead || 0);
    console.log('  Calculated:', '$' + manual.toFixed(2));
    console.log('  TokenTrack:', '$' + sonnet.cost.toFixed(2));
    console.log('  Match:', Math.abs(manual - sonnet.cost) < 0.01 ? 'YES' : 'NO - BUG!');
  }
}

main();
