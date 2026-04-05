import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { glob } from 'glob';
import { loadLiteLLMPricing, findLiteLLMPricing, calculateCostWithLiteLLM } from '../src/data/litellm-pricing.js';

async function main() {
  const files = await glob('/Users/elishabajemon/.codex/sessions/**/*.jsonl', { absolute: true });
  const litellm = await loadLiteLLMPricing();

  let totalCost = 0;
  let totalFresh = 0, totalOutput = 0, totalCached = 0;
  const modelCosts = new Map<string, number>();

  for (const f of files) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    let model = 'gpt-5.3-codex';

    for await (const line of rl) {
      try {
        const raw = JSON.parse(line);
        // Detect model from response_item or message events
        if (raw.payload?.model || raw.model) {
          model = raw.payload?.model || raw.model || model;
        }
        if (raw.type === 'event_msg' && raw.payload?.type === 'token_count' && raw.payload.info?.last_token_usage) {
          const last = raw.payload.info.last_token_usage;
          const totalInput = last.input_tokens || 0;
          const cachedInput = last.cached_input_tokens || 0;
          const freshInput = Math.max(totalInput - cachedInput, 0);
          const output = last.output_tokens || 0;

          totalFresh += freshInput;
          totalOutput += output;
          totalCached += cachedInput;

          const cost = calculateCostWithLiteLLM(model, freshInput, output, 0, cachedInput, litellm);
          totalCost += cost;
          modelCosts.set(model, (modelCosts.get(model) || 0) + cost);
        }
      } catch {}
    }
  }

  console.log('Fresh input:', totalFresh.toLocaleString());
  console.log('Output:', totalOutput.toLocaleString());
  console.log('Cached:', totalCached.toLocaleString());
  console.log('Total cost: $' + totalCost.toFixed(2));
  console.log('\nBy model:');
  for (const [m, c] of modelCosts) {
    const p = findLiteLLMPricing(m, litellm);
    console.log(`  ${m}: $${c.toFixed(2)} (in=$${((p?.input_cost_per_token || 0) * 1e6).toFixed(2)}/M out=$${((p?.output_cost_per_token || 0) * 1e6).toFixed(2)}/M cached=$${((p?.cache_read_input_token_cost || 0) * 1e6).toFixed(4)}/M)`);
  }
  console.log('\nccusage ref: $444.64');
}

main();
