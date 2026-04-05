import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { glob } from 'glob';

async function main() {
  // Check what files ccusage would use vs what we use
  const allFiles = await glob('/Users/elishabajemon/.claude/projects/**/*.jsonl', { absolute: true });
  const ourFiles = allFiles.filter(f => !f.includes('/subagents/') && !f.includes('skill-injections'));

  // Check for worktree files we might be including
  const worktreeFiles = ourFiles.filter(f => f.includes('worktree') || f.includes('.claude-worktrees'));
  console.log('Total JSONL files:', allFiles.length);
  console.log('After subagent filter:', ourFiles.length);
  console.log('Worktree files included:', worktreeFiles.length);
  if (worktreeFiles.length > 0) {
    console.log('  Sample:', worktreeFiles.slice(0, 3).map(f => f.split('/').slice(-2).join('/')));
  }

  // Count entries by stop_reason
  let noStop = 0, withStop = 0, toolUse = 0, endTurn = 0;
  let stopNull = 0;
  const msgIdCounts = new Map<string, number>();

  for (const f of ourFiles.slice(0, 20)) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    for await (const line of rl) {
      try {
        const raw = JSON.parse(line);
        if (raw.type !== 'assistant' || !raw.message?.usage) continue;
        const u = raw.message.usage;
        if ((u.input_tokens || 0) + (u.output_tokens || 0) === 0) continue;

        const sr = raw.message.stop_reason;
        if (!sr) noStop++;
        else if (sr === null) stopNull++;
        else { withStop++; if (sr === 'tool_use') toolUse++; if (sr === 'end_turn') endTurn++; }

        const id = raw.message.id || '';
        if (id) msgIdCounts.set(id, (msgIdCounts.get(id) || 0) + 1);
      } catch {}
    }
  }

  console.log('\n=== Stop reason stats (20 files) ===');
  console.log('  no stop_reason:', noStop);
  console.log('  stop_reason=null:', stopNull);
  console.log('  with stop_reason:', withStop, '(tool_use:', toolUse, 'end_turn:', endTurn, ')');

  // How many dupes remain among stop_reason entries?
  let dupes = 0;
  for (const [, count] of msgIdCounts) { if (count > 1) dupes++; }
  console.log('  Unique IDs:', msgIdCounts.size, 'Still duplicated:', dupes);

  // Check: does ccusage use costUSD field?
  let withCostUSD = 0, withoutCostUSD = 0;
  for (const f of ourFiles.slice(0, 5)) {
    const rl = createInterface({ input: createReadStream(f, 'utf-8') });
    for await (const line of rl) {
      try {
        const raw = JSON.parse(line);
        if (raw.type !== 'assistant' || !raw.message?.usage) continue;
        if (raw.costUSD != null) withCostUSD++;
        else withoutCostUSD++;
      } catch {}
    }
  }
  console.log('\n=== costUSD field (5 files) ===');
  console.log('  with costUSD:', withCostUSD);
  console.log('  without costUSD:', withoutCostUSD);
}

main();
