import { parseClaudeCode } from '../src/data/providers/claude-code.js';

async function main() {
  const records = await parseClaudeCode();
  // After dedup, how many records share IDs?
  const byId = new Map<string, number>();
  for (const r of records) {
    byId.set(r.messageId, (byId.get(r.messageId) || 0) + 1);
  }
  let dupeIds = 0;
  for (const [, count] of byId) { if (count > 1) dupeIds++; }
  console.log('Records after dedup:', records.length);
  console.log('Unique messageIds:', byId.size);
  console.log('Still duplicate IDs:', dupeIds);

  // Show sample duplicate
  for (const [id, count] of byId) {
    if (count > 1) {
      const recs = records.filter(r => r.messageId === id);
      console.log(`\nDupe: ${id} x${count}`);
      for (const r of recs) {
        console.log(`  ${r.sessionId.slice(0,8)} out=${r.outputTokens} cW=${r.cacheWriteTokens} cR=${r.cacheReadTokens}`);
      }
      break;
    }
  }

  // Check empty messageIds
  const noId = records.filter(r => !r.messageId || r.messageId === '');
  console.log('\nRecords with empty messageId:', noId.length);
  if (noId.length > 0) {
    console.log('  These use fallback key and may cause false-no-dedup');
  }
}

main();
