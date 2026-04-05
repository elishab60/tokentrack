import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { homedir } from 'os';
import { join } from 'path';
import { glob } from 'glob';
import { existsSync } from 'fs';
import type { UnifiedUsageEntry, ProviderInfo } from './index.js';
import { calculateCost, normalizeModelDisplay } from '../pricing.js';
import { loadLiteLLMPricing, calculateCostWithLiteLLM } from '../litellm-pricing.js';

function getDataDirectories(): string[] {
  const dirs: string[] = [];

  const envDir = process.env.CLAUDE_CONFIG_DIR;
  if (envDir) {
    for (const d of envDir.split(',')) {
      const p = join(d.trim(), 'projects');
      if (existsSync(p)) dirs.push(p);
    }
  }

  const xdg = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  const xdgPath = join(xdg, 'claude', 'projects');
  if (existsSync(xdgPath)) dirs.push(xdgPath);

  const dotClaude = join(homedir(), '.claude', 'projects');
  if (existsSync(dotClaude)) dirs.push(dotClaude);

  return [...new Set(dirs)];
}

async function findJsonlFiles(): Promise<string[]> {
  const dirs = getDataDirectories();
  const files: string[] = [];

  for (const dir of dirs) {
    const found = await glob('**/*.jsonl', {
      cwd: dir,
      absolute: true,
      ignore: ['**/skill-injections.jsonl'],
    });
    files.push(...found);
  }

  return [...new Set(files)];
}

function extractProjectName(filePath: string): string {
  const projectsIdx = filePath.indexOf('/projects/');
  if (projectsIdx === -1) return 'unknown';

  const afterProjects = filePath.substring(projectsIdx + '/projects/'.length);
  const projectDir = afterProjects.split('/')[0];

  const segments = projectDir.split('-').filter(Boolean);
  return segments[segments.length - 1] || projectDir;
}

async function parseFile(filePath: string, project: string, litellm?: Map<string, any>): Promise<UnifiedUsageEntry[]> {
  const records: UnifiedUsageEntry[] = [];

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line);
      if (raw.type !== 'assistant') continue;
      if (!raw.message?.usage) continue;

      const usage = raw.message.usage;
      const inputTokens = usage.input_tokens || 0;
      const outputTokens = usage.output_tokens || 0;
      const cacheWriteTokens = usage.cache_creation_input_tokens || 0;
      const cacheReadTokens = usage.cache_read_input_tokens || 0;

      if (inputTokens + outputTokens === 0) continue;

      const model = raw.message.model || 'unknown';
      const speed = usage.speed || 'standard';
      // Use costUSD from JSONL when available, otherwise calculate
      let costUSD: number;
      if (raw.costUSD != null) {
        costUSD = raw.costUSD;
      } else if (litellm && litellm.size > 0) {
        costUSD = calculateCostWithLiteLLM(model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, litellm);
      } else {
        costUSD = calculateCost(model, inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, speed);
      }

      records.push({
        id: `cc-${raw.uuid || raw.message.id || ''}`,
        provider: 'claude-code',
        timestamp: new Date(raw.timestamp),
        model,
        modelDisplay: normalizeModelDisplay(model),
        project,
        sessionId: raw.sessionId || 'unknown',
        inputTokens,
        outputTokens,
        cacheWriteTokens,
        cacheReadTokens,
        totalTokens: inputTokens + outputTokens + cacheWriteTokens + cacheReadTokens,
        costUSD,
        isEstimated: false,
        speed,
        messageId: raw.message.id || raw.uuid || '',
      });
    } catch {
      // Skip malformed lines
    }
  }

  return records;
}

export async function parseClaudeCode(): Promise<UnifiedUsageEntry[]> {
  const files = await findJsonlFiles();
  const litellm = await loadLiteLLMPricing();

  const fileEntries = files.map(f => ({
    path: f,
    project: extractProjectName(f),
  }));

  const results = await Promise.all(
    fileEntries.map(f => parseFile(f.path, f.project, litellm))
  );

  // Dedup by message.id — keep the LAST entry (most complete due to streaming updates)
  const byMessageId = new Map<string, UnifiedUsageEntry>();

  for (const records of results) {
    for (const r of records) {
      const key = r.messageId || `${r.timestamp.getTime()}-${r.sessionId}-${r.model}`;
      const existing = byMessageId.get(key);
      // Keep the entry with the LOWEST output tokens (first non-zero = actual usage for this turn,
      // not cumulative across agentic iterations). This matches ccusage behavior.
      if (!existing || (r.outputTokens > 0 && r.outputTokens < existing.outputTokens)) {
        byMessageId.set(key, r);
      }
    }
  }

  const allRecords = Array.from(byMessageId.values());
  allRecords.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return allRecords;
}

export async function detectClaudeCode(): Promise<ProviderInfo> {
  const dirs = getDataDirectories();
  let count = 0;

  for (const dir of dirs) {
    const found = await glob('**/*.jsonl', {
      cwd: dir,
      absolute: true,
      ignore: ['**/skill-injections.jsonl'],
    });
    count += found.length;
  }

  return {
    id: 'claude-code',
    name: 'Claude Code',
    color: '#d97757',
    dataPath: dirs,
    entryCount: count,
    isAvailable: count > 0,
  };
}
