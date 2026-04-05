import React from 'react';
import { formatTokens, formatCost } from '../lib/formatters';

export function ProviderComparison({ data }: { data: any[] }) {
  if (!data || data.length < 2) return null;

  const totalCost = data.reduce((s: number, d: any) => s + d.totalCost, 0);
  const COLORS: Record<string, string> = { 'Claude Code': 'var(--provider-cc)', 'Codex': 'var(--provider-cx)', 'Antigravity': '#4285f4' };

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '200ms' }}>
      <h2 className="label-upper mb-4">Provider Breakdown</h2>
      {/* Stacked bar */}
      <div className="flex rounded overflow-hidden h-3 mb-4" style={{ background: 'var(--surface-sunken)' }}>
        {data.map((d: any) => {
          const pct = totalCost > 0 ? (d.totalCost / totalCost) * 100 : 0;
          return (
            <div
              key={d.name}
              style={{ width: `${pct}%`, background: COLORS[d.name] || 'var(--stone)', transition: 'width 0.6s var(--ease-out)' }}
            />
          );
        })}
      </div>
      {/* Provider rows */}
      <div className="space-y-3">
        {data.map((d: any) => {
          const pct = totalCost > 0 ? ((d.totalCost / totalCost) * 100).toFixed(0) : '0';
          const totalTokens = (d.inputTokens || 0) + (d.outputTokens || 0) + (d.cacheTokens || 0);
          return (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[d.name] || 'var(--stone)' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{d.name}</span>
                <span className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>
                  {formatTokens(totalTokens)} tokens
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--accent-orange)' }}>
                  {formatCost(d.totalCost)}
                </span>
                <span className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', width: '32px', textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
