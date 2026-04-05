import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
const CACHE_DIR = join(homedir(), '.tokentrack');
const CACHE_PATH = join(CACHE_DIR, 'litellm-pricing.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface LiteLLMModelPricing {
  input_cost_per_token: number;
  output_cost_per_token: number;
  cache_read_input_token_cost?: number;
  cache_creation_input_token_cost?: number;
}

let cachedPricing: Map<string, LiteLLMModelPricing> | null = null;

function isCacheFresh(): boolean {
  try {
    if (!existsSync(CACHE_PATH)) return false;
    const stat = statSync(CACHE_PATH);
    return Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS;
  } catch { return false; }
}

function readCache(): Map<string, LiteLLMModelPricing> | null {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const data = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    return parseRawPricing(data);
  } catch { return null; }
}

function writeCache(data: any): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(data), 'utf-8');
  } catch {}
}

function parseRawPricing(data: Record<string, any>): Map<string, LiteLLMModelPricing> {
  const map = new Map<string, LiteLLMModelPricing>();
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && typeof val.input_cost_per_token === 'number') {
      map.set(key, {
        input_cost_per_token: val.input_cost_per_token,
        output_cost_per_token: val.output_cost_per_token || 0,
        cache_read_input_token_cost: val.cache_read_input_token_cost,
        cache_creation_input_token_cost: val.cache_creation_input_token_cost,
      });
    }
  }
  return map;
}

export async function loadLiteLLMPricing(): Promise<Map<string, LiteLLMModelPricing>> {
  if (cachedPricing) return cachedPricing;

  // Try fresh cache first
  if (isCacheFresh()) {
    const cached = readCache();
    if (cached) { cachedPricing = cached; return cached; }
  }

  // Fetch from network
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(LITELLM_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      writeCache(data);
      cachedPricing = parseRawPricing(data as Record<string, any>);
      return cachedPricing;
    }
  } catch {}

  // Fall back to stale cache
  const stale = readCache();
  if (stale) { cachedPricing = stale; return stale; }

  // No cache at all — return empty (caller will use hardcoded fallback)
  cachedPricing = new Map();
  return cachedPricing;
}

export function findLiteLLMPricing(model: string, pricing: Map<string, LiteLLMModelPricing>): LiteLLMModelPricing | null {
  // Exact match
  if (pricing.has(model)) return pricing.get(model)!;

  // Strip date suffix
  const stripped = model.replace(/-\d{8}$/, '');
  if (pricing.has(stripped)) return pricing.get(stripped)!;

  // Try with claude- prefix
  if (!stripped.startsWith('claude-') && (stripped.includes('sonnet') || stripped.includes('opus') || stripped.includes('haiku'))) {
    const withPrefix = 'claude-' + stripped;
    if (pricing.has(withPrefix)) return pricing.get(withPrefix)!;
  }

  // Try common aliases
  const aliases: Record<string, string> = {
    'claude-opus-4-6': 'claude-opus-4-6-20260227',
    'claude-sonnet-4-6': 'claude-sonnet-4-6-20260220',
    'claude-haiku-4-5': 'claude-haiku-4-5-20251001',
  };
  for (const [alias, full] of Object.entries(aliases)) {
    if (stripped === alias && pricing.has(full)) return pricing.get(full)!;
  }

  // Partial match — try finding key that starts with our model name
  for (const [key, val] of pricing) {
    if (key.startsWith(stripped) || stripped.startsWith(key)) return val;
  }

  return null;
}

export function calculateCostWithLiteLLM(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number,
  cacheReadTokens: number,
  pricing: Map<string, LiteLLMModelPricing>,
): number {
  const p = findLiteLLMPricing(model, pricing);
  if (!p) return 0;

  let cost = inputTokens * p.input_cost_per_token +
    outputTokens * p.output_cost_per_token;

  if (cacheWriteTokens > 0 && p.cache_creation_input_token_cost) {
    cost += cacheWriteTokens * p.cache_creation_input_token_cost;
  }
  if (cacheReadTokens > 0) {
    const readRate = p.cache_read_input_token_cost ?? (p.input_cost_per_token * 0.5);
    cost += cacheReadTokens * readRate;
  }

  return Math.round(cost * 1_000_000) / 1_000_000;
}

export async function updatePricingCache(): Promise<number> {
  try {
    const res = await fetch(LITELLM_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    writeCache(data);
    const parsed = parseRawPricing(data as Record<string, any>);
    cachedPricing = parsed;
    return parsed.size;
  } catch (e: any) {
    throw new Error(`Failed to update: ${e.message}`);
  }
}
