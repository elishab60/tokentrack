import { homedir, platform } from 'os';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import type { UnifiedUsageEntry, ProviderInfo } from './index.js';
import { calculateCost, normalizeModelDisplay } from '../pricing.js';

function getAntigravityDir(): string[] {
  const dirs: string[] = [];

  if (platform() === 'darwin') {
    const macPath = join(homedir(), 'Library', 'Application Support', 'Antigravity');
    if (existsSync(macPath)) dirs.push(macPath);
  }

  const linuxPath = join(homedir(), '.config', 'Antigravity');
  if (existsSync(linuxPath)) dirs.push(linuxPath);

  return [...new Set(dirs)];
}

export async function parseAntigravity(): Promise<UnifiedUsageEntry[]> {
  const dirs = getAntigravityDir();
  const records: UnifiedUsageEntry[] = [];

  for (const dir of dirs) {
    // Try to find memory/conversation JSON files
    const memoryFiles = await glob('**/memory/**/*.json', { cwd: dir, absolute: true });
    const logFiles = await glob('**/logs/**/*.json', { cwd: dir, absolute: true });
    const allFiles = [...memoryFiles, ...logFiles];

    for (const file of allFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const data = JSON.parse(content);

        // Estimate tokens from conversation content
        if (data.messages && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (!msg.content) continue;
            const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            const estimatedTokens = Math.ceil(text.length / 4);

            const isAssistant = msg.role === 'assistant';
            const model = data.model || 'gemini-3-pro';
            const inputTokens = isAssistant ? 0 : estimatedTokens;
            const outputTokens = isAssistant ? estimatedTokens : 0;

            records.push({
              id: `ag-${file.split('/').pop()}-${records.length}`,
              provider: 'antigravity',
              timestamp: new Date(msg.timestamp || data.timestamp || Date.now()),
              model,
              modelDisplay: normalizeModelDisplay(model),
              project: data.workspace || data.project || 'antigravity',
              sessionId: data.sessionId || file.split('/').pop()?.replace('.json', '') || 'unknown',
              inputTokens,
              outputTokens,
              cacheWriteTokens: 0,
              cacheReadTokens: 0,
              totalTokens: estimatedTokens,
              costUSD: calculateCost(model, inputTokens, outputTokens, 0, 0),
              isEstimated: true,
              speed: 'standard',
              messageId: `ag-${records.length}`,
            });
          }
        }
      } catch {
        // Skip unparseable files
      }
    }
  }

  records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return records;
}

export async function detectAntigravity(): Promise<ProviderInfo> {
  const dirs = getAntigravityDir();
  let hasData = false;

  for (const dir of dirs) {
    const files = await glob('**/*.json', { cwd: dir, absolute: true });
    if (files.length > 0) { hasData = true; break; }
  }

  return {
    id: 'antigravity',
    name: 'Antigravity',
    color: '#4285f4',
    dataPath: dirs,
    entryCount: 0, // estimated
    isAvailable: hasData,
  };
}
