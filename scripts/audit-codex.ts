import { parseCodex } from '../src/data/providers/codex.js';
import { loadLiteLLMPricing, findLiteLLMPricing } from '../src/data/litellm-pricing.js';

async function main() {
  const records = await parseCodex();
  let freshInput = 0, output = 0, cached = 0, cost = 0;
  for (const r of records) {
    freshInput += r.inputTokens;
    output += r.outputTokens;
    cached += r.cacheReadTokens;
    cost += r.costUSD;
  }
  console.log('TokenTrack Codex:');
  console.log('  records:', records.length);
  console.log('  fresh input:', freshInput.toLocaleString());
  console.log('  output:', output.toLocaleString());
  console.log('  cached:', cached.toLocaleString());
  console.log('  cost: $' + cost.toFixed(2));
  console.log('\nccusage ref: input=62,221,072 output=6,610,066 cached=1,120,793,600 cost=$444.64');
  console.log('  cost ratio:', (cost / 444.64 * 100).toFixed(1) + '%');

  // Check LiteLLM pricing for the model
  const litellm = await loadLiteLLMPricing();
  const p = findLiteLLMPricing('gpt-5.3-codex', litellm);
  console.log('\nLiteLLM pricing for gpt-5.3-codex:', p ? JSON.stringify(p) : 'NOT FOUND');

  // Manual cost calc
  if (p) {
    const manual = freshInput * p.input_cost_per_token + output * p.output_cost_per_token + cached * (p.cache_read_input_token_cost || p.input_cost_per_token * 0.5);
    console.log('Manual cost with LiteLLM: $' + manual.toFixed(2));
  }
}

main();
