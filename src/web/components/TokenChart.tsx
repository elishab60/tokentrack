import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFilterParams } from '../hooks/useFilters';
import { api } from '../lib/api-client';
import { formatTokens, formatCost } from '../lib/formatters';

type Granularity = 'day' | 'week' | 'month';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  const cost = payload[0]?.payload?.totalCost || 0;
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '12px 16px' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-tabular" style={{ color: 'var(--ink)' }}>{formatTokens(p.value)}</span>
        </div>
      ))}
      <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex justify-between gap-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ color: 'var(--stone)' }}>Total</span>
          <span className="font-tabular" style={{ fontWeight: 600, color: 'var(--ink)' }}>{formatTokens(total)}</span>
        </div>
        <div className="flex justify-between gap-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ color: 'var(--stone)' }}>Cost</span>
          <span className="font-tabular" style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{formatCost(cost)}</span>
        </div>
      </div>
    </div>
  );
}

export function TokenChart({ data: dailyData }: { data: any[] }) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [data, setData] = useState(dailyData);
  const params = useFilterParams();

  const handleGranularity = async (g: Granularity) => {
    setGranularity(g);
    if (g === 'day') setData(dailyData);
    else if (g === 'week') setData(await api.weekly(params));
    else setData(await api.monthly(params));
  };

  React.useEffect(() => { setData(dailyData); setGranularity('day'); }, [dailyData]);

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '250ms' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Usage Over Time</h2>
        <div className="seg-control">
          {(['day', 'week', 'month'] as Granularity[]).map(g => (
            <button key={g} onClick={() => handleGranularity(g)} className={`seg-btn ${granularity === g ? 'active' : ''}`}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '8px 0 0 0' }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="gInput" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-input)" stopOpacity={0.25}/><stop offset="100%" stopColor="var(--color-input)" stopOpacity={0}/></linearGradient>
              <linearGradient id="gOutput" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-output)" stopOpacity={0.3}/><stop offset="100%" stopColor="var(--color-output)" stopOpacity={0}/></linearGradient>
              <linearGradient id="gCacheW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cache-write)" stopOpacity={0.25}/><stop offset="100%" stopColor="var(--color-cache-write)" stopOpacity={0}/></linearGradient>
              <linearGradient id="gCacheR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-cache-read)" stopOpacity={0.15}/><stop offset="100%" stopColor="var(--color-cache-read)" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border-hairline)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'var(--font-display)', fill: 'var(--stone)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatTokens} tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--stone)' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="cacheReadTokens" name="Cache Read" stackId="1" stroke="var(--color-cache-read)" strokeWidth={1.5} fill="url(#gCacheR)" animationDuration={800} />
            <Area type="monotone" dataKey="cacheCreationTokens" name="Cache Write" stackId="1" stroke="var(--color-cache-write)" strokeWidth={1.5} fill="url(#gCacheW)" animationDuration={800} animationBegin={100} />
            <Area type="monotone" dataKey="outputTokens" name="Output" stackId="1" stroke="var(--color-output)" strokeWidth={1.5} fill="url(#gOutput)" animationDuration={800} animationBegin={200} />
            <Area type="monotone" dataKey="inputTokens" name="Input" stackId="1" stroke="var(--color-input)" strokeWidth={1.5} fill="url(#gInput)" animationDuration={800} animationBegin={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-5 mt-3 px-2">
        {[
          { key: 'Cache Read', color: 'var(--color-cache-read)' },
          { key: 'Cache Write', color: 'var(--color-cache-write)' },
          { key: 'Output', color: 'var(--color-output)' },
          { key: 'Input', color: 'var(--color-input)' },
        ].map(l => (
          <span key={l.key} className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--stone)' }}>
            <span className="w-[6px] h-[6px] rounded-full" style={{ background: l.color }} />
            {l.key}
          </span>
        ))}
      </div>
    </div>
  );
}
