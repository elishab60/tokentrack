import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { glob } from 'glob';

async function main() {
  const files = await glob('/Users/elishabajemon/.claude/projects/**/*.jsonl', {
    absolute: true,
    ignore: ['**/skill-injections.jsonl'],
  });

  // Parse like ccusage does: last entry per message.id, group by stop_reason
  const byId = new Map<string, any>();

  for (const f of files) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    for await (const line of rl) {
      try {
        const raw = JSON.parse(line);
        if (raw.type !== 'assistant' || !raw.message?.usage) continue;
        const u = raw.message.usage;
        if ((u.input_tokens || 0) + (u.output_tokens || 0) === 0) continue;
        const id = raw.message.id || raw.uuid || '';
        if (!id) continue;

        const existing = byId.get(id);
        if (!existing || u.output_tokens >= existing.usage.output_tokens) {
          byId.set(id, { usage: u, stop: raw.message.stop_reason, model: raw.message.model });
        }
      } catch {}
    }
  }

  // Aggregate by stop_reason
  const stats: Record<string, { count: number; input: number; output: number; cacheW: number; cacheR: number }> = {};

  for (const [, entry] of byId) {
    const sr = entry.stop || 'none';
    if (!stats[sr]) stats[sr] = { count: 0, input: 0, output: 0, cacheW: 0, cacheR: 0 };
    stats[sr].count++;
    stats[sr].input += entry.usage.input_tokens || 0;
    stats[sr].output += entry.usage.output_tokens || 0;
    stats[sr].cacheW += entry.usage.cache_creation_input_tokens || 0;
    stats[sr].cacheR += entry.usage.cache_read_input_tokens || 0;
  }

  console.log('Total unique message IDs:', byId.size);
  console.log('\nBy stop_reason:');
  let totalIn = 0, totalOut = 0, totalCW = 0, totalCR = 0;
  for (const [sr, s] of Object.entries(stats)) {
    console.log(`  ${sr.padEnd(12)} ${s.count.toString().padStart(5)} msgs  in=${s.input.toLocaleString().padStart(10)} out=${s.output.toLocaleString().padStart(10)} cW=${s.cacheW.toLocaleString().padStart(12)} cR=${s.cacheR.toLocaleString().padStart(14)}`);
    totalIn += s.input;
    totalOut += s.output;
    totalCW += s.cacheW;
    totalCR += s.cacheR;
  }
  console.log(`\n  TOTAL      ${byId.size.toString().padStart(5)} msgs  in=${totalIn.toLocaleString().padStart(10)} out=${totalOut.toLocaleString().padStart(10)} cW=${totalCW.toLocaleString().padStart(12)} cR=${totalCR.toLocaleString().padStart(14)}`);
  console.log('\nccusage ref:                     in=   305,260 out= 1,716,013 cW=  40,893,282 cR=   813,060,000');

  // Only end_turn + tool_use (no "none")
  const endTurnOut = (stats['end_turn']?.output || 0);
  const toolUseOut = (stats['tool_use']?.output || 0);
  console.log('\nend_turn output only:', endTurnOut.toLocaleString());
  console.log('tool_use output only:', toolUseOut.toLocaleString());
  console.log('end_turn + tool_use:', (endTurnOut + toolUseOut).toLocaleString());
}

main();
