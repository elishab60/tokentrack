import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { glob } from 'glob';

async function main() {
  const files = await glob('/Users/elishabajemon/.claude/projects/**/*.jsonl', {
    absolute: true,
    ignore: ['**/skill-injections.jsonl'],
  });

  // For each message.id, collect ALL entries to see if output_tokens is cumulative
  const entries = new Map<string, Array<{ output: number; stop: string | null; order: number }>>();
  let order = 0;

  for (const f of files.slice(0, 10)) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    for await (const line of rl) {
      try {
        const raw = JSON.parse(line);
        if (raw.type !== 'assistant' || !raw.message?.usage) continue;
        const u = raw.message.usage;
        const id = raw.message.id || '';
        if (!id) continue;
        const arr = entries.get(id) || [];
        arr.push({ output: u.output_tokens || 0, stop: raw.message.stop_reason, order: order++ });
        entries.set(id, arr);
      } catch {}
    }
  }

  // Find messages with multiple entries and check if output is cumulative
  let checked = 0;
  for (const [id, arr] of entries) {
    if (arr.length >= 3 && arr.some(e => e.stop === 'tool_use')) {
      arr.sort((a, b) => a.order - b.order);
      console.log(`Message ${id} (${arr.length} entries):`);
      for (const e of arr) {
        console.log(`  out=${e.output.toString().padStart(6)} stop=${e.stop || 'null'}`);
      }
      console.log(`  First: ${arr[0].output}, Last: ${arr[arr.length-1].output}`);
      console.log(`  Cumulative? ${arr[arr.length-1].output >= arr[0].output ? 'YES' : 'NO'}`);
      console.log();
      checked++;
      if (checked >= 5) break;
    }
  }
}

main();
