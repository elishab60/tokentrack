import React from 'react';
import { formatCost } from '../lib/formatters';

export function CostChart({ data }: { data: any[] }) {
  const maxCost = Math.max(...data.map(d => d.totalCost), 1);
  const items = data.slice(0, 8);

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '350ms' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Cost by Project</h2>
      <div className="space-y-3">
        {items.map((d, i) => {
          const pct = (d.totalCost / maxCost) * 100;
          return (
            <div key={d.project || d.model || i}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 500, color: 'var(--ink)' }}>{d.project || d.model}</span>
                <span className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--accent-orange)' }}>{formatCost(d.totalCost)}</span>
              </div>
              <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `var(--accent-orange)`,
                    opacity: 1 - (i * 0.08),
                    transition: 'width 0.6s var(--ease-out)',
                    animation: 'growWidth 0.8s var(--ease-out) both',
                    animationDelay: `${400 + i * 50}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
        {data.length > 8 && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--stone)', textAlign: 'center', marginTop: 8 }}>
            +{data.length - 8} more projects
          </p>
        )}
      </div>
    </div>
  );
}
