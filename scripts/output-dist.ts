import { parseClaudeCode } from '../src/data/providers/claude-code.js';

async function main() {
  const records = await parseClaudeCode();
  // Distribution of output tokens
  const ranges = [0, 100, 500, 1000, 5000, 10000, 50000, 100000, Infinity];
  const counts: number[] = new Array(ranges.length - 1).fill(0);
  const sums: number[] = new Array(ranges.length - 1).fill(0);

  for (const r of records) {
    for (let i = 0; i < ranges.length - 1; i++) {
      if (r.outputTokens >= ranges[i] && r.outputTokens < ranges[i+1]) {
        counts[i]++;
        sums[i] += r.outputTokens;
        break;
      }
    }
  }

  console.log('Output token distribution:');
  for (let i = 0; i < ranges.length - 1; i++) {
    const label = ranges[i+1] === Infinity ? `${ranges[i]}+` : `${ranges[i]}-${ranges[i+1]}`;
    console.log(`  ${label.padEnd(12)} ${counts[i].toString().padStart(6)} records, ${sums[i].toLocaleString().padStart(15)} total output`);
  }

  // High output records — these are suspicious
  const high = records.filter(r => r.outputTokens > 10000).sort((a, b) => b.outputTokens - a.outputTokens);
  console.log('\nTop 5 output records:');
  for (const r of high.slice(0, 5)) {
    console.log(`  out=${r.outputTokens} in=${r.inputTokens} cW=${r.cacheWriteTokens} cR=${r.cacheReadTokens} model=${r.modelDisplay} session=${r.sessionId.slice(0,8)}`);
  }
}

main();
