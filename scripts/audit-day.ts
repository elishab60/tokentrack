import { parseClaudeCode } from '../src/data/providers/claude-code.js';

async function main() {
  const records = await parseClaudeCode();
  // Filter to a single day
  const day = '2026-04-04';
  const dayRecords = records.filter(r => {
    const d = r.timestamp.toISOString().slice(0, 10);
    return d === day;
  });

  let input = 0, output = 0, cacheW = 0, cacheR = 0;
  for (const r of dayRecords) {
    input += r.inputTokens;
    output += r.outputTokens;
    cacheW += r.cacheWriteTokens;
    cacheR += r.cacheReadTokens;
  }

  console.log(`=== ${day} ===`);
  console.log('  records:', dayRecords.length);
  console.log('  input:', input.toLocaleString());
  console.log('  output:', output.toLocaleString());
  console.log('  cache_write:', cacheW.toLocaleString());
  console.log('  cache_read:', cacheR.toLocaleString());

  console.log('\nccusage 04-04: input=9,257 output=146,144 cache_create=5,665,082 cache_read=97,285,xxx total=$80.92');

  // Show all unique message IDs for this day
  const ids = new Map<string, number>();
  for (const r of dayRecords) {
    ids.set(r.messageId, (ids.get(r.messageId) || 0) + 1);
  }
  let dupes = 0;
  for (const [, count] of ids) { if (count > 1) dupes++; }
  console.log('  unique msg IDs:', ids.size, 'dupes:', dupes);

  // Show first 5 records
  console.log('\nSample records:');
  for (const r of dayRecords.slice(0, 5)) {
    console.log(`  ${r.timestamp.toISOString().slice(11,19)} ${r.modelDisplay} in=${r.inputTokens} out=${r.outputTokens} cW=${r.cacheWriteTokens} cR=${r.cacheReadTokens}`);
  }
}

main();
