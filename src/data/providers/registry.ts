import type { UnifiedUsageEntry, Provider, ProviderInfo } from './index.js';
import { parseClaudeCode, detectClaudeCode } from './claude-code.js';
import { parseCodex, detectCodex } from './codex.js';
import { parseAntigravity, detectAntigravity } from './antigravity.js';

export async function detectProviders(): Promise<ProviderInfo[]> {
  const results = await Promise.all([
    detectClaudeCode(),
    detectCodex(),
    detectAntigravity(),
  ]);
  return results;
}

export async function loadAllRecords(providers?: Provider[]): Promise<UnifiedUsageEntry[]> {
  const targets = providers || ['claude-code', 'codex', 'antigravity'];
  const loaders: Promise<UnifiedUsageEntry[]>[] = [];

  if (targets.includes('claude-code')) loaders.push(parseClaudeCode());
  if (targets.includes('codex')) loaders.push(parseCodex());
  if (targets.includes('antigravity')) loaders.push(parseAntigravity());

  const results = await Promise.all(loaders);
  const all = results.flat();

  all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return all;
}
