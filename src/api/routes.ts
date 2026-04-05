import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getRecords, getProviderInfo } from '../data/cache.js';
import { applyFilters, aggregateByTime, aggregateByProject, aggregateByModel, aggregateByProvider, getSummary, aggregateSessions, type Filters } from '../data/aggregator.js';
import { normalizeModelDisplay, getPricingTable } from '../data/pricing.js';
import type { Provider } from '../data/providers/index.js';
import { format } from 'date-fns';

const api = new Hono();

api.use('*', cors());

function parseFilters(query: Record<string, string>): Filters {
  return {
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to + 'T23:59:59') : undefined,
    project: query.project || undefined,
    model: query.model || undefined,
    provider: (query.provider as Provider) || undefined,
  };
}

api.get('/api/providers', async (c) => {
  const info = await getProviderInfo();
  return c.json(info);
});

api.get('/api/pricing', async (c) => {
  return c.json(getPricingTable());
});

api.get('/api/summary', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  const summary = getSummary(filtered);
  const providerBreakdown = aggregateByProvider(filtered);
  return c.json({ ...summary, providerBreakdown });
});

api.get('/api/daily', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByTime(filtered, 'day'));
});

api.get('/api/weekly', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByTime(filtered, 'week'));
});

api.get('/api/monthly', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByTime(filtered, 'month'));
});

api.get('/api/projects', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByProject(filtered));
});

api.get('/api/models', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByModel(filtered));
});

api.get('/api/sessions', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  return c.json(aggregateSessions(filtered, limit, offset));
});

api.get('/api/sessions/:id', async (c) => {
  const id = c.req.param('id');
  const records = await getRecords();
  const sessionRecords = records.filter(r => r.sessionId === id);

  return c.json({
    sessionId: id,
    messages: sessionRecords.map(r => ({
      timestamp: format(r.timestamp, "yyyy-MM-dd'T'HH:mm:ss"),
      model: normalizeModelDisplay(r.model),
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cacheCreationTokens: r.cacheWriteTokens,
      cacheReadTokens: r.cacheReadTokens,
      cost: r.costUSD,
      provider: r.provider,
      isEstimated: r.isEstimated,
    })),
  });
});

api.get('/api/heatmap', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  return c.json(aggregateByTime(filtered, 'day'));
});

api.get('/api/filters', async (c) => {
  const records = await getRecords();
  const projects = [...new Set(records.map(r => r.project))].sort();
  const models = [...new Set(records.map(r => normalizeModelDisplay(r.model)))].sort();
  const providers = [...new Set(records.map(r => r.provider))].sort();
  return c.json({ projects, models, providers });
});

api.get('/api/export', async (c) => {
  const records = await getRecords();
  const filters = parseFilters(c.req.query() as Record<string, string>);
  const filtered = applyFilters(records, filters);
  const fmt = c.req.query('format') || 'json';

  if (fmt === 'csv') {
    const header = 'timestamp,session_id,project,provider,model,input_tokens,output_tokens,cache_write_tokens,cache_read_tokens,cost_usd,is_estimated';
    const rows = filtered.map(r =>
      `${format(r.timestamp, "yyyy-MM-dd'T'HH:mm:ss")},${r.sessionId},${r.project},${r.provider},${normalizeModelDisplay(r.model)},${r.inputTokens},${r.outputTokens},${r.cacheWriteTokens},${r.cacheReadTokens},${r.costUSD.toFixed(6)},${r.isEstimated}`
    );
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', 'attachment; filename="tokentrack-export.csv"');
    return c.body(csv);
  }

  return c.json(filtered.map(r => ({
    timestamp: format(r.timestamp, "yyyy-MM-dd'T'HH:mm:ss"),
    sessionId: r.sessionId,
    project: r.project,
    provider: r.provider,
    model: normalizeModelDisplay(r.model),
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    cacheReadTokens: r.cacheReadTokens,
    costUSD: r.costUSD,
    isEstimated: r.isEstimated,
  })));
});

export { api };
