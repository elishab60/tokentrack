import type { UnifiedUsageEntry, Provider } from './providers/index.js';
import { loadAllRecords, detectProviders } from './providers/registry.js';
import type { ProviderInfo } from './providers/index.js';

let cachedRecords: UnifiedUsageEntry[] | null = null;
let cachedProviderInfo: ProviderInfo[] | null = null;

export async function getRecords(forceRefresh = false): Promise<UnifiedUsageEntry[]> {
  if (!forceRefresh && cachedRecords) {
    return cachedRecords;
  }

  cachedRecords = await loadAllRecords();
  return cachedRecords;
}

export async function getProviderInfo(): Promise<ProviderInfo[]> {
  if (cachedProviderInfo) return cachedProviderInfo;
  cachedProviderInfo = await detectProviders();
  return cachedProviderInfo;
}

export function invalidateCache(): void {
  cachedRecords = null;
  cacheTime = 0;
  cachedProviderInfo = null;
}
