import { format, startOfWeek, startOfMonth } from 'date-fns';
import type { UnifiedUsageEntry, Provider } from './providers/index.js';
import { normalizeModelDisplay } from './pricing.js';

export interface Filters {
  from?: Date;
  to?: Date;
  project?: string;
  model?: string;
  provider?: Provider;
}

export function applyFilters(records: UnifiedUsageEntry[], filters: Filters): UnifiedUsageEntry[] {
  return records.filter(r => {
    if (filters.from && r.timestamp < filters.from) return false;
    if (filters.to && r.timestamp > filters.to) return false;
    if (filters.project && r.project !== filters.project) return false;
    if (filters.model && normalizeModelDisplay(r.model) !== filters.model) return false;
    if (filters.provider && r.provider !== filters.provider) return false;
    return true;
  });
}

export interface TimeBucket {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  models: string[];
  providers: Provider[];
}

function bucketKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
  if (granularity === 'day') return format(date, 'yyyy-MM-dd');
  if (granularity === 'week') return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return format(startOfMonth(date), 'yyyy-MM');
}

export function aggregateByTime(
  records: UnifiedUsageEntry[],
  granularity: 'day' | 'week' | 'month',
): TimeBucket[] {
  const buckets = new Map<string, TimeBucket>();

  for (const r of records) {
    const key = bucketKey(r.timestamp, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { date: key, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalCost: 0, models: [], providers: [] };
      buckets.set(key, bucket);
    }
    bucket.inputTokens += r.inputTokens;
    bucket.outputTokens += r.outputTokens;
    bucket.cacheCreationTokens += r.cacheWriteTokens;
    bucket.cacheReadTokens += r.cacheReadTokens;
    bucket.totalCost += r.costUSD;
    const mn = normalizeModelDisplay(r.model);
    if (!bucket.models.includes(mn)) bucket.models.push(mn);
    if (!bucket.providers.includes(r.provider)) bucket.providers.push(r.provider);
  }

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export interface ProjectSummary {
  project: string;
  sessions: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalCost: number;
  lastActivity: string;
  models: string[];
  providers: Provider[];
}

export function aggregateByProject(records: UnifiedUsageEntry[]): ProjectSummary[] {
  const map = new Map<string, { sessions: Set<string>; input: number; output: number; cache: number; cost: number; lastActivity: Date; models: Set<string>; providers: Set<Provider> }>();

  for (const r of records) {
    let p = map.get(r.project);
    if (!p) {
      p = { sessions: new Set(), input: 0, output: 0, cache: 0, cost: 0, lastActivity: r.timestamp, models: new Set(), providers: new Set() };
      map.set(r.project, p);
    }
    p.sessions.add(r.sessionId);
    p.input += r.inputTokens;
    p.output += r.outputTokens;
    p.cache += r.cacheWriteTokens + r.cacheReadTokens;
    p.cost += r.costUSD;
    if (r.timestamp > p.lastActivity) p.lastActivity = r.timestamp;
    p.models.add(normalizeModelDisplay(r.model));
    p.providers.add(r.provider);
  }

  return Array.from(map.entries())
    .map(([project, p]) => ({
      project,
      sessions: p.sessions.size,
      inputTokens: p.input,
      outputTokens: p.output,
      cacheTokens: p.cache,
      totalCost: p.cost,
      lastActivity: format(p.lastActivity, 'yyyy-MM-dd'),
      models: Array.from(p.models),
      providers: Array.from(p.providers),
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export interface ModelSummary {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalCost: number;
  sessions: number;
  provider: string;
}

export function aggregateByModel(records: UnifiedUsageEntry[]): ModelSummary[] {
  const map = new Map<string, { input: number; output: number; cache: number; cost: number; sessions: Set<string>; provider: Provider }>();

  for (const r of records) {
    const mn = normalizeModelDisplay(r.model);
    let m = map.get(mn);
    if (!m) {
      m = { input: 0, output: 0, cache: 0, cost: 0, sessions: new Set(), provider: r.provider };
      map.set(mn, m);
    }
    m.input += r.inputTokens;
    m.output += r.outputTokens;
    m.cache += r.cacheWriteTokens + r.cacheReadTokens;
    m.cost += r.costUSD;
    m.sessions.add(r.sessionId);
  }

  return Array.from(map.entries())
    .map(([model, m]) => ({
      model,
      inputTokens: m.input,
      outputTokens: m.output,
      cacheTokens: m.cache,
      totalCost: m.cost,
      sessions: m.sessions.size,
      provider: m.provider,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export interface ProviderSummary {
  provider: Provider;
  name: string;
  color: string;
  records: number;
  sessions: number;
  projects: number;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalCost: number;
}

const PROVIDER_META: Record<Provider, { name: string; color: string }> = {
  'claude-code': { name: 'Claude Code', color: '#d97757' },
  'codex': { name: 'Codex', color: '#10a37f' },
  'antigravity': { name: 'Antigravity', color: '#4285f4' },
};

export function aggregateByProvider(records: UnifiedUsageEntry[]): ProviderSummary[] {
  const map = new Map<Provider, { records: number; sessions: Set<string>; projects: Set<string>; input: number; output: number; cache: number; cost: number }>();

  for (const r of records) {
    let p = map.get(r.provider);
    if (!p) {
      p = { records: 0, sessions: new Set(), projects: new Set(), input: 0, output: 0, cache: 0, cost: 0 };
      map.set(r.provider, p);
    }
    p.records++;
    p.sessions.add(r.sessionId);
    p.projects.add(r.project);
    p.input += r.inputTokens;
    p.output += r.outputTokens;
    p.cache += r.cacheWriteTokens + r.cacheReadTokens;
    p.cost += r.costUSD;
  }

  return Array.from(map.entries())
    .map(([provider, p]) => ({
      provider,
      ...PROVIDER_META[provider],
      records: p.records,
      sessions: p.sessions.size,
      projects: p.projects.size,
      inputTokens: p.input,
      outputTokens: p.output,
      cacheTokens: p.cache,
      totalCost: p.cost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export function getSummary(records: UnifiedUsageEntry[]) {
  const totalInput = records.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutput = records.reduce((s, r) => s + r.outputTokens, 0);
  const totalCache = records.reduce((s, r) => s + r.cacheWriteTokens + r.cacheReadTokens, 0);
  const totalCost = records.reduce((s, r) => s + r.costUSD, 0);
  const sessions = new Set(records.map(r => r.sessionId)).size;
  const projects = new Set(records.map(r => r.project)).size;
  const providers = [...new Set(records.map(r => r.provider))];

  const dates = records.map(r => r.timestamp.getTime());
  const dateRange = dates.length > 0
    ? { from: format(new Date(Math.min(...dates)), 'yyyy-MM-dd'), to: format(new Date(Math.max(...dates)), 'yyyy-MM-dd') }
    : { from: '', to: '' };

  return {
    totalTokens: totalInput + totalOutput + totalCache,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalCacheTokens: totalCache,
    totalCost,
    totalSessions: sessions,
    totalProjects: projects,
    providers,
    dateRange,
  };
}

export interface SessionSummary {
  sessionId: string;
  project: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  messageCount: number;
  provider: Provider;
  isEstimated: boolean;
}

export function aggregateSessions(records: UnifiedUsageEntry[], limit = 50, offset = 0): SessionSummary[] {
  const map = new Map<string, { project: string; timestamp: Date; models: Set<string>; input: number; output: number; cost: number; count: number; provider: Provider; isEstimated: boolean }>();

  for (const r of records) {
    let s = map.get(r.sessionId);
    if (!s) {
      s = { project: r.project, timestamp: r.timestamp, models: new Set(), input: 0, output: 0, cost: 0, count: 0, provider: r.provider, isEstimated: r.isEstimated };
      map.set(r.sessionId, s);
    }
    s.models.add(normalizeModelDisplay(r.model));
    s.input += r.inputTokens;
    s.output += r.outputTokens;
    s.cost += r.costUSD;
    s.count++;
    if (r.timestamp < s.timestamp) s.timestamp = r.timestamp;
  }

  return Array.from(map.entries())
    .map(([sessionId, s]) => ({
      sessionId,
      project: s.project,
      timestamp: format(s.timestamp, "yyyy-MM-dd'T'HH:mm:ss"),
      model: Array.from(s.models).join(', '),
      inputTokens: s.input,
      outputTokens: s.output,
      cost: s.cost,
      messageCount: s.count,
      provider: s.provider,
      isEstimated: s.isEstimated,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(offset, offset + limit);
}
