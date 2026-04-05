import React from 'react';
import { formatTokens, formatCost } from '../lib/formatters';
import { ProviderBadge } from './ProviderBadge';

export function ProjectList({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>('totalCost');
  const [sortAsc, setSortAsc] = React.useState(false);

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const arrow = (key: string) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : '';

  return (
    <div className="card overflow-hidden animate-in" style={{ animationDelay: '450ms' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Projects</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { key: 'project', label: 'Project', align: 'left' },
                { key: '', label: 'Provider', align: 'left' },
                { key: 'sessions', label: 'Sessions', align: 'right' },
                { key: 'inputTokens', label: 'Input', align: 'right' },
                { key: 'outputTokens', label: 'Output', align: 'right' },
                { key: 'cacheTokens', label: 'Cache', align: 'right' },
                { key: 'totalCost', label: 'Cost', align: 'right' },
                { key: 'lastActivity', label: 'Last Active', align: 'right' },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && toggleSort(col.key)}
                  className="label-upper px-4 py-2.5 select-none"
                  style={{ textAlign: col.align as any, cursor: col.key ? 'pointer' : 'default', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}
                >
                  {col.label}{arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr
                key={p.project}
                style={{ background: i % 2 === 0 ? 'var(--surface-card)' : 'var(--surface-elevated)', transition: 'background var(--duration-fast)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-card)' : 'var(--surface-elevated)')}
              >
                <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>{p.project}</td>
                <td className="px-4 py-2.5"><div className="flex gap-1">{(p.providers||[]).map((pr: string) => <ProviderBadge key={pr} provider={pr} />)}</div></td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--stone)' }}>{p.sessions}</td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-input)' }}>{formatTokens(p.inputTokens)}</td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-output)' }}>{formatTokens(p.outputTokens)}</td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--stone)' }}>{formatTokens(p.cacheTokens)}</td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--accent-orange)' }}>{formatCost(p.totalCost)}</td>
                <td className="px-4 py-2.5 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>{p.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
