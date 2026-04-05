import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { homedir } from 'os';
import { join } from 'path';
import { glob } from 'glob';
import { existsSync } from 'fs';
import type { UnifiedUsageEntry, ProviderInfo } from './index.js';
import { loadLiteLLMPricing, calculateCostWithLiteLLM } from '../litellm-pricing.js';
import { calculateCost, normalizeModelDisplay } from '../pricing.js';

function getCodexSessionsDir(): string[] {
  const dirs: string[] = [];

  const envDir = process.env.CODEX_HOME;
  if (envDir) {
    const sessionsPath = join(envDir, 'sessions');
    if (existsSync(sessionsPath)) dirs.push(sessionsPath);
  }

  const defaultPath = join(homedir(), '.codex', 'sessions');
  if (existsSync(defaultPath)) dirs.push(defaultPath);

  return [...new Set(dirs)];
}

async function findCodexFiles(): Promise<string[]> {
  const dirs = getCodexSessionsDir();
  const files: string[] = [];

  for (const dir of dirs) {
    const found = await glob('**/*.jsonl', { cwd: dir, absolute: true });
    files.push(...found);
  }

  return [...new Set(files)];
}

async function parseCodexFile(filePath: string, litellm: Map<string, any>): Promise<UnifiedUsageEntry[]> {
  const records: UnifiedUsageEntry[] = [];
  const sessionId = filePath.split('/').pop()?.replace('.jsonl', '') || 'unknown';

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let cwd = '';
  let detectedModel = 'gpt-5.3-codex';

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);

      if (raw.type === 'session_meta' && raw.payload) {
        cwd = raw.payload.cwd || cwd;
      }

      // Detect model from any event that has it
      const eventModel = raw.payload?.model || raw.model;
      if (eventModel && typeof eventModel === 'string' && eventModel.startsWith('gpt')) {
        detectedModel = eventModel;
      }

      if (raw.type === 'event_msg' && raw.payload?.type === 'token_count' && raw.payload.info?.last_token_usage) {
        const last = raw.payload.info.last_token_usage;
        const totalInput = last.input_tokens || 0;
        const cachedInput = last.cached_input_tokens || 0;
        const outputTokens = last.output_tokens || 0;

        // Fresh input = total prompt - cached portion
        const freshInput = Math.max(totalInput - cachedInput, 0);

        if (freshInput + outputTokens + cachedInput === 0) continue;

        const model = detectedModel;

        // Cost: use LiteLLM if available, else hardcoded
        let costUSD: number;
        if (litellm.size > 0) {
          costUSD = calculateCostWithLiteLLM(model, freshInput, outputTokens, 0, cachedInput, litellm);
        } else {
          costUSD = calculateCost(model, freshInput, outputTokens, 0, cachedInput);
        }

        const projectName = cwd ? cwd.split('/').pop() || 'codex' : 'codex';

        records.push({
          id: `cx-${sessionId}-${records.length}`,
          provider: 'codex',
          timestamp: new Date(raw.timestamp || Date.now()),
          model,
          modelDisplay: normalizeModelDisplay(model),
          project: projectName,
          sessionId,
          inputTokens: freshInput,
          outputTokens,
          cacheWriteTokens: 0,
          cacheReadTokens: cachedInput,
          totalTokens: freshInput + outputTokens + cachedInput,
          costUSD,
          isEstimated: false,
          speed: 'standard',
          messageId: `cx-${sessionId}-${records.length}`,
        });
      }
    } catch {
      // Skip malformed lines
    }
  }

  return records;
}

export async function parseCodex(): Promise<UnifiedUsageEntry[]> {
  const files = await findCodexFiles();
  const litellm = await loadLiteLLMPricing();

  const allRecords: UnifiedUsageEntry[] = [];
  const results = await Promise.all(files.map(f => parseCodexFile(f, litellm)));

  for (const records of results) {
    allRecords.push(...records);
  }

  allRecords.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return allRecords;
}

export async function detectCodex(): Promise<ProviderInfo> {
  const dirs = getCodexSessionsDir();
  let count = 0;

  for (const dir of dirs) {
    const found = await glob('**/*.jsonl', { cwd: dir, absolute: true });
    count += found.length;
  }

  return {
    id: 'codex',
    name: 'Codex',
    color: '#10a37f',
    dataPath: dirs,
    entryCount: count,
    isAvailable: count > 0,
  };
}
