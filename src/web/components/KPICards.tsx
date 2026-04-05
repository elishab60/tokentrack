import React, { useEffect, useRef, useState } from 'react';
import { formatTokens, formatCost } from '../lib/formatters';

interface ProviderBreakdown {
  provider: string;
  name: string;
  color: string;
  totalCost: number;
}

interface KPICardsProps {
  summary: {
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheTokens: number;
    totalCost: number;
    totalSessions: number;
    totalProjects: number;
    providerBreakdown?: ProviderBreakdown[];
  } | null;
}

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState('—');
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value === 0) { setDisplay(format(0)); return; }
    const start = ref.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(format(current));
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    }
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display}</>;
}

function SecondaryKPI({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <div className="card card-lift p-4 animate-in" style={{ animationDelay: `${delay}ms` }}>
      <p className="label-upper mb-1">{label}</p>
      <p className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 600, color, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  );
}

export function KPICards({ summary }: KPICardsProps) {
  if (!summary) return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
    </div>
  );

  const pb = summary.providerBreakdown || [];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Hero: Cost */}
      <div className="col-span-2 card card-lift p-5 animate-in" style={{ boxShadow: 'var(--shadow-glow-orange)' }}>
        <p className="label-upper mb-2" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Est. API Cost
          <span title="Estimated cost at standard API rates. Your actual bill depends on your plan (Pro, Max, Plus, API key, etc.)" style={{ cursor: 'help', opacity: 0.6, fontSize: '10px' }}>ⓘ</span>
        </p>
        <p className="font-tabular" style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 700, color: 'var(--accent-orange)', lineHeight: 1 }}>
          <AnimatedNumber value={summary.totalCost} format={formatCost} />
        </p>
        {pb.length > 0 && (
          <div className="mt-3 flex gap-4">
            {pb.map(p => (
              <span key={p.provider} className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--stone)' }}>
                <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: p.color }} />
                {p.name.replace('Claude Code', 'CC').replace('Codex', 'CX')} {formatCost(p.totalCost)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-3" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>
          <span>{summary.totalSessions} sessions</span>
          <span>{summary.totalProjects} projects</span>
        </div>
      </div>

      <SecondaryKPI label="Input" value={formatTokens(summary.totalInputTokens)} color="var(--color-input)" delay={60} />
      <SecondaryKPI label="Output" value={formatTokens(summary.totalOutputTokens)} color="var(--color-output)" delay={120} />
      <SecondaryKPI label="Cache" value={formatTokens(summary.totalCacheTokens)} color="var(--stone)" delay={180} />
    </div>
  );
}
