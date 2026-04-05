import React, { useState } from 'react';
import { api } from '../lib/api-client';
import { formatTokens, formatCost } from '../lib/formatters';
import { ProviderBadge } from './ProviderBadge';

export function SessionExplorer({ data }: { data: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const toggleSession = async (id: string) => {
    if (expanded === id) { setExpanded(null); setDetail(null); return; }
    setExpanded(id);
    setLoading(true);
    try { setDetail(await api.sessionDetail(id)); } catch { setDetail(null); }
    setLoading(false);
  };

  return (
    <div className="card overflow-hidden animate-in" style={{ animationDelay: '500ms' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Sessions</h2>
      </div>
      <div>
        {data.slice(0, 50).map((s, si) => (
          <div key={s.sessionId} style={{ borderBottom: '1px solid var(--border-hairline)' }}>
            <button
              onClick={() => toggleSession(s.sessionId)}
              className="w-full px-5 py-3 flex items-center justify-between text-left transition-colors"
              style={{ background: si % 2 === 0 ? 'var(--surface-card)' : 'var(--surface-elevated)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
              onMouseLeave={e => (e.currentTarget.style.background = si % 2 === 0 ? 'var(--surface-card)' : 'var(--surface-elevated)')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProviderBadge provider={s.provider} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)', flexShrink: 0 }}>{s.timestamp.slice(0, 10)}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.project}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)', background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>{s.model}</span>
                {s.isEstimated && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: 'var(--radius-sm)', background: 'rgba(217,119,87,0.1)', color: 'var(--accent-orange)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>est.</span>}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-tabular hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-input)' }}>{formatTokens(s.inputTokens)}</span>
                <span className="font-tabular hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-output)' }}>{formatTokens(s.outputTokens)}</span>
                <span className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--accent-orange)' }}>{formatCost(s.cost)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--stone)' }}>{s.messageCount}m</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${expanded === s.sessionId ? 'rotate-180' : ''}`} style={{ color: 'var(--stone)', transition: 'transform 0.2s var(--ease-out)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </button>
            {expanded === s.sessionId && (
              <div className="animate-fade" style={{ background: 'var(--surface-sunken)', padding: '12px 20px 16px' }}>
                {loading ? (
                  <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-5 rounded" />)}</div>
                ) : detail?.messages ? (
                  <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Time', 'Model', 'Input', 'Output', 'Cache W', 'Cache R', 'Cost'].map(h => (
                          <th key={h} className="label-upper py-1.5 px-2" style={{ textAlign: h === 'Time' || h === 'Model' ? 'left' : 'right', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.messages.map((m: any, i: number) => (
                        <tr key={i} style={{ background: i % 2 === 1 ? 'rgba(0,0,0,0.02)' : 'transparent', borderLeft: m.cost > 1 ? '2px solid var(--accent-orange)' : '2px solid transparent' }}>
                          <td className="py-1 px-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>{m.timestamp.slice(11, 19)}</td>
                          <td className="py-1 px-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink)' }}>{m.model}</td>
                          <td className="py-1 px-2 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-input)' }}>{formatTokens(m.inputTokens)}</td>
                          <td className="py-1 px-2 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-output)' }}>{formatTokens(m.outputTokens)}</td>
                          <td className="py-1 px-2 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cache-write)' }}>{formatTokens(m.cacheCreationTokens)}</td>
                          <td className="py-1 px-2 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cache-read)' }}>{formatTokens(m.cacheReadTokens)}</td>
                          <td className="py-1 px-2 font-tabular text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--accent-orange)' }}>{formatCost(m.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--stone)' }}>No details available</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
