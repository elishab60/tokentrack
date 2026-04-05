export type Provider = 'claude-code' | 'codex' | 'antigravity';

export interface UnifiedUsageEntry {
  id: string;
  provider: Provider;
  timestamp: Date;
  model: string;
  modelDisplay: string;
  project: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUSD: number;
  isEstimated: boolean;
  speed: string;
  messageId: string;
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  color: string;
  dataPath: string[];
  entryCount: number;
  isAvailable: boolean;
}
