import React, { useState } from 'react';
import { formatTokens, formatCost } from '../lib/formatters';

interface HeatmapDay { date: string; inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number; totalCost: number; }

export function HeatmapCalendar({ data }: { data: HeatmapDay[] }) {
  const map = new Map(data.map(d => [d.date, d]));

  const dataWithDates = data.filter(d => d.date);
  if (dataWithDates.length === 0) return null;

  const dates = dataWithDates.map(d => new Date(d.date + 'T00:00:00'));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Add 1 week padding on each side
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 1);

  // Align minDate to Monday
  while (minDate.getDay() !== 1) minDate.setDate(minDate.getDate() - 1);

  const days: Array<{ date: string; total: number; data?: HeatmapDay }> = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const key = cursor.toISOString().split('T')[0];
    const entry = map.get(key);
    const total = entry ? entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens : 0;
    days.push({ date: key, total, data: entry });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxTokens = Math.max(...days.map(d => d.total), 1);

  function getColor(total: number): string {
    if (total === 0) return 'var(--surface-sunken)';
    const intensity = total / maxTokens;
    if (intensity < 0.15) return 'rgba(217,119,87,0.12)';
    if (intensity < 0.35) return 'rgba(217,119,87,0.30)';
    if (intensity < 0.6) return 'rgba(217,119,87,0.55)';
    return 'rgba(217,119,87,0.85)';
  }

  // Group into weeks — minDate is already aligned to Monday, no padding needed
  const weeks: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // Month labels
  const months: Array<{ label: string; col: number }> = [];
  let lastMonth = '';
  weeks.forEach((w, wi) => {
    for (const d of w) {
      if (!d.date) continue;
      const m = new Date(d.date + 'T00:00:00').toLocaleString('en', { month: 'short' });
      if (m !== lastMonth) { months.push({ label: m, col: wi }); lastMonth = m; }
      break;
    }
  });

  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: typeof days[0] } | null>(null);
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const CELL = 16;
  const GAP = 3;
  const CELL_STEP = CELL + GAP;

  const fmtTooltipDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="card p-5 animate-in" style={{ animationDelay: '400ms' }}>
      <h2 className="label-upper mb-4">Activity</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-0">
          {/* Day labels */}
          <div className="flex flex-col pr-2" style={{ gap: GAP, fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)' }}>
            {DAY_LABELS.map((l, i) => (
              <div key={i} style={{ height: CELL, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 24 }}>{l}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="relative">
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((w, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {w.map((day, di) => (
                    <div
                      key={di}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: day.date ? getColor(day.total) : 'transparent',
                        cursor: day.date ? 'pointer' : 'default',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={(e) => { if (day.date) setTooltip({ x: e.clientX, y: e.clientY, day }); }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
            {/* Month labels */}
            <div className="relative mt-2" style={{ height: 14, fontFamily: 'var(--font-display)', fontSize: '9px', color: 'var(--stone)' }}>
              {months.map((m, i) => (
                <span key={i} style={{ position: 'absolute', left: `${m.col * CELL_STEP}px` }}>{m.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 ml-7" style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--stone)' }}>
          <span>Less</span>
          {[0, 0.12, 0.30, 0.55, 0.85].map((o, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i === 0 ? 'var(--surface-sunken)' : `rgba(217,119,87,${o})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
      {tooltip && tooltip.day.date && (
        <div className="fixed z-50 pointer-events-none" style={{ left: tooltip.x + 12, top: tooltip.y - 50, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: '8px 12px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{fmtTooltipDate(tooltip.day.date)}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--stone)' }}>{formatTokens(tooltip.day.total)} tokens</p>
          {tooltip.day.data && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-orange)' }}>{formatCost(tooltip.day.data.totalCost)}</p>}
        </div>
      )}
    </div>
  );
}
