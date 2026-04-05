import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onRangeChange: (from: string, to: string) => void;
}

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
const todayStr = () => new Date().toISOString().split('T')[0];

function fmtShort(iso: string): string {
  if (!iso) return '∞';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function CalendarMonth({ year, month, from, to, onSelect }: {
  year: number; month: number; from: string; to: string;
  onSelect: (date: string) => void;
}) {
  const days = getDaysInMonth(year, month);
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)', padding: '4px 0 8px' }}>
        {monthName}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, textAlign: 'center' }}>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <span key={d} style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: 'var(--stone)', padding: '2px 0 4px', fontWeight: 500 }}>{d}</span>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const inRange = from && to && date >= from && date <= to;
          const isStart = date === from;
          const isEnd = date === to;
          const isToday = date === todayStr();

          return (
            <button
              key={day}
              onClick={() => onSelect(date)}
              style={{
                width: 32, height: 28, border: 'none', cursor: 'pointer',
                borderRadius: isStart || isEnd ? 'var(--radius-sm)' : 2,
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                background: isStart || isEnd ? 'var(--accent-orange)' : inRange ? 'rgba(217,119,87,0.12)' : 'transparent',
                color: isStart || isEnd ? '#fff' : isToday ? 'var(--accent-orange)' : 'var(--ink)',
                fontWeight: isStart || isEnd || isToday ? 600 : 400,
                transition: 'background 80ms',
              }}
              onMouseEnter={e => { if (!isStart && !isEnd) e.currentTarget.style.background = 'var(--surface-elevated)'; }}
              onMouseLeave={e => { if (!isStart && !isEnd) e.currentTarget.style.background = inRange ? 'rgba(217,119,87,0.12)' : 'transparent'; }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ from, to, onFromChange, onToChange, onRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<'from' | 'to'>('from');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Current view: show 2 months (current and previous)
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = (date: string) => {
    if (selecting === 'from' || (!from && !to) || (from && to)) {
      onFromChange(date);
      onToChange('');
      setSelecting('to');
    } else {
      if (date < from) {
        onFromChange(date);
        onToChange(from);
      } else {
        onToChange(date);
      }
      setSelecting('from');
      setOpen(false);
    }
  };

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goForward = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Quick ranges
  const td = todayStr();
  const ranges = [
    { label: '7d', from: daysAgo(7), to: td },
    { label: '30d', from: daysAgo(30), to: td },
    { label: '90d', from: daysAgo(90), to: td },
    { label: 'All', from: '', to: '' },
  ];
  const activeRange = !from && !to ? 'All' : ranges.find(r => r.from === from && (r.to === to || (!to && r.to === td)))?.label || '';

  const displayText = !from && !to ? 'All time' : `${fmtShort(from)} → ${fmtShort(to || td)}`;

  const calendarMenu = open && createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        background: 'var(--surface-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
        zIndex: 9999, padding: 16, width: 520,
        animation: 'fadeInUp 0.12s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '16px' }}>‹</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
          {selecting === 'from' ? 'Select start date' : 'Select end date'}
        </span>
        <button onClick={goForward} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '16px' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <CalendarMonth year={prevYear} month={prevMonth} from={from} to={to || td} onSelect={handleSelect} />
        <CalendarMonth year={viewYear} month={viewMonth} from={from} to={to || td} onSelect={handleSelect} />
      </div>
    </div>,
    document.body,
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', height: 36,
          background: (from || to) ? 'rgba(217,119,87,0.06)' : 'var(--surface-card)',
          border: `1px solid ${open || from || to ? 'var(--accent-orange)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
          color: 'var(--ink)', cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
          transition: 'border-color 150ms, box-shadow 150ms',
          boxShadow: open ? '0 0 0 2px rgba(217,119,87,0.15)' : 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--stone)', flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {displayText}
      </button>

      <div style={{ display: 'flex', gap: 2 }}>
        {ranges.map(r => (
          <button
            key={r.label}
            onClick={() => { onRangeChange(r.from, r.to); setOpen(false); }}
            style={{
              padding: '5px 10px', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 600,
              background: activeRange === r.label ? 'rgba(217,119,87,0.12)' : 'transparent',
              color: activeRange === r.label ? 'var(--accent-orange)' : 'var(--stone)',
              transition: 'all 150ms',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {calendarMenu}
    </div>
  );
}
