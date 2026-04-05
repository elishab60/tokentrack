import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { glob } from 'glob';

async function main() {
  const files = await glob('/Users/elishabajemon/.claude/projects/**/*.jsonl', { ignore: ['**/subagents/**', '**/skill-injections.jsonl'] });
  let total = 0, assistant = 0, withUsage = 0, zeroOutput = 0;
  const msgIds = new Map<string, number>();

  for (const f of files) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    for await (const line of rl) {
      total++;
      try {
        const raw = JSON.parse(line);
        if (raw.type !== 'assistant') continue;
        assistant++;
        if (!raw.message?.usage) continue;
        const u = raw.message.usage;
        if ((u.input_tokens || 0) + (u.output_tokens || 0) === 0) { zeroOutput++; continue; }
        withUsage++;
        const id = raw.message.id || '';
        if (id) msgIds.set(id, (msgIds.get(id) || 0) + 1);
      } catch {}
    }
  }

  console.log('All files:', files.length);
  console.log('Total lines:', total);
  console.log('Assistant msgs:', assistant);
  console.log('With usage (non-zero):', withUsage);
  console.log('Zero token entries skipped:', zeroOutput);
  console.log('Unique message IDs:', msgIds.size);

  let dupes = 0, dupeRecords = 0;
  for (const [, count] of msgIds) { if (count > 1) { dupes++; dupeRecords += count - 1; } }
  console.log('Duplicated IDs:', dupes, '(extra records:', dupeRecords, ')');

  // Show sample dupes
  let shown = 0;
  for (const [id, count] of msgIds) {
    if (count > 1 && shown < 3) { console.log('  DUP:', id, 'x', count); shown++; }
  }
}

main();
