import { parseClaudeCode } from '../src/data/providers/claude-code.js';
import { findPricing, calculateCost } from '../src/data/pricing.js';

async function main() {
  const records = await parseClaudeCode();
  let input = 0, output = 0, cacheW = 0, cacheR = 0, cost = 0;
  let costUSDUsed = 0, costCalculated = 0;

  for (const r of records) {
    input += r.inputTokens;
    output += r.outputTokens;
    cacheW += r.cacheWriteTokens;
    cacheR += r.cacheReadTokens;
    cost += r.costUSD;
  }

  console.log('=== TokenTrack CC (after fixes) ===');
  console.log('  records:', records.length);
  console.log('  input:', input.toLocaleString());
  console.log('  output:', output.toLocaleString());
  console.log('  cache_write:', cacheW.toLocaleString());
  console.log('  cache_read:', cacheR.toLocaleString());
  console.log('  total:', (input + output + cacheW + cacheR).toLocaleString());
  console.log('  cost: $' + cost.toFixed(2));
  console.log();
  console.log('ccusage: $552.38 | 305K in | 1.7M out | 40.9M cW | 813M cR');
  console.log('  cost ratio:', (cost / 552.38 * 100).toFixed(1) + '%');
  console.log('  output ratio:', (output / 1716013 * 100).toFixed(1) + '%');
  console.log('  cacheR ratio:', (cacheR / 813060000 * 100).toFixed(1) + '%');

  // Verify opus pricing is applied correctly
  const opusRecords = records.filter(r => r.model.includes('opus'));
  let opusCostManual = 0;
  for (const r of opusRecords) {
    opusCostManual += calculateCost(r.model, r.inputTokens, r.outputTokens, r.cacheWriteTokens, r.cacheReadTokens, r.speed);
  }
  console.log();
  console.log('Opus records:', opusRecords.length, 'manual cost: $' + opusCostManual.toFixed(2), 'recorded cost: $' + opusRecords.reduce((s, r) => s + r.costUSD, 0).toFixed(2));

  // Check costUSD field usage
  // Re-parse to check how many entries had costUSD in raw
  console.log();
  console.log('Sample records with costUSD:');
  for (const r of records.slice(0, 3)) {
    console.log(' ', r.model, 'cost:', r.costUSD.toFixed(6));
  }
}

main();
