import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTokens, formatCost } from '../lib/formatters';

const MODEL_COLORS: Record<string, string> = {
  'sonnet': '#6a9bcc', 'opus': '#d97757', 'haiku': '#788c5d',
  'gpt': '#10a37f', 'gemini': '#4285f4', 'o3': '#f97316', 'o4': '#f59e0b',
};

function getColor(model: string, idx: number): string {
  for (const [k, c] of Object.entries(MODEL_COLORS)) if (model.toLowerCase().includes(k)) return c;
  return ['#6a9bcc','#d97757','#788c5d','#b0aea5','#10a37f','#4285f4'][idx % 6];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '10px 14px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{d.name}</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>{formatTokens(d.tokens)} tokens · {formatCost(d.cost)}</p>
    </div>
  );
}

export function ModelBreakdown({ data }: { data: any[] }) {
  const [mode, setMode] = useState<'tokens' | 'cost'>('tokens');

  const chartData = data.map(m => ({
    name: m.model,
    tokens: m.inputTokens + m.outputTokens + m.cacheTokens,
    cost: m.totalCost,
    value: mode === 'tokens' ? m.inputTokens + m.outputTokens + m.cacheTokens : m.totalCost,
  }));

  const total = mode === 'tokens'
    ? chartData.reduce((s, d) => s + d.tokens, 0)
    : chartData.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Models</h2>
        <div className="seg-control">
          <button onClick={() => setMode('tokens')} className={`seg-btn ${mode === 'tokens' ? 'active' : ''}`}>Tokens</button>
          <button onClick={() => setMode('cost')} className={`seg-btn ${mode === 'cost' ? 'active' : ''}`}>Cost</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} dataKey="value" animationDuration={800} strokeWidth={0}>
            {chartData.map((entry, idx) => <Cell key={entry.name} fill={getColor(entry.name, idx)} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, fill: 'var(--ink)' }}>
            {mode === 'tokens' ? formatTokens(total) : formatCost(total)}
          </text>
          <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'var(--font-display)', fontSize: '10px', fill: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {mode === 'tokens' ? 'total' : 'total cost'}
          </text>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {chartData.slice(0, 6).map((d, idx) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
          return (
            <div key={d.name} className="flex items-center justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <span className="flex items-center gap-2">
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: getColor(d.name, idx) }} />
                <span style={{ color: 'var(--ink)' }}>{d.name}</span>
              </span>
              <span className="font-tabular" style={{ color: 'var(--stone)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
