export interface ModelPricing {
  input: number;       // per 1M tokens
  output: number;      // per 1M tokens
  cacheWrite?: number;
  cacheRead?: number;
  cachedInput?: number;
  provider: 'anthropic' | 'openai' | 'google';
}

const PRICING_TABLE: Record<string, ModelPricing> = {
  // Anthropic — current gen (keys use both . and - for matching)
  'claude-opus-4-6': { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.50, provider: 'anthropic' },
  'claude-opus-4.6': { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.50, provider: 'anthropic' },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-sonnet-4.6': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-opus-4-5': { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.50, provider: 'anthropic' },
  'claude-opus-4.5': { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.50, provider: 'anthropic' },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-sonnet-4.5': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-haiku-4-5': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.10, provider: 'anthropic' },
  'claude-haiku-4.5': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.10, provider: 'anthropic' },
  // Legacy gen
  'claude-opus-4-1': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.50, provider: 'anthropic' },
  'claude-opus-4.1': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.50, provider: 'anthropic' },
  'claude-opus-4': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.50, provider: 'anthropic' },
  'claude-sonnet-4': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-sonnet-3-5': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-sonnet-3.5': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30, provider: 'anthropic' },
  'claude-haiku-3-5': { input: 0.80, output: 4, cacheWrite: 1.00, cacheRead: 0.08, provider: 'anthropic' },
  'claude-haiku-3.5': { input: 0.80, output: 4, cacheWrite: 1.00, cacheRead: 0.08, provider: 'anthropic' },
  'claude-haiku-3': { input: 0.25, output: 1.25, cacheWrite: 0.30, cacheRead: 0.025, provider: 'anthropic' },

  // OpenAI
  'gpt-5.4': { input: 2.50, output: 15, cachedInput: 1.25, provider: 'openai' },
  'gpt-5.4-mini': { input: 0.40, output: 1.60, cachedInput: 0.10, provider: 'openai' },
  'gpt-5.4-nano': { input: 0.10, output: 0.40, cachedInput: 0.025, provider: 'openai' },
  'gpt-5.4-pro': { input: 30, output: 180, cachedInput: 15, provider: 'openai' },
  'gpt-5.3-codex': { input: 1.25, output: 10, cachedInput: 0.625, provider: 'openai' },
  'gpt-5.3': { input: 1.75, output: 14, cachedInput: 0.875, provider: 'openai' },
  'gpt-5.2-codex': { input: 1.25, output: 10, cachedInput: 0.625, provider: 'openai' },
  'gpt-5.1-codex-max': { input: 1.25, output: 10, cachedInput: 0.625, provider: 'openai' },
  'gpt-5-codex': { input: 1.25, output: 10, cachedInput: 0.625, provider: 'openai' },
  'gpt-4.1': { input: 2, output: 8, cachedInput: 0.50, provider: 'openai' },
  'gpt-4.1-mini': { input: 0.40, output: 1.60, cachedInput: 0.10, provider: 'openai' },
  'gpt-4.1-nano': { input: 0.10, output: 0.40, cachedInput: 0.025, provider: 'openai' },
  'gpt-4o': { input: 2.50, output: 10, cachedInput: 1.25, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.60, cachedInput: 0.075, provider: 'openai' },
  'o3': { input: 10, output: 40, cachedInput: 2.50, provider: 'openai' },
  'o3-mini': { input: 1.10, output: 4.40, cachedInput: 0.275, provider: 'openai' },
  'o4-mini': { input: 1.10, output: 4.40, cachedInput: 0.275, provider: 'openai' },

  // Google
  'gemini-3-pro': { input: 1.25, output: 10, provider: 'google' },
  'gemini-2.5-pro': { input: 1.25, output: 10, provider: 'google' },
  'gemini-2.5-flash': { input: 0.15, output: 0.60, provider: 'google' },
  'gemini-2.0-flash': { input: 0.10, output: 0.40, provider: 'google' },
};

// Fallback pricing per provider
const FALLBACKS: Record<string, string> = {
  anthropic: 'claude-sonnet-4.6',
  openai: 'gpt-5.3-codex',
  google: 'gemini-3-pro',
};

function detectProvider(model: string): 'anthropic' | 'openai' | 'google' {
  const lower = model.toLowerCase();
  if (lower.includes('claude') || lower.includes('sonnet') || lower.includes('opus') || lower.includes('haiku')) return 'anthropic';
  if (lower.includes('gpt') || lower.includes('o3') || lower.includes('o4') || lower.includes('codex')) return 'openai';
  if (lower.includes('gemini')) return 'google';
  return 'anthropic'; // default
}

// Normalize model name to match pricing table keys
function normalizeToPricingKey(model: string): string {
  let name = model.toLowerCase().trim();

  // Remove provider prefixes
  name = name.replace(/^anthropic[./]/, '');
  name = name.replace(/^\[.*?\]\s*/, '');

  // Remove date suffixes like -20250514
  name = name.replace(/-\d{8}$/, '');

  // Remove trailing version hashes
  name = name.replace(/-[a-f0-9]{6,}$/, '');

  return name;
}

export function findPricing(modelName: string): ModelPricing {
  const key = normalizeToPricingKey(modelName);

  // Exact match
  if (PRICING_TABLE[key]) return PRICING_TABLE[key];

  // Try prefix match (longest first)
  const keys = Object.keys(PRICING_TABLE).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (key.startsWith(k) || key.includes(k)) return PRICING_TABLE[k];
  }

  // Fallback by provider
  const provider = detectProvider(modelName);
  return PRICING_TABLE[FALLBACKS[provider]];
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number,
  cacheReadTokens: number,
  speed?: string,
): number {
  const pricing = findPricing(model);

  // Fast mode multiplier (Opus 4.6 only)
  let multiplier = 1;
  if (speed === 'fast' && model.toLowerCase().includes('opus-4.6')) {
    multiplier = 6;
  }

  let cost = 0;
  cost += (inputTokens * pricing.input * multiplier) / 1_000_000;
  cost += (outputTokens * pricing.output * multiplier) / 1_000_000;

  if (pricing.cacheWrite) {
    cost += (cacheWriteTokens * pricing.cacheWrite * multiplier) / 1_000_000;
  }
  if (pricing.cacheRead) {
    cost += (cacheReadTokens * pricing.cacheRead * multiplier) / 1_000_000;
  }
  // For OpenAI cached input (uses cachedInput field, stored in cacheReadTokens)
  if (pricing.cachedInput && !pricing.cacheRead) {
    cost += (cacheReadTokens * pricing.cachedInput * multiplier) / 1_000_000;
  }

  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function normalizeModelDisplay(raw: string): string {
  if (!raw) return 'unknown';

  let name = raw;
  let prefix = '';
  const prefixMatch = name.match(/^(\[.*?\]\s*)/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    name = name.slice(prefix.length);
  }

  name = name.replace(/^anthropic[./]/, '');
  name = name.replace(/^claude-/, '');
  name = name.replace(/-\d{8}$/, '');

  return prefix + name;
}

export function getProviderForModel(model: string): 'anthropic' | 'openai' | 'google' {
  return detectProvider(model);
}

export function getPricingTable(): Record<string, ModelPricing> {
  return { ...PRICING_TABLE };
}
